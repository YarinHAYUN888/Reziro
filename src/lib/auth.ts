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

/** Ensure a row exists in public.profiles for this user (id = auth.users.id). Call after signIn/signUp and on session restore. */
export async function ensureProfile(user: User): Promise<void> {
  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? '',
      full_name: (user.user_metadata?.full_name as string) ?? '',
      hotel_name: (user.user_metadata?.hotel_name as string) ?? '',
    },
    { onConflict: 'id' }
  );
  if (error) {
    console.warn('[auth] ensureProfile failed:', error.message);
  }
}
