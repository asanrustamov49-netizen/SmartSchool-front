'use client';

import { getQueryClient } from '@/lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { THEME_STORAGE_KEY } from '@/lib/appearance';
import { ReactNode, useState } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Инициализируем клиент один раз на стороне клиента
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        storageKey={THEME_STORAGE_KEY}
      >
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
