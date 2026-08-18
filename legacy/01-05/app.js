const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const toast = $('#lessonToast');
const stateKey = 'axisRvizLessonState';
let stored = {};
try { stored = JSON.parse(localStorage.getItem(stateKey) || '{}'); } catch (_) { stored = {}; }
const objectives = new Set(stored.objectives || []);

function saveState(extra = {}) {
  stored = { ...stored, objectives: [...objectives], ...extra };
  try { localStorage.setItem(stateKey, JSON.stringify(stored)); } catch (_) { /* private mode */ }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.rvizToastTimer);
  window.rvizToastTimer = setTimeout(() => toast.classList.remove('show'), 2100);
}

function markObjective(name) {
  if (objectives.has(name)) return;
  objectives.add(name);
  const label = $(`[data-rviz-objective="${name}"]`);
  if (label) { label.classList.add('complete'); $('i', label).textContent = '✓'; }
  const capName = name === 'frames' ? 'frame' : name;
  const capability = $(`[data-rviz-cap="${capName}"]`);
  if (capability) { capability.classList.add('complete'); $('i', capability).textContent = '✓'; }
  renderProgress();
  saveState();
}

function renderProgress() {
  const progress = Math.round((objectives.size / 5) * 100);
  $('#rvizMissionPercent').textContent = `${progress}%`;
  $('#rvizRadial').style.setProperty('--progress', `${progress * 3.6}deg`);
  $('#chapterPercent').textContent = `${progress}%`;
  $('#chapterBar').style.width = `${progress}%`;
}

function restoreState() {
  objectives.forEach(name => {
    const label = $(`[data-rviz-objective="${name}"]`);
    if (label) { label.classList.add('complete'); $('i', label).textContent = '✓'; }
    const capName = name === 'frames' ? 'frame' : name;
    const cap = $(`[data-rviz-cap="${capName}"]`);
    if (cap) { cap.classList.add('complete'); $('i', cap).textContent = '✓'; }
  });
  renderProgress();
  if (stored.complete) $('#finishRvizLesson').innerHTML = 'LESSON COMPLETE <span>✓</span>';
}

const guideData = [
  ['第 1 步 · 认识 RViz 界面', '先分清 Displays、3D View 与 Fixed Frame', '点击界面上的 3 个热点逐一查看', '成功标志：能说出每个区域负责什么', '点击 01、02、03 三个界面热点'],
  ['第 2 步 · 添加雷达扫描', '把 /scan 的距离数组转换为可见点', '点击 RUN GUIDED SETUP 完成三步配置', '成功标志：画面出现青色扫描点，Status 为 OK', '运行 LaserScan 引导配置'],
  ['第 3 步 · 观察相机画面', '为高频图像选择 Topic 与 QoS', '选择 /image_raw，然后激活 Camera', '成功标志：画面刷新并显示 FPS', '选择 /image_raw 并激活 Camera'],
  ['第 4 步 · 切换参考坐标', '理解 Fixed Frame 如何改变观察方式', '依次点击三个 Frame，再模拟机器人移动', '成功标志：能解释机器人和世界谁在移动', '比较三个 Fixed Frame 并模拟运动']
];
let currentStep = 0;

function setGuide(index) {
  currentStep = index;
  const [step, context, action, expected, sideAction] = guideData[index];
  $('#lessonGuideStep').textContent = step;
  $('#lessonGuideContext').textContent = context;
  $('#lessonGuideAction').textContent = action;
  $('#lessonGuideExpected').textContent = expected;
  $('#sideNextAction').textContent = sideAction;
}

function jumpToStep(index) {
  document.getElementById(`rviz-step-${index + 1}`).scrollIntoView({ behavior: 'smooth' });
}

$('#lessonGuideJump').addEventListener('click', () => jumpToStep(currentStep));
$('#sideNextJump').addEventListener('click', () => jumpToStep(currentStep));
$$('.lesson-step-rail button').forEach((button, index) => button.addEventListener('click', () => {
  $$('.lesson-step-rail button').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  $('#lessonStepProgress').style.left = `${index * 25}%`;
  setGuide(index);
  document.getElementById(button.dataset.target).scrollIntoView({ behavior: 'smooth' });
}));

const anatomyInfo = {
  displays: ['AREA / 01', 'Displays 面板', '这里管理所有可视化插件。每个 Display 都订阅一种 ROS 数据，并显示 Topic、QoS、颜色、尺寸和状态。', 'Display 名称左侧应出现绿色勾选，Status 应为 OK。'],
  viewport: ['AREA / 02', '3D View 视图', '这里绘制转换后的机器人模型与传感器数据。鼠标左键旋转视角，中键平移，滚轮缩放。', '画面空白时先看 Displays 状态，而不是反复拖动视角。'],
  frame: ['AREA / 03', 'Global Options 与工具栏', 'Fixed Frame 决定所有数据最终被转换到哪个参考系。工具栏则提供初始位姿、导航目标和测量工具。', '移动机器人前，确认 Fixed Frame 是 odom 或 map。']
};
const visitedHotspots = new Set();

$$('.hotspot').forEach(button => button.addEventListener('click', () => {
  $$('.hotspot').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  visitedHotspots.add(button.dataset.hotspot);
  const [number, title, text, check] = anatomyInfo[button.dataset.hotspot];
  $('#anatomyNumber').textContent = number;
  $('#anatomyTitle').textContent = title;
  $('#anatomyText').textContent = text;
  $('#anatomyCheck').textContent = check;
  if (visitedHotspots.size === 3) { markObjective('ui'); showToast('界面导览完成 · 进入 LaserScan 配置'); }
}));

let builderIndex = 0;
$('#addLaserDisplay').addEventListener('click', () => {
  const steps = $$('.builder-step');
  if (builderIndex < steps.length) {
    steps.forEach(item => item.classList.remove('active'));
    steps[builderIndex].classList.add('active');
    builderIndex += 1;
  }
  if (builderIndex < steps.length) {
    $('#addLaserDisplay').textContent = `CONFIRM STEP ${builderIndex} →`;
    showToast(`配置 ${builderIndex}/3 已确认，请继续`);
    return;
  }
  $('#laserRing').classList.add('active');
  $('#laserStatus').textContent = 'LASERSCAN / OK';
  $('#laserStatus').style.color = 'var(--cyan)';
  $('#laserStatusDot').classList.add('ok');
  $('#laserStatusText').textContent = '360 points · 10.0 Hz';
  $('#laserStatusText').classList.add('ok');
  $('#addLaserDisplay').textContent = 'LASERSCAN ACTIVE ✓';
  markObjective('laser');
  showToast('LaserScan 已显示 · Topic /scan · Status OK');
});

$('#alphaRange').addEventListener('input', event => {
  $('#alphaOutput').textContent = Number(event.target.value).toFixed(1);
  $('.robot-corridor').style.opacity = event.target.value;
});

let cameraTimer;
$('#activateCamera').addEventListener('click', () => {
  const topic = $('#cameraTopic').value;
  if (topic !== 'image') {
    showToast(topic === 'info' ? '/camera_info 只有参数，不包含图像像素' : '请先选择 /image_raw');
    $('#cameraTopic').focus();
    return;
  }
  $('#cameraFeed').classList.add('active');
  $('#cameraFps').textContent = '30.0 FPS';
  $('#activateCamera').textContent = 'CAMERA DISPLAY ACTIVE ✓';
  clearInterval(cameraTimer);
  let t = 0;
  cameraTimer = setInterval(() => { t += .033; $('#cameraTime').textContent = `T+${t.toFixed(3)}`; }, 500);
  markObjective('camera');
  showToast(`相机已激活 · ${$('#cameraReliability').value.replace('_',' ').toUpperCase()} QoS`);
});

const fixedFrameInfo = {
  base: ['base_footprint', 'BASE MODE', '机器人固定在画面中心，网格和障碍物会随机器人反向移动。'],
  odom: ['odom', 'ODOM MODE', '机器人会相对启动位置移动；轮式误差可能逐渐累积。'],
  map: ['map', 'MAP MODE', '地图保持全局固定，定位系统负责维护 map 到 odom 的修正。']
};
const visitedFrames = new Set(['odom']);
let selectedFrame = 'odom';

$$('[data-fixed]').forEach(button => button.addEventListener('click', () => {
  $$('[data-fixed]').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  selectedFrame = button.dataset.fixed;
  visitedFrames.add(selectedFrame);
  const [caption, mode, description] = fixedFrameInfo[selectedFrame];
  $('#frameCaption').textContent = caption;
  $('#frameResult').innerHTML = `<b>${mode}</b><p>${description}</p>`;
  $('#frameStage').classList.toggle('base-mode', selectedFrame === 'base');
  if (visitedFrames.size === 3) showToast('三个参考坐标已比较 · 再模拟一次机器人移动');
}));

$('#moveRobot').addEventListener('click', () => {
  $('#frameStage').classList.toggle('moved');
  $('#moveRobot').innerHTML = $('#frameStage').classList.contains('moved') ? 'RESET ROBOT POSITION <span>↺</span>' : 'SIMULATE ROBOT MOTION <span>→</span>';
  if (visitedFrames.size === 3) markObjective('frames');
});

$$('.rviz-assessment .answer-grid button').forEach(button => button.addEventListener('click', () => {
  $$('.rviz-assessment .answer-grid button').forEach(item => item.classList.remove('correct','wrong'));
  const correct = button.dataset.correct === 'true';
  button.classList.add(correct ? 'correct' : 'wrong');
  $('#rvizAnswerFeedback').textContent = correct
    ? '✓ 正确：/scan 已有 10 Hz 数据，问题明确发生在坐标变换阶段。'
    : '再缩小范围：Topic 已经有稳定数据，所以不需要修改发布频率或 Display 类型。';
  if (correct) markObjective('quiz');
}));

$('#rvizChecklistBtn').addEventListener('click', () => {
  const checklist = $('#rvizChecklist');
  checklist.hidden = !checklist.hidden;
  $('#rvizChecklistBtn').innerHTML = checklist.hidden ? 'VIEW CHECKLIST <span>+</span>' : 'HIDE CHECKLIST <span>−</span>';
});

$('#finishRvizLesson').addEventListener('click', () => {
  if (objectives.size < 5) {
    const missing = 5 - objectives.size;
    showToast(`还有 ${missing} 个新手任务未完成，请查看右侧清单`);
    return;
  }
  saveState({ complete: true });
  $('#finishRvizLesson').innerHTML = 'LESSON COMPLETE <span>✓</span>';
  showToast('01.05 已完成 · 你已掌握基础 RViz 监控与排错');
});

const hints = [
  ['先点击 Displays 面板里的 01，再点击视图中的 02，最后点击工具栏 03。','LaserScan 设置顺序：Display 类型 → /scan → Points 样式。','Camera 必须选择 /image_raw，/camera_info 不包含像素。','Fixed Frame 三个选项都点一次，再点击模拟移动。'],
  ['Displays 负责订阅与配置数据。','如果 /scan 有数据但画面空白，展开 Status 检查 TF。','高频相机通常使用 Best Effort，避免等待重传。','base_footprint 模式下机器人固定，世界会相对移动。']
];
let hintDepth = 0;
$('#rvizHintBtn').addEventListener('click', () => {
  showToast(`提示 ${hintDepth + 1}/2：${hints[hintDepth][currentStep]}`);
  hintDepth = (hintDepth + 1) % hints.length;
});

$$('.mission-link.locked').forEach(button => button.addEventListener('click', () => showToast('完成 01.05 后解锁后续任务')));

const searchItems = [
  { type:'INTERFACE', title:'Displays 面板', detail:'管理可视化插件与 Status', target:'rviz-step-1' },
  { type:'SENSOR', title:'LaserScan /scan', detail:'显示激光雷达距离点', target:'rviz-step-2' },
  { type:'SENSOR', title:'Camera /image_raw', detail:'显示机器人相机图像', target:'rviz-step-3' },
  { type:'FRAME', title:'Fixed Frame', detail:'决定所有数据的参考坐标', target:'rviz-step-4' },
  { type:'DEBUG', title:'No transform', detail:'检查 TF 链和消息 frame_id', target:'rviz-step-4' }
];
const searchModal = $('#lessonSearchModal');

function renderSearch(query='') {
  const q = query.trim().toLowerCase();
  const items = q ? searchItems.filter(item => `${item.title} ${item.detail}`.toLowerCase().includes(q)) : searchItems;
  $('#lessonSearchResults').innerHTML = items.length ? items.map(item => `<button class="search-result" data-target="${item.target}"><span>${item.type}</span><span><b>${item.title}</b><small>${item.detail}</small></span></button>`).join('') : '<div class="search-empty">没有结果，试试 “LaserScan” 或 “Frame”。</div>';
  $$('.search-result', $('#lessonSearchResults')).forEach(button => button.addEventListener('click', () => {
    closeSearch();
    document.getElementById(button.dataset.target).scrollIntoView({ behavior:'smooth' });
  }));
}
function openSearch() { searchModal.classList.add('open'); searchModal.setAttribute('aria-hidden','false'); renderSearch($('#lessonSearchInput').value); setTimeout(()=>$('#lessonSearchInput').focus(),50); }
function closeSearch() { searchModal.classList.remove('open'); searchModal.setAttribute('aria-hidden','true'); }
$('#lessonSearchBtn').addEventListener('click', openSearch);
$('#lessonSearchInput').addEventListener('input', event => renderSearch(event.target.value));
searchModal.addEventListener('click', event => { if (event.target === searchModal) closeSearch(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeSearch();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); }
});

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  const index = ['rviz-step-1','rviz-step-2','rviz-step-3','rviz-step-4'].indexOf(entry.target.id);
  if (index < 0) return;
  $$('.lesson-step-rail button').forEach(item => item.classList.remove('active'));
  $$('.lesson-step-rail button')[index].classList.add('active');
  $('#lessonStepProgress').style.left = `${index * 25}%`;
  setGuide(index);
}), { rootMargin:'-25% 0px -60% 0px' });
$$('.lesson-console .lab-section').forEach(section => observer.observe(section));

restoreState();
