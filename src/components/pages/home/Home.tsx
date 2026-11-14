import { getTranslations } from "next-intl/server";
import { School, Sparkles, Trophy } from "lucide-react";
import { RoleDashboard } from "./RoleDashboard";
import scss from "./home.module.scss";

const Home = async () => {
  const t = await getTranslations("dashboard");

  return (
    <div className={scss.home}>
      <header className={scss.hero}>
        <div className={scss.heroCopy}>
          <span className={scss.heroBrand}>
            <School size={17} strokeWidth={2} aria-hidden="true" />
            Smart School
          </span>
          <h1>{t("title")}</h1>
          <p>{t("welcome")}</p>
          <span className={scss.heroMessage}>
            <Trophy size={15} aria-hidden="true" />
            {t("heroMessage")}
          </span>
        </div>
        <div className={scss.heroArtwork} aria-hidden="true">
          <div className={scss.heroOrbit} />
          <div className={scss.heroSchool}>
            <School size={84} strokeWidth={1.2} />
          </div>
          <Sparkles className={scss.heroSparkle} size={20} />
        </div>
      </header>

      <RoleDashboard />
    </div>
  );
};

export default Home;
