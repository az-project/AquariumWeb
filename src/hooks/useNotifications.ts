"use client";

// app.js:883-999, 1594-1618 이식 — Notification API 일일 리마인더.
// M5 정책에 따라 SW 없이 new Notification() 경로만 사용한다.
import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_NOTIFICATION_SETTINGS, NOTIFICATION_STORAGE_KEY, todayIso } from "@/lib/domain/constants";
import { daysBetween } from "@/lib/domain/derive";
import type { NotificationSettings, Task } from "@/lib/domain/types";
import { getStorageItem, setStorageItem } from "@/lib/state/local-backup";

function loadSettings(): NotificationSettings {
  const saved = getStorageItem(NOTIFICATION_STORAGE_KEY);
  if (!saved) return { ...DEFAULT_NOTIFICATION_SETTINGS };
  try {
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export function notificationPermissionLabel(): string {
  if (typeof window === "undefined" || !("Notification" in window)) return "이 브라우저는 알림을 지원하지 않습니다.";
  if (Notification.permission === "granted") return "브라우저 알림 권한이 허용되어 있습니다.";
  if (Notification.permission === "denied") return "브라우저에서 알림 권한이 차단되어 있습니다.";
  return "알림을 켜면 브라우저 권한 요청이 표시됩니다.";
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

export function useNotifications(tasks: Task[]) {
  const [settings, setSettingsState] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    setSettingsState(loadSettings());
  }, []);

  const buildPayload = useCallback((isTest: boolean) => {
    if (isTest) {
      return { title: "리프로그 테스트 알림", body: "푸시 알림 설정이 정상적으로 연결되었습니다." };
    }
    const upcoming = [...tasksRef.current]
      .map(task => ({ ...task, distance: daysBetween(task.due, todayIso()) }))
      .filter(task => task.distance >= 0 && task.distance <= Number(settingsRef.current.leadDays))
      .sort((a, b) => a.due.localeCompare(b.due));
    if (!upcoming.length) {
      return { title: "리프로그 관리 알림", body: "가까운 관리 일정은 없지만 오늘의 수질 상태를 확인해 보세요." };
    }
    const first = upcoming[0];
    const when = first.distance === 0 ? "오늘" : `${first.distance}일 후`;
    return {
      title: "리프로그 관리 알림",
      body: `${first.title} 일정이 ${when} 예정되어 있습니다.${upcoming.length > 1 ? ` 외 ${upcoming.length - 1}건` : ""}`
    };
  }, []);

  const showReminder = useCallback(
    async (isTest = false): Promise<boolean> => {
      const allowed = await ensureNotificationPermission();
      if (!allowed) return false;
      const payload = buildPayload(isTest);
      new Notification(payload.title, {
        body: payload.body,
        icon: "assets/icons/icon-192.png",
        badge: "assets/icons/icon-192.png",
        tag: isTest ? "reef-log-test" : "reef-log-reminder"
      });
      return true;
    },
    [buildPayload]
  );

  // app.js:983-999 — setTimeout 기반 일일 스케줄
  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const current = settingsRef.current;
    if (!current.enabled || typeof window === "undefined" || !("Notification" in window)) return;

    const [hour, minute] = current.time.split(":").map(Number);
    const next = new Date();
    next.setHours(hour || 9, minute || 0, 0, 0);
    if (next <= new Date()) next.setDate(next.getDate() + 1);

    timerRef.current = setTimeout(async () => {
      if (settingsRef.current.enabled && Notification.permission === "granted") {
        await showReminder();
      }
      schedule();
    }, Math.min(next.getTime() - Date.now(), 2147483647));
  }, [showReminder]);

  useEffect(() => {
    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [schedule, settings]);

  const saveSettings = useCallback(async (next: NotificationSettings): Promise<NotificationSettings> => {
    const applied = { ...next };
    if (applied.enabled) {
      applied.enabled = await ensureNotificationPermission();
    }
    setStorageItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(applied));
    setSettingsState(applied);
    return applied;
  }, []);

  const summaryText = settings.enabled ? `${settings.time} · ${settings.leadDays}일 전 알림` : "알림 설정 꺼짐";
  const statusText = `${settings.enabled ? "알림 켜짐" : "알림 꺼짐"} · ${notificationPermissionLabel()}`;

  return { settings, saveSettings, showReminder, summaryText, statusText };
}
