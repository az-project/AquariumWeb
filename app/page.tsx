"use client";

// 앱 엔트리 — 바닐라 부트스트랩(app.js:1625-1631) 대응.
// initialize(): 세션 확인 → 로그인 화면 or 공유 상태 hydrate.
import { useEffect } from "react";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { useAppStore } from "@/lib/state/store";

export default function Home() {
  const authStatus = useAppStore(state => state.authStatus);
  const view = useAppStore(state => state.view);
  const initialize = useAppStore(state => state.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (authStatus === "checking") {
    return null;
  }

  if (authStatus === "locked") {
    return <AuthScreen />;
  }

  return (
    <div className="app-shell">
      <Sidebar
        nextReminderText="계산 중"
        notificationSummary="알림 설정 꺼짐"
        onOpenNotificationSettings={() => {}}
      />
      <main className="main-area">
        <TopBar onOpenModal={() => {}} />

        {/* M3/M4에서 각 뷰 본문 이식 예정 — 뷰 토글 구조는 바닐라와 동일 */}
        <section className={`view ${view === "dashboard" ? "active" : ""}`} id="dashboard">
          <p style={{ padding: "1rem" }}>대시보드 (M3에서 이식)</p>
        </section>
        <section className={`view ${view === "water" ? "active" : ""}`} id="water">
          <p style={{ padding: "1rem" }}>수질/환수 (M4에서 이식)</p>
        </section>
        <section className={`view ${view === "livestock" ? "active" : ""}`} id="livestock">
          <p style={{ padding: "1rem" }}>생물/장비 (M4에서 이식)</p>
        </section>
        <section className={`view ${view === "library" ? "active" : ""}`} id="library">
          <p style={{ padding: "1rem" }}>도감/합사 (M4에서 이식)</p>
        </section>
      </main>
    </div>
  );
}
