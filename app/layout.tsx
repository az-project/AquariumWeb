import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "리프로그 - 해수어항 관리",
  description: "해수어항 수질, 생물, 장비, 관리 알림을 기록하는 앱",
  appleWebApp: {
    capable: true,
    title: "리프로그"
  },
  icons: {
    apple: "/assets/icons/icon-192.png"
  }
};

export const viewport: Viewport = {
  themeColor: "#159fb7",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
