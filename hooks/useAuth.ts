import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { session, user, isLoading, setSession, setUser, setLoading, signOut } = useAuthStore();

  useEffect(() => {
    // Safety net — unblock navigation if Supabase never responds
    const timeout = setTimeout(() => setLoading(false), 5000);

    supabase.auth.getSession()
      .then(({ data: { session } }: { data: { session: any } }) => {
        clearTimeout(timeout);
        setSession(session);
        if (session?.user) fetchUser(session.user.id);
        else setLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      if (session?.user) fetchUser(session.user.id);
      else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUser(id: string) {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      if (data) setUser(data as any);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function register(email: string, password: string, fullName: string, role: 'client' | 'photographer') {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });
    if (error) throw error;
  }

  async function logout() {
    await supabase.auth.signOut();
    signOut();
  }

  return { session, user, isLoading, login, register, logout };
}
