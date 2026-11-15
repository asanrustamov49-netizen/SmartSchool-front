import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Landing from "@/components/pages/landing/Landing";
import { routing } from "@/i18n/routing";

type WelcomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: WelcomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing.meta" });

  const languages = Object.fromEntries(
    routing.locales.map((item) => [item, `/${item}/welcome`]),
  );

  return {
    title: { absolute: t("title") },
    description: t("description"),
    alternates: {
      canonical: `/${locale}/welcome`,
      languages,
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale: locale === "ky" ? "ky_KG" : "ru_RU",
      siteName: "Smart School",
    },
  };
}

// locale передаётся явно: без этого при переключении языка на клиенте
// лендинг оставался на прежнем языке до перезагрузки страницы.
const page = async ({ params }: WelcomePageProps) => {
  const { locale } = await params;
  return <Landing locale={locale} />;
};

export default page;
