"use client";

import { ArrowLeft, Check, ChevronDown, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState } from "react";
import type { ProgramTopic } from "@/apis/programs.api";
import { DataState } from "@/components/ui/DataState";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useClassProgram, useUpdateTopicProgress } from "@/hooks/usePrograms";
import { Link } from "@/i18n/navigation";
import { handleApiError } from "@/lib/errorHandler";
import { cn } from "@/lib/utils";
import adminStyles from "../admin/admin.module.scss";
import styles from "./programs.module.scss";

type Filter = "all" | "left" | "done";
const FILTERS: Filter[] = ["all", "left", "done"];

// Ссылки в материалах кликабельны, остальной текст выводится как есть.
function Materials({ text }: { text: string }) {
  return (
    <p className={styles.materials}>
      {text.split(/(\s+)/).map((part, index) =>
        /^https?:\/\//.test(part) ? (
          <a key={index} href={part} target="_blank" rel="noopener noreferrer">
            {part.replace(/^https?:\/\//, "")}
            <ExternalLink size={12} aria-hidden="true" />
          </a>
        ) : (
          part
        ),
      )}
    </p>
  );
}

// Темы по разделам в порядке программы (раздел «без названия» — общий список).
function groupBySection(topics: ProgramTopic[]) {
  const groups: { section: string | null; topics: ProgramTopic[] }[] = [];
  for (const topic of topics) {
    const last = groups[groups.length - 1];
    if (last && last.section === topic.section) {
      last.topics.push(topic);
    } else {
      groups.push({ section: topic.section, topics: [topic] });
    }
  }
  return groups;
}

// Программа предмета для одного класса: темы по разделам, отметка «пройдено» одним нажатием,
// цели, материалы и заметка учителя — в раскрывающейся строке темы.
export function ProgramPage() {
  const t = useTranslations("programs");
  const tApiErrors = useTranslations("apiErrors");
  const { formatDate } = useDateFormat();
  const params = useParams<{ classId: string; subjectId: string }>();
  const classId = Number(params.classId);
  const subjectId = Number(params.subjectId);
  const programQuery = useClassProgram(classId, subjectId);
  const updateProgress = useUpdateTopicProgress(classId, subjectId);
  const [filter, setFilter] = useState<Filter>("all");
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});

  if (programQuery.isPending) {
    return <DataState status="loading" />;
  }
  if (programQuery.isError) {
    return (
      <DataState
        status="error"
        message={handleApiError(programQuery.error, tApiErrors)}
        onRetry={() => programQuery.refetch()}
      />
    );
  }

  const program = programQuery.data;
  const topics = program.topics;
  const doneCount = topics.filter((topic) => topic.done_on).length;
  const percent = topics.length > 0 ? Math.round((doneCount / topics.length) * 100) : 0;
  const plannedCount = topics.filter((topic) => topic.week !== null && topic.week <= program.current_week).length;
  const behind = Math.max(0, plannedCount - doneCount);
  const currentTopic = topics.find((topic) => !topic.done_on);
  const visibleTopics = topics.filter(
    (topic) => filter === "all" || (filter === "done" ? topic.done_on : !topic.done_on),
  );

  const toggle = (topic: ProgramTopic) =>
    updateProgress.mutate({ topicId: topic.id, data: { done: !topic.done_on, note: topic.note } });

  const saveNote = (topic: ProgramTopic) => {
    const draft = noteDrafts[topic.id];
    if (draft === undefined || draft === (topic.note ?? "")) {
      return;
    }
    updateProgress.mutate({ topicId: topic.id, data: { done: true, note: draft.trim() || null } });
  };

  return (
    <div className={adminStyles.page}>
      <Link href="/programs" className={styles.backLink}>
        <ArrowLeft size={16} aria-hidden="true" />
        {t("allPrograms")}
      </Link>

      <header className={styles.programHeader}>
        <div>
          <h1>
            {program.subject_name} <span className={styles.classChip}>{program.class_name}</span>
          </h1>
          <p>{t("week", { week: program.current_week })}</p>
        </div>
        {topics.length > 0 && (
          <div className={styles.summary}>
            <strong>{percent}%</strong>
            <span>{t("topicsDone", { done: doneCount, total: topics.length })}</span>
            <span className={cn(styles.status, behind > 0 ? styles.statusBehind : styles.statusOk)}>
              {behind > 0 ? t("behind", { count: behind }) : t("onTrack")}
            </span>
          </div>
        )}
      </header>

      {topics.length === 0 ? (
        <DataState status="empty" message={t("noTopics")} />
      ) : (
        <>
          <div className={styles.progress} aria-hidden="true">
            <span style={{ width: `${percent}%` }} />
          </div>

          <div className={styles.filters} role="tablist" aria-label={t("filterLabel")}>
            {FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                className={cn(styles.filter, filter === value && styles.filterActive)}
                onClick={() => setFilter(value)}
              >
                {t(`filters.${value}`)}
              </button>
            ))}
          </div>

          {updateProgress.isError && (
            <p className={adminStyles.formError} role="alert">
              {handleApiError(updateProgress.error, tApiErrors)}
            </p>
          )}

          {visibleTopics.length === 0 ? (
            <DataState status="empty" message={t("nothingHere")} />
          ) : (
            groupBySection(visibleTopics).map((group, groupIndex) => (
              <section key={`${group.section}-${groupIndex}`} className={styles.section}>
                {group.section && <h2 className={styles.sectionTitle}>{group.section}</h2>}
                <ol className={styles.topics}>
                  {group.topics.map((topic) => {
                    const isCurrent = topic.id === currentTopic?.id;
                    const isLate = !topic.done_on && topic.week !== null && topic.week < program.current_week;
                    return (
                      <li
                        key={topic.id}
                        className={cn(styles.topic, topic.done_on && styles.topicDone, isCurrent && styles.topicCurrent)}
                      >
                        <button
                          type="button"
                          className={styles.check}
                          aria-pressed={Boolean(topic.done_on)}
                          aria-label={topic.done_on ? t("unmark", { title: topic.title }) : t("mark", { title: topic.title })}
                          onClick={() => toggle(topic)}
                        >
                          <Check size={15} aria-hidden="true" />
                        </button>

                        <details className={styles.topicBody}>
                          <summary>
                            <span className={styles.topicNumber}>{topic.position}</span>
                            <span className={styles.topicText}>
                              <strong>{topic.title}</strong>
                              <small>
                                {t("hours", { count: topic.hours })}
                                {topic.week !== null && <> · {t("weekShort", { week: topic.week })}</>}
                                {topic.done_on && <> · {t("doneOn", { date: formatDate(topic.done_on) })}</>}
                              </small>
                            </span>
                            {isCurrent && <span className={cn(styles.status, styles.statusCurrent)}>{t("now")}</span>}
                            {isLate && !isCurrent && <span className={cn(styles.status, styles.statusBehind)}>{t("late")}</span>}
                            <ChevronDown className={styles.chevron} size={16} aria-hidden="true" />
                          </summary>

                          <div className={styles.topicDetails}>
                            {topic.goals && (
                              <div>
                                <span className={styles.detailLabel}>{t("goals")}</span>
                                <p>{topic.goals}</p>
                              </div>
                            )}
                            {topic.materials && (
                              <div>
                                <span className={styles.detailLabel}>{t("materials")}</span>
                                <Materials text={topic.materials} />
                              </div>
                            )}
                            {topic.done_on ? (
                              <label className={styles.noteField}>
                                <span className={styles.detailLabel}>{t("note")}</span>
                                <textarea
                                  rows={2}
                                  maxLength={500}
                                  className={adminStyles.input}
                                  placeholder={t("notePlaceholder")}
                                  value={noteDrafts[topic.id] ?? topic.note ?? ""}
                                  onChange={(event) =>
                                    setNoteDrafts((drafts) => ({ ...drafts, [topic.id]: event.target.value }))
                                  }
                                  onBlur={() => saveNote(topic)}
                                />
                              </label>
                            ) : (
                              !topic.goals && !topic.materials && <p className={styles.detailEmpty}>{t("noDetails")}</p>
                            )}
                          </div>
                        </details>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))
          )}
        </>
      )}
    </div>
  );
}
