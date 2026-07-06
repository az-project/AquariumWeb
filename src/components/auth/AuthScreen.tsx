"use client";

// index.html:14-45 + app.js:363-495 이식 — 로그인/회원가입 화면.
// 마크업 class/id는 globals.css 의존성 때문에 바닐라와 동일하게 유지한다.
import { useState, type FormEvent } from "react";
import { useAppStore } from "@/lib/state/store";

type AuthView = "login" | "register";

// app.js:405-411
function getAuthErrorMessage(status: number, fallback: string, view: AuthView): string {
  if (status === 401) return "아이디 또는 비밀번호가 맞지 않습니다.";
  if (status === 429) return "로그인 시도가 너무 많습니다. 잠시 후 다시 시도하세요.";
  if (status === 409) return "이미 사용 중인 아이디입니다.";
  if (status === 400) return fallback || "입력값을 다시 확인해 주세요.";
  return fallback || (view === "register" ? "회원가입에 실패했습니다." : "로그인에 실패했습니다.");
}

export function AuthScreen() {
  const onAuthenticated = useAppStore(state => state.onAuthenticated);
  const [view, setView] = useState<AuthView>("login");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isRegister = view === "register";

  function switchView(next: AuthView) {
    setView(next);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    data.username = String(data.username || "").trim();
    setError("");

    if (isRegister && data.password !== data.confirmPassword) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(isRegister ? "/api/register" : "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(getAuthErrorMessage(response.status, result.error || "", view));
      }
      setView("login");
      await onAuthenticated(result.username || data.username);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-screen" id="authScreen" aria-label="로그인">
      <form className="auth-card" id="loginForm" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <span className="brand-mark">R</span>
          <div>
            <strong>리프로그</strong>
            <small>Shared Reef Care</small>
          </div>
        </div>
        <div>
          <p className="eyebrow">Private Aquarium</p>
          <h1 id="authTitle">{isRegister ? "회원가입" : "로그인"}</h1>
          <p className="auth-copy" id="authCopy">
            {isRegister
              ? "새 계정을 만든 뒤 같은 서버의 공유 어항 데이터를 함께 사용할 수 있습니다."
              : "공유 어항 데이터를 보려면 계정으로 접속하세요."}
          </p>
        </div>
        <div className="auth-mode-tabs" aria-label="계정 화면 선택">
          <button
            className={view === "login" ? "active" : ""}
            type="button"
            data-auth-mode="login"
            onClick={() => switchView("login")}
          >
            로그인
          </button>
          <button
            className={view === "register" ? "active" : ""}
            type="button"
            data-auth-mode="register"
            onClick={() => switchView("register")}
          >
            회원가입
          </button>
        </div>
        <label>
          아이디
          <input name="username" autoComplete="username" required />
        </label>
        <label>
          비밀번호
          <input
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
          />
        </label>
        <label data-register-only hidden={!isRegister}>
          비밀번호 확인
          <input name="confirmPassword" type="password" autoComplete="new-password" required={isRegister} disabled={!isRegister} />
        </label>
        <p className="auth-hint" id="authHint"></p>
        <p className="auth-error" id="loginError" role="alert">
          {error}
        </p>
        <button className="primary-button wide-button" id="authSubmitButton" type="submit" disabled={submitting}>
          {isRegister ? "회원가입" : "로그인"}
        </button>
      </form>
    </section>
  );
}
