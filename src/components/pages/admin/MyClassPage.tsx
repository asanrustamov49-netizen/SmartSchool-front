"use client";

import { useTranslations } from "next-intl";
import { DataState } from "@/components/ui/DataState";
import { useCurrentUser } from "@/hooks/useAuth";
import { ClassCredentials } from "./ClassCredentials";
import styles from "./admin.module.scss";

// «Мой класс» классного руководителя: логины и временные пароли учеников своего класса.
// Классы руководителя приходят в /me (classes_led).
export function MyClassPage() {
  const t = useTranslations("credentials");
  const classesLed = useCurrentUser().data?.classes_led ?? [];

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{t("myClassTitle")}</h1>
          <p>{t("myClassDescription")}</p>
        </div>
      </header>

      {classesLed.length === 0 ? (
        <DataState status="empty" message={t("noClassLed")} />
      ) : (
        classesLed.map((schoolClass) => <ClassCredentials key={schoolClass.id} classId={schoolClass.id} />)
      )}
    </div>
  );
}
