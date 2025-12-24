'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MessageCircleQuestion, Send, Loader2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'support-chat-history';
const MAX_MESSAGES = 50;

// Page name to path mapping for creating clickable links
const PAGE_LINKS: Record<string, string> = {
  'דשבורד': '/he/dashboard',
  'בקשות ממתינות': '/he/applicants/pending',
  'רשימת תיקים': '/he/cases',
  'תיקים': '/he/cases',
  'העברות בנקאיות': '/he/transfers',
  'העברות ידניות': '/he/manual-transfers',
  'לוח שנה': '/he/calendar',
  'הגדרות': '/he/settings',
  'עמוד ההגדרות': '/he/settings',
  'עמוד התיקים': '/he/cases',
  'עמוד ההעברות': '/he/transfers',
};

/**
 * Parses text and converts page names to links
 */
function parseLinks(
  text: string,
  onNavigate: () => void,
  keyPrefix: string,
  isBold: boolean = false
): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let keyCounter = 0;

  // Sort page names by length (longest first) to avoid partial matches
  const sortedPageNames = Object.keys(PAGE_LINKS).sort((a, b) => b.length - a.length);
  const pagePattern = new RegExp(
    `(${sortedPageNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'g'
  );

  let lastIndex = 0;
  let match;

  while ((match = pagePattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      result.push(
        isBold
          ? <strong key={`${keyPrefix}-${keyCounter++}`}>{textBefore}</strong>
          : <span key={`${keyPrefix}-${keyCounter++}`}>{textBefore}</span>
      );
    }

    // Add the link
    result.push(
      <Link
        key={`${keyPrefix}-${keyCounter++}`}
        href={PAGE_LINKS[match[0]]}
        onClick={onNavigate}
        className={cn(
          "text-primary underline underline-offset-2 hover:text-primary/80",
          isBold ? "font-bold" : "font-medium"
        )}
      >
        {match[0]}
      </Link>
    );

    lastIndex = pagePattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    result.push(
      isBold
        ? <strong key={`${keyPrefix}-${keyCounter++}`}>{remaining}</strong>
        : <span key={`${keyPrefix}-${keyCounter++}`}>{remaining}</span>
    );
  }

  // If no matches found, return the whole text
  if (result.length === 0) {
    result.push(
      isBold
        ? <strong key={`${keyPrefix}-0`}>{text}</strong>
        : <span key={`${keyPrefix}-0`}>{text}</span>
    );
  }

  return result;
}

/**
 * Parses markdown-style formatting and page links
 */
function parseMessageContent(
  content: string,
  onNavigate: () => void
): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let keyCounter = 0;

  // Pattern for bold text (**text**)
  const boldPattern = /(\*\*[^*]+\*\*)/g;

  let lastIndex = 0;
  let match;

  while ((match = boldPattern.exec(content)) !== null) {
    // Add text before the match (with link parsing)
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      result.push(...parseLinks(textBefore, onNavigate, `text-${keyCounter++}`, false));
    }

    // Process bold content (remove ** and parse links inside)
    const boldContent = match[0].slice(2, -2);
    result.push(...parseLinks(boldContent, onNavigate, `bold-${keyCounter++}`, true));

    lastIndex = boldPattern.lastIndex;
  }

  // Add remaining text (with link parsing)
  if (lastIndex < content.length) {
    const remaining = content.slice(lastIndex);
    result.push(...parseLinks(remaining, onNavigate, `end-${keyCounter++}`, false));
  }

  // If no bold found, just parse links
  if (result.length === 0) {
    return parseLinks(content, onNavigate, 'plain', false);
  }

  return result;
}

/**
 * Renders message content with clickable page links and markdown formatting
 */
function MessageContent({
  content,
  onNavigate
}: {
  content: string;
  onNavigate: () => void;
}) {
  const parsedContent = parseMessageContent(content, onNavigate);

  return (
    <span className="whitespace-pre-wrap leading-relaxed">
      {parsedContent}
    </span>
  );
}

/**
 * Support Chat Component
 *
 * A floating chat widget that provides AI-powered support for users.
 * Uses Gemini AI to answer questions about the system.
 */
export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // Keep only last MAX_MESSAGES
        const toStore = messages.slice(-MAX_MESSAGES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      } catch (e) {
        console.error('Failed to save chat history:', e);
      }
    }
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when sheet opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setError(null);
    setInput('');

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedInput,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Prepare history for API (last 10 messages for context)
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedInput,
          currentPath: pathname,
          history,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחת ההודעה');
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, pathname]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      {/* FAB Button */}
      <Button
        onClick={() => setIsOpen(true)}
        size="icon-lg"
        className={cn(
          'fixed bottom-6 end-6 z-40 size-14 rounded-full shadow-lg',
          'bg-primary hover:bg-primary/90 hover:shadow-xl hover:scale-105',
          'transition-all duration-200'
        )}
        aria-label="פתח צ'אט תמיכה"
      >
        <MessageCircleQuestion className="size-6" />
      </Button>

      {/* Chat Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="left"
          className="flex w-full flex-col p-0 sm:max-w-md"
        >
          {/* Header */}
          <SheetHeader className="border-b px-4 py-3 pe-12">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg">עזרה ותמיכה</SheetTitle>
                <SheetDescription className="text-xs">
                  שאל אותי על השימוש במערכת
                </SheetDescription>
              </div>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={clearHistory}
                  className="text-muted-foreground hover:text-destructive"
                  title="נקה היסטוריה"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </SheetHeader>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <MessageCircleQuestion className="text-muted-foreground/50 mb-3 size-12" />
                <p className="text-muted-foreground text-sm">
                  היי! איך אפשר לעזור?
                </p>
                <p className="text-muted-foreground/70 mt-1 text-xs">
                  שאל אותי כל שאלה על המערכת
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {[
                    'איך מוסיפים תיק?',
                    'איך מאשרים בקשה?',
                    'איך מייצאים העברות?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="bg-secondary hover:bg-secondary/80 rounded-full px-3 py-1.5 text-xs transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-ee-sm'
                          : 'bg-secondary text-secondary-foreground rounded-es-sm'
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <MessageContent
                          content={message.content}
                          onNavigate={() => setIsOpen(false)}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary text-secondary-foreground flex items-center gap-2 rounded-2xl rounded-es-sm px-4 py-2.5 text-sm">
                      <Loader2 className="size-4 animate-spin" />
                      <span>חושב...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <X className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="bg-secondary/50 flex items-end gap-2 rounded-xl p-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="הקלד שאלה..."
                rows={1}
                className="max-h-24 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="shrink-0 rounded-lg"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground/70 mt-2 text-center text-xs">
              AI עוזר - ייתכנו טעויות
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
