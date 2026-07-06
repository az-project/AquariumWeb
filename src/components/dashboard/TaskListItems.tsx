"use client";

// app.js:1001-1004 renderTasks 이식 — 대시보드 '오늘 할 일'과 수질 뷰 타임라인 공용
import type { Task } from "@/lib/domain/types";

export function TaskListItems({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) {
    return (
      <article className="task-item">
        <strong>밀린 작업 없음</strong>
        <small>어항이 편안한 하루입니다.</small>
      </article>
    );
  }
  return (
    <>
      {tasks.map((task, index) => (
        <article className="task-item" key={`${task.title}-${task.due}-${index}`}>
          <strong>{task.title || "작업명 없음"}</strong>
          <small>
            {task.category || "분류 없음"} · {task.due || "날짜 미정"} · {task.memo || "메모 없음"}
          </small>
        </article>
      ))}
    </>
  );
}
