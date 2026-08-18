(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = document.createElement('div');
  overlay.className = 'route-transition';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = '<span>AXIS / ROUTE CHANGE</span><b>正在切换课程界面</b><i></i>';
  document.body.appendChild(overlay);

  const routeLabels = {
    'index.html':'课程首页',
    'module-00.html':'00 · 环境部署',
    'module-01.html':'01 · ROS 2 通信基础',
    'module-02.html':'02 · SLAM 与自主导航',
    'module-03.html':'03 · 创建 ROS 2 功能包'
  };

  const labelFor = value => {
    const target = new URL(value, window.location.href);
    const file = target.pathname.split('/').pop() || 'index.html';
    return routeLabels[file] || '课程任务';
  };

  const finishEntering = () => {
    requestAnimationFrame(() => document.documentElement.classList.add('route-ready'));
  };

  window.routeTo = url => {
    if (reducedMotion) {
      window.location.assign(url);
      return;
    }
    overlay.querySelector('b').textContent = labelFor(url);
    overlay.classList.add('leaving');
    document.documentElement.classList.add('route-is-leaving');
    window.setTimeout(() => window.location.assign(url), 240);
  };

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || link.target === '_blank' || link.hasAttribute('download')) return;
    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin) return;
    if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
    event.preventDefault();
    window.routeTo(destination.href);
  });

  window.addEventListener('pageshow', () => {
    overlay.classList.remove('leaving');
    document.documentElement.classList.remove('route-is-leaving');
    finishEntering();
  }, {once: true});
  finishEntering();
})();
