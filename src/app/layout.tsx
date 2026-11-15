import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Suspense } from "react";
import { Providers } from "@/components/layout/Providers";
import { APPEARANCE_INIT_SCRIPT } from "@/lib/appearance";
import "./globals.css";

// Основной шрифт приложения: дружелюбный гротеск с поддержкой кыргызских букв (ң, ө, ү).
const appFont = Manrope({
  variable: "--font-app",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
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
      className={`${appFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Акцентный цвет и вид меню применяются до отрисовки, без мигания. */}
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_INIT_SCRIPT }} />
        <Providers>
          <Suspense fallback={<div className="min-h-screen" aria-hidden="true" />}>
            {children}
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
