import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export async function getSession(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export type ProfilePayload = {
  first_name?: string;
  last_name?: string;
  hotel_role?: string;
};

/** Ensure a row exists in public.profiles for this user (id = auth.users.id). Call after signIn/signUp and on session restore. */
export async function ensureProfile(user: User, profile?: ProfilePayload): Promise<void> {
  const row: Record<string, unknown> = {
    id: user.id,
    email: user.email ?? '',
    full_name: (user.user_metadata?.full_name as string) ?? '',
    hotel_name: (user.user_metadata?.hotel_name as string) ?? '',
  };
  if (profile) {
    if (profile.first_name != null) row.first_name = profile.first_name;
    if (profile.last_name != null) row.last_name = profile.last_name;
    if (profile.hotel_role != null) row.hotel_role = profile.hotel_role;
  }
  const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
  if (error) {
    console.warn('[auth] ensureProfile failed:', error.message);
  }
}

/** Load profile for the current user from Supabase. Returns first_name, last_name, hotel_role. */
export async function loadProfile(userId: string): Promise<ProfilePayload | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('first_name, last_name, hotel_role')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return {
    first_name: data.first_name ?? undefined,
    last_name: data.last_name ?? undefined,
    hotel_role: data.hotel_role ?? undefined,
  };
}
