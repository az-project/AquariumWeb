// 기존 manifest.webmanifest 이식 — 홈화면 설치(PWA manifest)는 유지.
// 오프라인 캐시/푸시(서비스워커)는 Phase 2 이후로 이연.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "리프로그 - 해수어항 관리",
    short_name: "리프로그",
    description: "해수어항 수질, 생물, 장비, 관리 알림을 기록하는 PWA 앱",
    lang: "ko-KR",
    start_url: ".",
    scope: ".",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#eef8f4",
    theme_color: "#159fb7",
    categories: ["productivity", "lifestyle"],
    icons: [
      {
        src: "/assets/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/assets/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
