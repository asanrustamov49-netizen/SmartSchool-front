import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import { Suspense } from "react";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

// Основной шрифт приложения: дружелюбный гротеск с поддержкой кыргызских букв (ң, ө, ү).
const appFont = Manrope({
  variable: "--font-app",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Smart School",
    template: "%s | Smart School",
  },
  description: "Цифровая образовательная платформа для школ Кыргызстана.",
  applicationName: "Smart School",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ky"
      className={`${appFont.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
            {children}
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
