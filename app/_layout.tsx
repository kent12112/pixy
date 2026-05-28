import '../global.css';
import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 } },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [navReady, setNavReady] = useState(false);
  useAuth(); // bootstraps session listener

  // Wait one tick for the navigator to mount before attempting redirects
  useEffect(() => {
    const t = setTimeout(() => setNavReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    console.log('[AuthGate]', { navReady, isLoading, user: user?.id, segments });
    if (!navReady || isLoading) return;
    const inAuth = segments[0] === '(auth)';
    console.log('[AuthGate] navigating', { inAuth, hasUser: !!user });
    if (!user && !inAuth) {
      router.replace('/(auth)/welcome');
    } else if (user && (inAuth || segments.length === 0)) {
      if (user.role === 'photographer') {
        router.replace('/(photographer)/dashboard');
      } else {
        router.replace('/(client)/map');
      }
    }
  }, [user, isLoading, segments, navReady]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(client)" />
            <Stack.Screen name="(photographer)" />
            <Stack.Screen name="photographer/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="booking/[photographerId]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="order/[id]" options={{ presentation: 'card' }} />
          </Stack>
          <StatusBar style="dark" />
        </AuthGate>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
