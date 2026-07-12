interface BrowserIdentity {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}

/**
 * Safari/WebKit can decode VP9 WebM, but does not composite its alpha channel.
 * On Apple browsers the transparent pixels therefore appear as a black box.
 */
export function needsStaticAlphaVideoFallback(identity: BrowserIdentity): boolean {
  const { userAgent, platform, maxTouchPoints } = identity;
  const isAppleMobile = /iPad|iPhone|iPod/i.test(userAgent);
  const isIPadDesktopMode = platform === "MacIntel" && maxTouchPoints > 1;
  const isDesktopSafari =
    /Safari\//i.test(userAgent) &&
    !/(?:Chrome|Chromium|CriOS|Edg|EdgiOS|OPR|Opera|FxiOS)\//i.test(userAgent);

  return isAppleMobile || isIPadDesktopMode || isDesktopSafari;
}
