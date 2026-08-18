(() => {
  const sessionKey = 'axisWebsiteSession';
  const script = document.currentScript;
  const courseRoot = script?.dataset.courseRoot || '.';
  const homeUrl = new URL(`${courseRoot}/index.html`, window.location.href);
  const normalizedPath = window.location.pathname.replace(/\/+$/, '');
  const homePath = homeUrl.pathname.replace(/\/+$/, '');
  const homeDirectory = homePath.replace(/\/index\.html$/, '');
  const isHome = normalizedPath === homePath || normalizedPath === homeDirectory;

  const legacyTarget = /\/legacy\/01-04(?:\/index\.html)?$/.test(normalizedPath)
    ? new URL(`${courseRoot}/modules/01/index.html?mission=control`, window.location.href)
    : /\/legacy\/01-05(?:\/index\.html)?$/.test(normalizedPath)
      ? new URL(`${courseRoot}/modules/01/index.html?mission=rviz`, window.location.href)
      : null;

  if (isHome) {
    try { sessionStorage.setItem(sessionKey, 'active'); } catch (_) {}
    return;
  }

  let cameFromThisSite = false;
  try {
    const referrer = new URL(document.referrer);
    cameFromThisSite = referrer.origin === window.location.origin;
  } catch (_) {}

  let activeSession = false;
  try { activeSession = sessionStorage.getItem(sessionKey) === 'active'; } catch (_) {}

  if (!activeSession && !cameFromThisSite) {
    window.location.replace(homeUrl.href);
    return;
  }

  try { sessionStorage.setItem(sessionKey, 'active'); } catch (_) {}

  if (legacyTarget) window.location.replace(legacyTarget.href);
})();
