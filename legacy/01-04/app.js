const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const toast = $('#toast');
const storageKey = 'axisRosLearningState';
let savedState = {};
try { savedState = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) { savedState = {}; }
const completedObjectives = new Set(['base', ...(savedState.objectives || [])]);

function persistState(extra = {}) {
  savedState = { ...savedState, objectives: [...completedObjectives], ...extra };
  try { localStorage.setItem(storageKey, JSON.stringify(savedState)); } catch (_) { /* private mode */ }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove('show'), 1900);
}

function markObjective(name) {
  if (completedObjectives.has(name)) return;
  completedObjectives.add(name);
  const label = $(`[data-objective="${name}"]`);
  if (label) {
    label.classList.add('complete');
    $('i', label).textContent = '✓';
  }
  const progress = Math.round((completedObjectives.size / 6) * 100);
  $('#missionPercent').textContent = `${progress}%`;
  $('#radialProgress').style.setProperty('--progress', `${progress * 3.6}deg`);
  persistState();
  updateCapabilities();
}

function updateCapabilities() {
  const capabilityState = {
    env: completedObjectives.has('env') && completedObjectives.has('sim'),
    graph: completedObjectives.has('graph'),
    motion: completedObjectives.has('motion'),
    quiz: completedObjectives.has('quiz')
  };
  Object.entries(capabilityState).forEach(([name, complete]) => {
    const item = $(`[data-capability="${name}"]`);
    if (!item) return;
    item.classList.toggle('complete', complete);
    if (complete) $('i', item).textContent = '✓';
  });
}

function restoreProgress() {
  completedObjectives.forEach(name => {
    const label = $(`[data-objective="${name}"]`);
    if (label) { label.classList.add('complete'); $('i', label).textContent = '✓'; }
  });
  const progress = Math.round((completedObjectives.size / 6) * 100);
  $('#missionPercent').textContent = `${progress}%`;
  $('#radialProgress').style.setProperty('--progress', `${progress * 3.6}deg`);
  updateCapabilities();
  if (savedState.missionComplete) {
    $('#programPercent').textContent = '31%';
    $('#programBar').style.width = '31%';
    $('#completeMission').innerHTML = 'MISSION COMPLETE <span>✓</span>';
  }
}

$$('.module').forEach((module) => module.addEventListener('click', () => {
  if (module.dataset.href) {
    if (window.routeTo) window.routeTo(module.dataset.href);
    else window.location.href = module.dataset.href;
    return;
  }
  if (module.classList.contains('locked')) showToast(`完成前置模块后解锁：${module.dataset.module}`);
  else showToast(`当前模块：${module.dataset.module}`);
}));

const guideSteps = [
  ['第 1 步 · 确认实验环境', '先让 ROS 2、Gazebo 和机器人仿真正常运行', '依次执行两条绿色 EXECUTE 命令', '成功标志：终端出现 Container Started 与 Simulation Ready'],
  ['第 2 步 · 侦察通信图', '认识节点、Topic 与消息类型如何连接', '依次运行 LIST、INFO、INTERFACE', '成功标志：找到 Twist 的 linear.x 与 angular.z 字段'],
  ['第 3 步 · 发布运动指令', '把移动意图写成 ROS 2 的 Twist 消息', '调节两个滑杆，然后发送运动命令', '成功标志：页面返回 COMMAND ACKNOWLEDGED'],
  ['第 4 步 · 校验 TF 坐标', '理解 map、odom、机器人与传感器的空间关系', '逐个点击 TF 节点，读出父子关系', '成功标志：能口头说出 map → odom → base_link → laser_link']
];
let currentGuideIndex = 0;

function updateGuide(index) {
  currentGuideIndex = index;
  const [step, context, action, expected] = guideSteps[index];
  $('#guideStep').textContent = step;
  $('#guideContext').textContent = context;
  $('#guideAction').textContent = action;
  $('#guideExpected').textContent = expected;
}

$$('.step-rail button').forEach((button, index) => button.addEventListener('click', () => {
  $$('.step-rail button').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  $('#stepProgress').style.left = `${index * 25}%`;
  updateGuide(index);
  document.getElementById(button.dataset.target).scrollIntoView({ behavior: 'smooth' });
}));

$('#guideJump').addEventListener('click', () => {
  document.getElementById(`step-${currentGuideIndex + 1}`).scrollIntoView({ behavior: 'smooth' });
});

$$('.copy-btn').forEach(button => button.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(button.dataset.copy); } catch (_) { /* local file fallback */ }
  button.textContent = 'COPIED';
  showToast('命令已复制');
  setTimeout(() => { button.textContent = 'COPY'; }, 1200);
}));

const bootResponses = {
  'docker compose up -d': '[+] Container robotics_essentials_ros2  Started\n[+] Network robotics_training             Ready',
  'ros2 launch andino_gz andino_gz.launch.py': '[INFO] [andino_gz]: Spawned entity [andino]\n[INFO] [robot_state_publisher]: received segment base_link\n[READY] Gazebo / RViz communication established'
};

$$('.execute-btn').forEach(button => button.addEventListener('click', () => {
  $('#bootOutput').innerHTML = `<span>OK</span>${bootResponses[button.dataset.command].replaceAll('\n', '<br>')}`;
  button.textContent = 'COMPLETE';
  markObjective(button.dataset.task);
  showToast('系统步骤执行成功');
}));

const concepts = {
  topic: ['ASYNC / MANY-TO-MANY', '连续数据流：发布者不等待响应', '适合传感器数据、速度指令和状态更新。发布者与订阅者彼此解耦，可以随时加入或离开通信图。'],
  service: ['SYNC / REQUEST-RESPONSE', '一次请求对应一次明确响应', '适合保存地图、查询状态等短时任务。客户端发送请求，并等待服务端返回结果。'],
  action: ['ASYNC / GOAL-FEEDBACK-RESULT', '长任务：可反馈进度，也可以取消', '适合导航到目标点、机械臂执行轨迹等耗时任务。执行期间持续返回反馈，并最终给出结果。']
};

$$('.switch-tabs button').forEach(button => button.addEventListener('click', () => {
  $$('.switch-tabs button').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  const [mode, title, text] = concepts[button.dataset.concept];
  $('#conceptMode').textContent = mode;
  $('#conceptTitle').textContent = title;
  $('#conceptText').textContent = text;
}));

$('#burstBtn').addEventListener('click', () => {
  const stage = $('#networkStage');
  stage.classList.remove('burst');
  void stage.offsetWidth;
  stage.classList.add('burst');
  $('#packetRate').textContent = `${32 + Math.floor(Math.random() * 25)} PKT/S`;
  setTimeout(() => stage.classList.remove('burst'), 800);
});

const terminalResponses = {
  'ros2 topic list': '/cmd_vel\n/image_raw\n/odom\n/scan\n/tf\n/tf_static',
  'ros2 topic info /cmd_vel': 'Type: geometry_msgs/msg/Twist\nPublisher count: 1\nSubscription count: 1',
  'ros2 interface show geometry_msgs/msg/Twist': 'Vector3 linear\n  float64 x\n  float64 y\n  float64 z\nVector3 angular\n  float64 x\n  float64 y\n  float64 z'
};

function runTerminal() {
  const command = $('#terminalInput').value.trim();
  const output = terminalResponses[command] || `Unknown demo command: ${command}\nTry one of the guided presets.`;
  $('#terminalHistory').innerHTML += `<p><strong>robot@andino:~$ ${command}</strong>\n${output}</p>`;
  $('#terminalHistory').scrollTop = $('#terminalHistory').scrollHeight;
  if (command.includes('interface show')) markObjective('graph');
}

$('#runTerminal').addEventListener('click', runTerminal);
$('#terminalInput').addEventListener('keydown', event => { if (event.key === 'Enter') runTerminal(); });
$$('.command-presets button').forEach(button => button.addEventListener('click', () => {
  $('#terminalInput').value = button.dataset.preset;
  runTerminal();
}));

const linear = $('#linearRange');
const angular = $('#angularRange');
function updateMotionCommand() {
  const linearValue = Number(linear.value).toFixed(2);
  const angularValue = Number(angular.value).toFixed(2);
  $('#linearOut').textContent = `${linearValue} m/s`;
  $('#angularOut').textContent = `${angularValue} rad/s`;
  $('#generatedCommand').textContent = `ros2 topic pub /cmd_vel geometry_msgs/msg/Twist \\\n+"{linear: {x: ${linearValue}}, angular: {z: ${angularValue}}}"`;
}
linear.addEventListener('input', updateMotionCommand);
angular.addEventListener('input', updateMotionCommand);
$('#sendMotion').addEventListener('click', () => {
  markObjective('motion');
  showToast(`运动指令已发送 · v=${Number(linear.value).toFixed(2)} · ω=${Number(angular.value).toFixed(2)}`);
  $('#sendMotion').innerHTML = 'COMMAND ACKNOWLEDGED <span>✓</span>';
  setTimeout(() => { $('#sendMotion').innerHTML = 'TRANSMIT MOTION COMMAND <span>→</span>'; }, 1600);
});

const frames = {
  map: ['全局固定参考系。地图与导航目标通常定义在这里，允许机器人在整个已知环境中定位。', '—', 'NONE', 'NAV2 / SLAM'],
  odom: ['连续但会漂移的局部世界坐标。由轮式里程计或状态估计器持续更新。', 'map', 'ACCUMULATES', 'ODOMETRY'],
  base: ['机器人本体的主坐标系。X 指向前方，Y 指向左侧，Z 指向上方。', 'odom', 'NONE', 'ROBOT MODEL'],
  laser: ['激光雷达的传感器坐标系。LaserScan 中每束射线都从这里出发。', 'base_link', 'NONE', '/scan'],
  camera: ['相机光学系统的安装坐标。必须能变换到 base_link 才能用于融合与导航。', 'base_link', 'NONE', '/image_raw']
};

$$('.frame').forEach(button => button.addEventListener('click', () => {
  $$('.frame').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  const [text, parent, drift, usedBy] = frames[button.dataset.frame];
  $('#frameName').textContent = $('b', button).textContent;
  $('#frameText').textContent = text;
  $('#frameParent').textContent = parent;
  $('#frameDrift').textContent = drift;
  $('#frameUse').textContent = usedBy;
}));

function updateQosCompatibility() {
  const publisher = $('#publisherQos').value;
  const subscriber = $('#subscriberQos').value;
  const incompatible = publisher === 'best_effort' && subscriber === 'reliable';
  const result = $('#qosResult');
  result.classList.toggle('incompatible', incompatible);
  result.classList.toggle('compatible', !incompatible);
  result.querySelector('span').innerHTML = incompatible
    ? '<b>INCOMPATIBLE</b>订阅者要求可靠送达，但发布者只能尽力而为'
    : '<b>COMPATIBLE</b>双方可以建立数据连接';
}
$('#publisherQos').addEventListener('change', updateQosCompatibility);
$('#subscriberQos').addEventListener('change', updateQosCompatibility);

const scanShapes = [
  ['M280 286L121 131L173 80L236 153L271 93L313 143L381 72L452 139L280 286Z', '0.84'],
  ['M280 286L109 151L188 72L228 172L268 118L326 97L397 92L468 163L280 286Z', '0.62'],
  ['M280 286L139 112L191 106L239 82L274 151L321 129L374 57L439 121L280 286Z', '1.16']
];
let scanIndex = 0;
$('#sampleScan').addEventListener('click', () => {
  scanIndex = (scanIndex + 1) % scanShapes.length;
  $('#scanArea').setAttribute('d', scanShapes[scanIndex][0]);
  $('#nearestRange').textContent = `${scanShapes[scanIndex][1]} m`;
  $('#scanTimestamp').textContent = `T+ ${(12.042 + scanIndex * .118).toFixed(3)}s`;
  showToast(`新一帧 LaserScan 已捕获 · 最近障碍 ${scanShapes[scanIndex][1]}m`);
});

$$('.answer-grid button').forEach(button => button.addEventListener('click', () => {
  $$('.answer-grid button').forEach(item => item.classList.remove('correct', 'wrong'));
  const correct = button.dataset.correct === 'true';
  button.classList.add(correct ? 'correct' : 'wrong');
  $('#answerFeedback').textContent = correct
    ? '✓ 判断正确：消息存在说明 Topic 正常；报错直接指向坐标变换链。'
    : '继续缩小问题范围：/scan 已经收到，因此不是消息发布频率或消息定义的问题。';
  if (correct) markObjective('quiz');
}));

$('#completeMission').addEventListener('click', () => {
  const ready = ['env', 'sim', 'graph', 'motion', 'quiz'].every(item => completedObjectives.has(item));
  if (!ready) {
    showToast('先完成右侧任务目标，再提交验收');
    return;
  }
  $('#programPercent').textContent = '31%';
  $('#programBar').style.width = '31%';
  $('#completeMission').innerHTML = 'MISSION COMPLETE <span>✓</span>';
  persistState({ missionComplete: true });
  showToast('任务 01.04 已完成 · 下一任务已解锁');
});

const hints = [
  '提示 1/3：从右侧第一个未完成目标开始，不要跳过前置步骤。',
  '提示 2/3：环境步骤有两个绿色 EXECUTE；Topic 步骤要运行到 INTERFACE。',
  '提示 3/3：完整顺序是启动容器 → 启动仿真 → 查看接口 → 发送 Twist → 回答 TF 问题。'
];
let hintIndex = 0;
$('#hintBtn').addEventListener('click', () => {
  showToast(hints[hintIndex]);
  hintIndex = (hintIndex + 1) % hints.length;
});

$('#challengeBtn').addEventListener('click', () => {
  const checklist = $('#challengeChecklist');
  checklist.hidden = !checklist.hidden;
  $('#challengeBtn').innerHTML = checklist.hidden
    ? 'VIEW TASK CHECKLIST <span>+</span>'
    : 'HIDE TASK CHECKLIST <span>−</span>';
});

const noteInput = $('#learningNote');
noteInput.value = savedState.note || '';
let noteTimer;
noteInput.addEventListener('input', () => {
  $('#noteStatus').textContent = 'SAVING...';
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    persistState({ note: noteInput.value });
    $('#noteStatus').textContent = 'AUTOSAVED LOCALLY';
  }, 500);
});
$('#saveNote').addEventListener('click', () => {
  persistState({ note: noteInput.value });
  $('#noteStatus').textContent = 'FIELD LOG SAVED';
  showToast('学习复盘已保存在本机');
});

$$('.path-cards article').forEach((card, index) => {
  card.tabIndex = 0;
  card.addEventListener('click', () => {
    if (card.dataset.href) {
      if (window.routeTo) window.routeTo(card.dataset.href);
      else window.location.href = card.dataset.href;
    }
    else showToast(index === 0 ? '完成当前任务后将进入 01.05' : '该课程尚未解锁');
  });
});

const searchModal = $('#searchModal');
const searchIndex = [
  { type: 'CONCEPT', title: 'Node / 节点', detail: '独立运行的 ROS 2 计算单元', target: 'step-2' },
  { type: 'CONCEPT', title: 'Topic / 发布订阅', detail: '异步、多对多的数据通道', target: 'step-2' },
  { type: 'COMMAND', title: 'ros2 topic list', detail: '列出当前发现的所有 Topic', target: 'step-2' },
  { type: 'COMMAND', title: 'ros2 topic info /cmd_vel', detail: '检查速度话题类型和端点数量', target: 'step-2' },
  { type: 'MESSAGE', title: 'geometry_msgs/msg/Twist', detail: 'linear.x 与 angular.z 控制移动底盘', target: 'step-3' },
  { type: 'CONCEPT', title: 'TF / 坐标变换', detail: 'map → odom → base_link → sensor', target: 'step-4' },
  { type: 'CONCEPT', title: 'QoS / Reliability', detail: 'DDS 的可靠性与兼容策略', target: 'qosResult' },
  { type: 'NEXT', title: 'Nav2 / 自主导航', detail: '路径规划、控制与恢复行为', target: 'top' },
  { type: 'NEXT', title: 'SLAM / 建图', detail: 'Slam Toolbox 与 OccupancyGrid', target: 'top' }
];

function renderSearch(query = '') {
  const normalized = query.trim().toLowerCase();
  const results = normalized
    ? searchIndex.filter(item => `${item.title} ${item.detail} ${item.type}`.toLowerCase().includes(normalized))
    : searchIndex.slice(0, 5);
  $('#searchResults').innerHTML = results.length
    ? results.map((item, index) => `<button class="search-result" data-result="${index}" data-target="${item.target}"><span>${item.type}</span><span><b>${item.title}</b><small>${item.detail}</small></span></button>`).join('')
    : '<div class="search-empty">没有找到结果，试试 “Topic”、“TF” 或 “Nav2”。</div>';
  $$('.search-result').forEach(button => button.addEventListener('click', () => {
    closeSearch();
    document.getElementById(button.dataset.target)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
}

function openSearch() { searchModal.classList.add('open'); searchModal.setAttribute('aria-hidden', 'false'); renderSearch($('#searchInput').value); setTimeout(() => $('#searchInput').focus(), 50); }
function closeSearch() { searchModal.classList.remove('open'); searchModal.setAttribute('aria-hidden', 'true'); }
$('#searchBtn').addEventListener('click', openSearch);
$('#searchInput').addEventListener('input', event => renderSearch(event.target.value));
searchModal.addEventListener('click', event => { if (event.target === searchModal) closeSearch(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeSearch();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); }
});

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const index = ['step-1','step-2','step-3','step-4'].indexOf(entry.target.id);
    if (index < 0) return;
    $$('.step-rail button').forEach(item => item.classList.remove('active'));
    $$('.step-rail button')[index].classList.add('active');
    $('#stepProgress').style.left = `${index * 25}%`;
    updateGuide(index);
  });
}, { rootMargin: '-25% 0px -60% 0px' });
$$('.lab-section').forEach(section => sectionObserver.observe(section));

restoreProgress();
