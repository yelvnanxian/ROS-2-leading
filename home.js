const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const envKey = 'axisEnvironmentProgress';
const moduleKey = 'axisModule01Foundations';
const navigationKey = 'axisModule02Navigation';
const packageKey = 'axisModule03Packages';
const odometryKey = 'axisModule04Odometry';
const envOrder = ['requirements', 'docker', 'workspace', 'simulation', 'validation'];
const envTitles = {
  requirements: '认识实验环境',
  docker: '获取仓库与 Docker',
  workspace: '工作空间与目录挂载',
  simulation: '启动 Andino 仿真',
  validation: '环境验收与排错'
};
const envStepTotals = {requirements: 5, docker: 5, workspace: 4, simulation: 4, validation: 4};
const missionOrder = ['intro', 'nodes', 'topics', 'control', 'rviz', 'transforms', 'services', 'assessment'];
const missionTitles = {
  intro: 'ROS 2 到底是什么',
  nodes: '节点与计算图',
  topics: 'Topic 与消息',
  control: '控制 Andino 底盘',
  rviz: 'RViz 传感器世界',
  transforms: 'TF 时间与变换调试',
  services: '服务与客户端',
  assessment: '模块综合验收'
};
const missionStepTotals = {intro: 3, nodes: 4, topics: 4, control: 4, rviz: 4, transforms: 3, services: 4, assessment: 5};
const navigationOrder = ['slam_model', 'mapping_launch', 'mapping_drive', 'map_save', 'localization', 'nav2_stack', 'recovery', 'field_assessment'];
const navigationTitles = {
  slam_model: '先看懂 SLAM',
  mapping_launch: '启动在线建图',
  mapping_drive: '覆盖与闭环质量',
  map_save: '保存与校验地图',
  localization: 'AMCL 初始定位',
  nav2_stack: 'Nav2 目标与执行',
  recovery: '故障隔离与恢复',
  field_assessment: '综合自主导航任务'
};
const navigationStepTotals = {slam_model: 4, mapping_launch: 5, mapping_drive: 4, map_save: 4, localization: 6, nav2_stack: 5, recovery: 5, field_assessment: 7};
const packageOrder = ['package_model', 'creator_preflight', 'package_anatomy', 'python_node', 'build_overlay', 'run_inspect', 'field_delivery'];
const packageTitles = {
  package_model: '先看懂功能包',
  creator_preflight: '使用 Turtle Nest',
  package_anatomy: '读懂目录与元数据',
  python_node: '读懂第一个 Node',
  build_overlay: 'colcon 与 source',
  run_inspect: '运行并观察 Graph',
  field_delivery: '综合交付与恢复'
};
const packageStepTotals = {package_model:4, creator_preflight:5, package_anatomy:4, python_node:4, build_overlay:5, run_inspect:5, field_delivery:6};
const odometryOrder = ['odometry_model', 'joint_states', 'differential_kinematics', 'pose_integration', 'odometry_message', 'quaternion_frames', 'path_validation', 'odometry_delivery'];
const odometryTitles = {
  odometry_model: '先看懂轮式里程计',
  joint_states: '稳健读取 JointState',
  differential_kinematics: '差速运动学',
  pose_integration: '用仿真时间积分 Pose',
  odometry_message: '发布 Odometry 消息',
  quaternion_frames: 'Quaternion 与坐标系',
  path_validation: '绘制并审查轨迹',
  odometry_delivery: '综合验收与交付'
};
const odometryStepTotals = {odometry_model:4, joint_states:5, differential_kinematics:5, pose_integration:5, odometry_message:5, quaternion_frames:5, path_validation:5, odometry_delivery:6};

const chapterCatalog = [
  {code:'00', title:'环境部署', subtitle:'先把实验室搭起来', open:true, href:'./module-00.html', queryKey:'task', order:envOrder, titles:envTitles, descriptions:{requirements:'系统要求、Gazebo / RViz 分工与失败恢复', docker:'仓库、Compose、容器和图形显示', workspace:'src、build、install 与源码持久化', simulation:'Andino、Gazebo、RViz 与 /clock', validation:'Node、Topic、频率和 TF 环境验收'}},
  {code:'01', title:'ROS 2 通信基础', subtitle:'再读懂机器人数据', open:true, href:'./module-01.html', queryKey:'mission', order:missionOrder, titles:missionTitles, descriptions:{intro:'ROS 2、DDS、Package 与 Node 的整体模型', nodes:'节点发现、计算图与 talker / listener', topics:'Topic、消息类型、QoS 与数据流', control:'Twist、差速底盘与安全停止', rviz:'Display、Fixed Frame 与传感器画面', transforms:'TF、时间戳、Buffer 与坐标链', services:'Service 的请求与响应', assessment:'把通信、TF、控制和证据串成排查流程'}},
  {code:'02', title:'SLAM 与自主导航', subtitle:'把地图、定位和规划接进来', open:true, href:'./module-02.html', queryKey:'lesson', order:navigationOrder, titles:navigationTitles, descriptions:{slam_model:'LaserScan、位姿与 OccupancyGrid 心智模型', mapping_launch:'按 SIM、MAPPING、INSPECT、RViz 启动', mapping_drive:'低速覆盖、扫描匹配与闭环质量', map_save:'YAML、PNG 与宿主机持久化', localization:'已知地图、粒子与 map→odom', nav2_stack:'Action、Costmap、Planner 与 Controller', recovery:'按层诊断导航失败并安全恢复', field_assessment:'从地图文件到自主到达目标'}},
  {code:'03', title:'创建 ROS 2 功能包', subtitle:'把 Python 源码装配成可运行节点', open:true, href:'./module-03.html', queryKey:'lesson', order:packageOrder, titles:packageTitles, descriptions:{package_model:'Workspace、Package、Node 与 Entry 的关系', creator_preflight:'Turtle Nest 字段、防重复与 CLI 恢复', package_anatomy:'package.xml、setup.py 与资源索引', python_node:'rclpy init、spin、shutdown 与源码修改', build_overlay:'colcon、symlink install 与 Shell overlay', run_inspect:'ros2 run、node info 与干净停止', field_delivery:'干净终端重建、故障路由与交付包'}},
  {code:'04', title:'轮式里程计', subtitle:'把轮速积分成可验证的位姿', open:true, href:'./module-04.html', queryKey:'lesson', order:odometryOrder, titles:odometryTitles, descriptions:{odometry_model:'航位推算、输入输出与累计误差', joint_states:'按 name 找左右轮并验证单位', differential_kinematics:'轮半径、轮距与 v / ω 公式', pose_integration:'仿真 dt、x / y / theta 与时间保护', odometry_message:'发布 /robot_odometry 的 Pose 与 Twist', quaternion_frames:'theta、Quaternion、frame 与 TF 边界', path_validation:'用轨迹辨别漂移、轮滑与参数误差', odometry_delivery:'干净终端完成五层证据交付'}}
];
let chapterDirectoryInitialized = false;
const expandedModules = new Set();

function readState(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

function validCompleted(state, order) {
  return new Set(Array.isArray(state.completed) ? state.completed.filter(name => order.includes(name)) : []);
}

function currentIncomplete(order, completed, savedCurrent) {
  if (savedCurrent && order.includes(savedCurrent) && !completed.has(savedCurrent)) return savedCurrent;
  return order.find(name => !completed.has(name)) || order[order.length - 1];
}

function showToast(message) {
  const element = $('#homeToast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(window.homeToastTimer);
  window.homeToastTimer = setTimeout(() => element.classList.remove('show'), 2200);
}

function setText(selector, value) {
  const element = $(selector);
  if (element) element.textContent = value;
}

function setBar(selector, value) {
  const element = $(selector);
  if (element) element.style.width = `${value}%`;
}

function chapterColumnCount(count) {
  return [5, 4, 3, 2].find(columns => count >= columns && count % columns === 0) || Math.min(count, 4);
}

function renderChapterDirectory(completedByCode, currentByCode) {
  const container = $('#chapterDirectoryList');
  if (!container) return;
  if (!chapterDirectoryInitialized) {
    const firstIncomplete = chapterCatalog.find(group => completedByCode[group.code].size < group.order.length);
    expandedModules.add(firstIncomplete ? firstIncomplete.code : chapterCatalog[chapterCatalog.length - 1].code);
    chapterDirectoryInitialized = true;
  }
  container.innerHTML = chapterCatalog.map(group => {
    const completed = completedByCode[group.code];
    const current = currentByCode[group.code];
    const count = completed.size;
    const moduleStatus = !group.open ? '即将开放' : count === group.order.length ? '已完成' : count ? `${count} / ${group.order.length} 已完成` : '可直接进入';
    const links = group.order.map((key, index) => {
      const done = completed.has(key);
      const active = current === key;
      const label = `${group.code}.${String(index + 1).padStart(2, '0')}`;
      const state = done ? 'complete' : active ? 'current' : '';
      if (!group.open) {
        return `<button type="button" class="chapter-link planned" data-home-locked><i>${label}</i><span><b>${group.titles[key]}</b><small>${group.descriptions[key]}</small></span><em>即将开放</em></button>`;
      }
      return `<a class="chapter-link ${state}" href="${group.href}?${group.queryKey}=${key}"${active ? ' aria-current="step"' : ''}><i>${done ? '✓' : label}</i><span><b>${group.titles[key]}</b><small>${group.descriptions[key]}</small></span><em>${done ? '已完成' : active ? '继续此节' : '直接进入 →'}</em></a>`;
    }).join('');
    const expanded = expandedModules.has(group.code);
    const unit = group.code === '00' ? 'TASKS' : 'MISSIONS';
    return `<article class="chapter-directory-module ${group.open ? '' : 'planned'} ${expanded ? 'expanded' : ''}" id="chapter-module-${group.code}"><button type="button" class="chapter-directory-toggle" data-chapter-toggle="${group.code}" aria-expanded="${expanded}" aria-controls="chapter-panel-${group.code}"><i class="chapter-module-code">${group.code}</i><span class="chapter-module-copy"><b>${group.title}</b><small>${group.subtitle}</small></span><span class="chapter-module-status"><b>${moduleStatus}</b><small>${group.order.length} ${unit}</small></span><i class="chapter-toggle-icon" aria-hidden="true">⌄</i></button><div class="chapter-directory-panel" id="chapter-panel-${group.code}" aria-hidden="${!expanded}"${expanded ? '' : ' inert'}><div><div class="chapter-link-list" style="--chapter-columns:${chapterColumnCount(group.order.length)}">${links}</div></div></div></article>`;
  }).join('');
}

function renderModuleOverview(completedByCode) {
  const container = $('#homeModuleOverview');
  if (!container) return;
  container.innerHTML = chapterCatalog.map(group => {
    const completed = completedByCode[group.code].size;
    const status = !group.open ? 'PLANNED' : completed === group.order.length ? 'COMPLETE' : completed ? 'ACTIVE' : 'READY';
    const detail = !group.open ? `${group.order.length} 节规划中` : `${completed} / ${group.order.length} 已完成`;
    return `<a class="course-module-pulse-item ${!group.open ? 'planned' : ''}" href="#chapter-module-${group.code}" data-overview-module="${group.code}"><i>${group.code}</i><span><b>${group.title}</b><small>${detail}</small></span><em>${status} ↘</em></a>`;
  }).join('');
}

function renderData() {
  const environment = readState(envKey);
  const communication = readState(moduleKey);
  const navigation = readState(navigationKey);
  const packages = readState(packageKey);
  const odometry = readState(odometryKey);
  const envCompleted = validCompleted(environment, envOrder);
  const missionCompleted = validCompleted(communication, missionOrder);
  const navigationCompleted = validCompleted(navigation, navigationOrder);
  const packageCompleted = validCompleted(packages, packageOrder);
  const odometryCompleted = validCompleted(odometry, odometryOrder);
  const envCount = envCompleted.size;
  const missionCount = missionCompleted.size;
  const navigationCount = navigationCompleted.size;
  const packageCount = packageCompleted.size;
  const odometryCount = odometryCompleted.size;
  const total = envOrder.length + missionOrder.length + navigationOrder.length + packageOrder.length + odometryOrder.length;
  const totalCount = envCount + missionCount + navigationCount + packageCount + odometryCount;
  const overall = Math.round(totalCount / total * 100);
  const currentEnv = currentIncomplete(envOrder, envCompleted, environment.currentTask);
  const currentMission = currentIncomplete(missionOrder, missionCompleted, communication.currentMission);
  const currentNavigation = currentIncomplete(navigationOrder, navigationCompleted, navigation.currentLesson);
  const currentPackage = currentIncomplete(packageOrder, packageCompleted, packages.currentLesson);
  const currentOdometry = currentIncomplete(odometryOrder, odometryCompleted, odometry.currentLesson);
  const envDone = envCount === envOrder.length;
  const missionDone = missionCount === missionOrder.length;
  const navigationDone = navigationCount === navigationOrder.length;
  const packageDone = packageCount === packageOrder.length;
  const odometryDone = odometryCount === odometryOrder.length;
  const nextModule = !envDone ? 'environment' : !missionDone ? 'communication' : !navigationDone ? 'navigation' : !packageDone ? 'packages' : 'odometry';
  const nextHref = nextModule === 'environment' ? './module-00.html' : nextModule === 'communication' ? './module-01.html' : nextModule === 'navigation' ? './module-02.html' : nextModule === 'packages' ? './module-03.html' : './module-04.html';
  const nextTitle = !envDone
    ? `00.${String(envOrder.indexOf(currentEnv) + 1).padStart(2, '0')} · ${envTitles[currentEnv]}`
    : !missionDone
      ? `01.${String(missionOrder.indexOf(currentMission) + 1).padStart(2, '0')} · ${missionTitles[currentMission]}`
      : !navigationDone
        ? `02.${String(navigationOrder.indexOf(currentNavigation) + 1).padStart(2, '0')} · ${navigationTitles[currentNavigation]}`
        : !packageDone
          ? `03.${String(packageOrder.indexOf(currentPackage) + 1).padStart(2, '0')} · ${packageTitles[currentPackage]}`
          : `04.${String(odometryOrder.indexOf(currentOdometry) + 1).padStart(2, '0')} · ${odometryTitles[currentOdometry]}`;
  const nextReason = !envDone
    ? `先完成环境部署的 ${envTitles[currentEnv]}，确认真实终端证据后再进入下一项。`
    : !missionDone
      ? `环境已经就绪。现在进入 ${missionTitles[currentMission]}，把通信模型变成可观察的证据。`
      : !navigationDone
        ? `通信基础已经就绪。现在进入 ${navigationTitles[currentNavigation]}，把感知、定位、规划和执行连接起来。`
        : !packageDone
          ? `导航路线已经完成。现在进入 ${packageTitles[currentPackage]}，把 Python 源码装配成可构建、可运行的 ROS 2 功能包。`
          : !odometryDone
            ? `功能包开发已经完成。现在进入 ${odometryTitles[currentOdometry]}，把真实轮速变成可解释、可验证的机器人位姿。`
            : '五个已开放模块全部完成，可以回看里程计综合交付与全部学习证据。';
  const nextStage = !envDone
    ? ({learn:'STAGE 01 · UNDERSTAND', practice:'STAGE 02 · EXECUTE', review:'STAGE 03 · REVIEW'}[environment.stages?.[currentEnv]] || 'STAGE 01 · UNDERSTAND')
    : !missionDone
      ? ({concept:'STAGE 01 · UNDERSTAND', trace:'STAGE 02 · TRACE', lab:'STAGE 03 · LAB', assessment:'STAGE 04 · ASSESS'}[communication.stages?.[currentMission]] || 'STAGE 01 · UNDERSTAND')
      : !navigationDone
        ? 'STAGE 01 · UNDERSTAND'
        : 'STAGE 01 · UNDERSTAND';
  const nextDone = !envDone
    ? (environment.steps?.[currentEnv] || []).length
    : !missionDone
      ? (communication.steps?.[currentMission] || []).length
      : !navigationDone
        ? (navigation.steps?.[currentNavigation] || []).length
        : !packageDone
          ? (packages.steps?.[currentPackage] || []).length
          : (odometry.steps?.[currentOdometry] || []).length;
  const nextTotal = !envDone ? envStepTotals[currentEnv] : !missionDone ? missionStepTotals[currentMission] : !navigationDone ? navigationStepTotals[currentNavigation] : !packageDone ? packageStepTotals[currentPackage] : odometryStepTotals[currentOdometry];
  const routeComplete = totalCount === total;

  const completedByCode = {'00':envCompleted, '01':missionCompleted, '02':navigationCompleted, '03':packageCompleted, '04':odometryCompleted};
  const currentByCode = {'00':currentEnv, '01':currentMission, '02':currentNavigation, '03':currentPackage, '04':currentOdometry};
  renderChapterDirectory(completedByCode, currentByCode);
  renderModuleOverview(completedByCode);

  setText('#homePercent', `${overall}%`);
  setText('#homeGaugePercent', `${overall}%`);
  setBar('#homeProgressBar', overall);
  $('#homeGauge')?.style.setProperty('--score', `${overall * 3.6}deg`);
  setText('#homeProgressMeta', `${totalCount} / ${total} CHECKPOINTS`);
  setText('#homeCheckpointCount', `${totalCount} / ${total}`);
  setText('#homeRouteLabel', !envDone ? '00 · 环境部署' : !missionDone ? '01 · ROS 2 通信' : !navigationDone ? '02 · SLAM 与导航' : !packageDone ? '03 · 功能包开发' : '04 · 轮式里程计');
  setText('#homeRouteDetail', !envDone ? `${envTitles[currentEnv]} · 可切换到任意章节` : !missionDone ? `${missionTitles[currentMission]} · 可切换到任意章节` : !navigationDone ? `${navigationTitles[currentNavigation]} · 可切换到任意章节` : !packageDone ? `${packageTitles[currentPackage]} · 可切换到任意章节` : `${odometryTitles[currentOdometry]} · 可切换到任意章节`);
  const totalLessons = chapterCatalog.reduce((sum, group) => sum + group.order.length, 0);
  const openModules = chapterCatalog.filter(group => group.open).length;
  setText('#homeCourseScale', `${chapterCatalog.length} MODULES · ${totalLessons} LESSONS`);
  setText('#homeOpenScale', openModules === chapterCatalog.length ? `${openModules} 个模块已开放` : `${openModules} 个模块已开放 · ${chapterCatalog.length - openModules} 个规划中`);
  setBar('#homeMetricProgressBar', overall);
  setText('#homeNode00', `${envCount} / ${envOrder.length}`);
  setText('#homeNode01', `${missionCount} / ${missionOrder.length}`);
  setText('#homeNode02', `${navigationCount} / ${navigationOrder.length}`);
  setText('#homeNode03', `${packageCount} / ${packageOrder.length}`);
  setText('#homeNode04', `${odometryCount} / ${odometryOrder.length}`);
  setText('#homeDataState', 'SYNCED');
  setText('#homeLastSync', `最近读取 · ${new Date().toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}`);
  setText('#homeSystemState', routeComplete ? 'ROUTE COMPLETE' : totalCount ? 'TRAINING IN PROGRESS' : 'READY TO START');

  setText('#homeEnvProgressText', `${envCount} / ${envOrder.length} TASKS`);
  setText('#homeEnvProgressPercent', `${Math.round(envCount / envOrder.length * 100)}%`);
  setBar('#homeEnvProgressBar', envCount / envOrder.length * 100);
  setText('#homeM01ProgressText', `${missionCount} / ${missionOrder.length} MISSIONS`);
  setText('#homeM01ProgressPercent', `${Math.round(missionCount / missionOrder.length * 100)}%`);
  setBar('#homeM01ProgressBar', missionCount / missionOrder.length * 100);
  setText('#homeM02ProgressText', `${navigationCount} / ${navigationOrder.length} MISSIONS`);
  setText('#homeM02ProgressPercent', `${Math.round(navigationCount / navigationOrder.length * 100)}%`);
  setBar('#homeM02ProgressBar', navigationCount / navigationOrder.length * 100);
  setText('#homeM03ProgressText', `${packageCount} / ${packageOrder.length} MISSIONS`);
  setText('#homeM03ProgressPercent', `${Math.round(packageCount / packageOrder.length * 100)}%`);
  setBar('#homeM03ProgressBar', packageCount / packageOrder.length * 100);
  setText('#homeM04ProgressText', `${odometryCount} / ${odometryOrder.length} MISSIONS`);
  setText('#homeM04ProgressPercent', `${Math.round(odometryCount / odometryOrder.length * 100)}%`);
  setBar('#homeM04ProgressBar', odometryCount / odometryOrder.length * 100);
  setText('#homeEnvStatus', envDone ? 'COMPLETE' : envCount ? 'ACTIVE' : 'READY');
  setText('#homeM01Status', missionDone ? 'COMPLETE' : missionCount ? 'ACTIVE' : envDone ? 'NEXT' : 'AFTER 00');
  setText('#homeM02Status', navigationDone ? 'COMPLETE' : navigationCount ? 'ACTIVE' : missionDone ? 'NEXT' : 'PREVIEW');
  setText('#homeM03Status', packageDone ? 'COMPLETE' : packageCount ? 'ACTIVE' : navigationDone ? 'NEXT' : 'PREVIEW');
  setText('#homeM04Status', odometryDone ? 'COMPLETE' : odometryCount ? 'ACTIVE' : packageDone ? 'NEXT' : 'PREVIEW');
  if ($('#homeEnvMark')) $('#homeEnvMark').textContent = envDone ? '✓' : envCount ? '→' : '01';
  if ($('#homeM01Mark')) $('#homeM01Mark').textContent = missionDone ? '✓' : envDone || missionCount ? '→' : '02';

  setText('#homeNextTitle', nextTitle);
  setText('#homeNextReason', nextReason);
  setText('#homeNextStage', nextStage);
  setText('#homeNextProgress', `TERMINAL EVIDENCE · ${nextDone} / ${nextTotal}`);
  $('#homeNextButton').href = nextHref;
  $('#continueLearning').href = nextHref;
  $('#headerContinue').href = nextHref;
  $('#continueLearning').innerHTML = `${routeComplete ? '复习学习路线' : totalCount ? '继续学习' : '开始学习'} <span>→</span>`;
  $('#headerContinue').innerHTML = `${routeComplete ? '复习课程' : totalCount ? '继续课程' : '进入课程'} <i>→</i>`;
  $$('.home-module-card').forEach(card => card.classList.remove('current'));
  $(`[data-home-card="${nextModule}"]`)?.classList.add('current');
  document.body.dataset.learningState = routeComplete ? 'complete' : totalCount ? 'active' : 'new';
  setText('#homeSideNote', totalCount === 0
    ? '你不需要一次学完全部内容。先完成 00.01；每次重新进入首页，系统都会重新读取进度并告诉你下一步。'
    : totalCount === total
      ? '五个开放模块已完成。回看 Odometry Readiness Packet，确认另一位新手能够从干净终端复现。'
      : `你已经留下 ${totalCount} 条学习证据。继续完成当前模块，下一步会自动跟随进度变化。`);
}

function refreshData(showMessage = false) {
  renderData();
  if (showMessage) showToast('学习进度已重新读取');
}

document.addEventListener('click', event => {
  const toggle = event.target.closest('[data-chapter-toggle]');
  if (toggle) {
    const code = toggle.dataset.chapterToggle;
    const module = $(`#chapter-module-${code}`);
    const panel = $(`#chapter-panel-${code}`);
    const expanded = !expandedModules.has(code);
    if (expanded) expandedModules.add(code);
    else expandedModules.delete(code);
    module?.classList.toggle('expanded', expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    panel?.setAttribute('aria-hidden', String(!expanded));
    if (panel) panel.inert = !expanded;
  }
  const overview = event.target.closest('[data-overview-module]');
  if (overview) {
    const code = overview.dataset.overviewModule;
    expandedModules.add(code);
    const module = $(`#chapter-module-${code}`);
    const panel = $(`#chapter-panel-${code}`);
    module?.classList.add('expanded');
    module?.querySelector('[data-chapter-toggle]')?.setAttribute('aria-expanded', 'true');
    panel?.setAttribute('aria-hidden', 'false');
    if (panel) panel.inert = false;
  }
});
$('#refreshData').addEventListener('click', () => refreshData(true));
$('#headerRefresh')?.addEventListener('click', () => refreshData(true));
window.addEventListener('storage', event => {
  if (!event.key || [envKey, moduleKey, navigationKey, packageKey, odometryKey].includes(event.key)) refreshData();
});
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('pageshow', () => {
  refreshData();
  requestAnimationFrame(() => window.scrollTo(0, 0));
});
window.addEventListener('focus', () => refreshData());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshData();
});
document.addEventListener('keydown', event => {
  if (event.key.toLowerCase() === 'r' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) refreshData(true);
});

refreshData();
requestAnimationFrame(() => window.scrollTo(0, 0));
