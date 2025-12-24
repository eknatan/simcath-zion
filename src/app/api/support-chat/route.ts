/**
 * Support Chat API Route
 *
 * Handles chat messages for the support chatbot using Groq AI (Llama 3.3 70B).
 * Loads API keys from database settings.
 * Includes rate limiting and conversation history support.
 */

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { generateSystemPrompt } from '@/lib/support-chat/system-prompt';
import { settingsService } from '@/lib/settings/settings-service';

// Rate limiter for support chat (lazy initialization)
let supportChatLimiter: Ratelimit | null = null;

function getSupportChatLimiter(): Ratelimit | null {
  if (supportChatLimiter) return supportChatLimiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('Support chat rate limiting disabled: Missing Upstash credentials');
    return null;
  }

  supportChatLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(30, '1 h'), // 30 messages per hour
    analytics: true,
    prefix: 'ratelimit:support-chat',
  });

  return supportChatLimiter;
}

// Request validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  currentPath: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).max(20).optional(),
});

/**
 * Load Groq API key from database settings
 */
async function getGroqApiKey(): Promise<string | null> {
  try {
    const apiKeysSetting = await settingsService.getSetting('translation_api_keys');
    const apiKeys = apiKeysSetting as { groq_api_key?: string } | null;
    return apiKeys?.groq_api_key || null;
  } catch (error) {
    console.error('Failed to load API keys from DB:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Load API key from database
    const groqApiKey = await getGroqApiKey();

    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'שירות התמיכה לא מוגדר. פנה למנהל המערכת.' },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = chatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { message, currentPath, history = [] } = validationResult.data;

    // Rate limiting (use IP as identifier for public access)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'anonymous';

    const limiter = getSupportChatLimiter();
    if (limiter) {
      const rateLimitResult = await limiter.limit(ip);
      if (!rateLimitResult.success) {
        return NextResponse.json(
          {
            error: 'הגעת למגבלת ההודעות. נסה שוב מאוחר יותר.',
            remaining: 0,
            reset: rateLimitResult.reset
          },
          { status: 429 }
        );
      }
    }

    // Initialize Groq client
    const groq = new Groq({ apiKey: groqApiKey });

    // Build system prompt with page context
    const systemPrompt = generateSystemPrompt(currentPath);

    // Build messages array for Groq
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history
    for (const msg of history) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    // Generate response using Groq (Llama 3.3 70B)
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.95,
    });

    const responseText = completion.choices[0]?.message?.content || 'מצטער, לא הצלחתי לענות. נסה שוב.';

    return NextResponse.json({
      success: true,
      message: responseText.trim(),
    });

  } catch (error) {
    console.error('Support chat error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API_KEY') || error.message.includes('401')) {
        return NextResponse.json(
          { error: 'שגיאת אימות בשירות. פנה למנהל המערכת.' },
          { status: 503 }
        );
      }
      if (error.message.includes('rate') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'השירות עמוס כרגע. נסה שוב בעוד דקה.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'שגיאה בעיבוד ההודעה. נסה שוב.' },
      { status: 500 }
    );
  }
}
