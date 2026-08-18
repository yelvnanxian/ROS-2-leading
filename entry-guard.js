(() => {
  const sessionKey = 'axisWebsiteSession';
  const isHome = /\/(?:index\.html)?$/.test(window.location.pathname);
  const legacyRoutes = {
    'lesson-01-04.html': './module-01.html?mission=control',
    'lesson-01-05.html': './module-01.html?mission=rviz'
  };

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
    window.location.replace(new URL('./index.html', window.location.href).href);
    return;
  }

  try { sessionStorage.setItem(sessionKey, 'active'); } catch (_) {}

  const legacyTarget = legacyRoutes[window.location.pathname.split('/').pop()];
  if (legacyTarget) window.location.replace(new URL(legacyTarget, window.location.href).href);
})();
