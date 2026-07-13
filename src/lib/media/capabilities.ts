interface BrowserIdentity {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}

export type AlphaVideoFormat = "webm" | "hevc";

/**
 * 투명(알파) 영상 코덱은 브라우저 계열마다 갈린다:
 * - WebKit(Safari/iOS 전체 브라우저)은 VP9 WebM을 재생은 하지만 알파를 합성하지
 *   못해 투명 영역이 검은 상자로 보인다. 대신 HEVC+알파(hvc1 .mov)를 합성한다.
 * - Chromium은 반대로 HEVC를 재생할 수 있어도 알파 레이어는 무시하므로,
 *   canPlayType/<source> 순서만으로는 판별할 수 없어 UA로 계열을 구분한다.
 */
export function preferredAlphaVideoFormat(identity: BrowserIdentity): AlphaVideoFormat {
  const { userAgent, platform, maxTouchPoints } = identity;
  const isAppleMobile = /iPad|iPhone|iPod/i.test(userAgent);
  const isIPadDesktopMode = platform === "MacIntel" && maxTouchPoints > 1;
  const isDesktopSafari =
    /Safari\//i.test(userAgent) &&
    !/(?:Chrome|Chromium|CriOS|Edg|EdgiOS|OPR|Opera|FxiOS)\//i.test(userAgent);

  return isAppleMobile || isIPadDesktopMode || isDesktopSafari ? "hevc" : "webm";
}
