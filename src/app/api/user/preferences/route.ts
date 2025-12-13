import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Json } from '@/types/supabase';

export interface UserPreferences {
  welcomeCard: {
    show: boolean;
    showHebrewDate: boolean;
    showWeddingsToday: boolean;
    showPendingTransfers: boolean;
    showPendingApplicants: boolean;
    showUrgentAlerts: boolean;
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  welcomeCard: {
    show: true,
    showHebrewDate: true,
    showWeddingsToday: true,
    showPendingTransfers: true,
    showPendingApplicants: false,
    showUrgentAlerts: false,
  },
};

/**
 * GET /api/user/preferences
 * Get current user's preferences
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    // Merge with defaults to ensure all keys exist
    const storedPrefs = (profile?.preferences || {}) as Partial<UserPreferences>;
    const storedWelcomeCard = storedPrefs?.welcomeCard || {};

    const preferences: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...storedPrefs,
      welcomeCard: {
        ...DEFAULT_PREFERENCES.welcomeCard,
        ...storedWelcomeCard,
      },
    };

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error in GET /api/user/preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/preferences
 * Update current user's preferences (partial update)
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();

    // Get current preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    // Deep merge preferences
    const currentPreferences = (profile?.preferences || DEFAULT_PREFERENCES) as UserPreferences;
    const currentWelcomeCard = currentPreferences.welcomeCard || DEFAULT_PREFERENCES.welcomeCard;

    const newPreferences: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...currentPreferences,
      ...updates,
      welcomeCard: {
        ...DEFAULT_PREFERENCES.welcomeCard,
        ...currentWelcomeCard,
        ...(updates.welcomeCard || {}),
      },
    };

    // Update preferences
    const { error } = await supabase
      .from('profiles')
      .update({
        preferences: newPreferences as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json(newPreferences);
  } catch (error) {
    console.error('Error in PATCH /api/user/preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
