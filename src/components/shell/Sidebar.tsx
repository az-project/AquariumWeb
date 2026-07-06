"use client";

// index.html:48-68 이식 — 사이드바 (nav 4버튼 + 알림 요약)
import { useAppStore, type ViewId } from "@/lib/state/store";

const NAV_ITEMS: { id: ViewId; label: string }[] = [
  { id: "dashboard", label: "대시보드" },
  { id: "water", label: "수질/환수" },
  { id: "livestock", label: "생물/장비" },
  { id: "library", label: "도감/합사" }
];

interface SidebarProps {
  nextReminderText: string;
  notificationSummary: string;
  onOpenNotificationSettings: () => void;
}

export function Sidebar({ nextReminderText, notificationSummary, onOpenNotificationSettings }: SidebarProps) {
  const view = useAppStore(state => state.view);
  const setView = useAppStore(state => state.setView);

  return (
    <aside className="sidebar" aria-label="주 메뉴">
      <div className="brand">
        <span className="brand-mark">R</span>
        <div>
          <strong>리프로그</strong>
          <small>Marine Tank Care</small>
        </div>
      </div>
      <nav className="nav-tabs" aria-label="화면 이동">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            className={`nav-button ${view === item.id ? "active" : ""}`}
            data-view={item.id}
            onClick={() => setView(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-note">
        <span>다음 알림</span>
        <strong id="nextReminder">{nextReminderText}</strong>
        <small id="notificationSummary">{notificationSummary}</small>
        <button className="text-button notification-button" data-notification-settings type="button" onClick={onOpenNotificationSettings}>
          알림 설정
        </button>
      </div>
    </aside>
  );
}
