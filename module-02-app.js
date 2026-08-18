const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));
const lessons = window.module02Lessons;
const lessonOrder = window.module02Order;
const stateKey = 'axisModule02Navigation';
const stageOrder = ['understand', 'chain', 'lab', 'verify'];
const toast = $('#module02Toast');

let saved = {};
try { saved = JSON.parse(localStorage.getItem(stateKey) || '{}'); } catch (_) { saved = {}; }
saved.completed = Array.isArray(saved.completed) ? saved.completed : [];
saved.steps = saved.steps && typeof saved.steps === 'object' ? saved.steps : {};
saved.scenarios = saved.scenarios && typeof saved.scenarios === 'object' ? saved.scenarios : {};
saved.checks = saved.checks && typeof saved.checks === 'object' ? saved.checks : {};

const completed = new Set(saved.completed.filter(function (name) { return Boolean(lessons[name]); }));
const requestedLesson = new URLSearchParams(window.location.search).get('lesson');
let currentLesson = lessons[requestedLesson] ? requestedLesson : lessons[saved.currentLesson] ? saved.currentLesson : lessonOrder[0];
let currentStage = 'understand';
let completedSteps = new Set();
let scenarioSolved = false;
let reviewedChecks = new Set();
let conceptVisited = new Set();
let chainVisited = new Set();

function persist() {
  saved.completed = Array.from(completed);
  saved.currentLesson = currentLesson;
  saved.steps[currentLesson] = Array.from(completedSteps);
  saved.scenarios[currentLesson] = scenarioSolved;
  saved.checks[currentLesson] = Array.from(reviewedChecks);
  try { localStorage.setItem(stateKey, JSON.stringify(saved)); } catch (_) {}
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.module02ToastTimer);
  window.module02ToastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2400);
}

function lessonIndex(name) {
  return lessonOrder.indexOf(name);
}

function conceptIsComplete() {
  const lesson = lessons[currentLesson];
  return conceptVisited.size >= lesson.concepts.length || completedSteps.size > 0 || completed.has(currentLesson);
}

function chainIsComplete() {
  const lesson = lessons[currentLesson];
  return chainVisited.size >= lesson.chain.nodes.length || completedSteps.size > 0 || completed.has(currentLesson);
}

function labIsComplete() {
  return completedSteps.size >= lessons[currentLesson].lab.steps.length || completed.has(currentLesson);
}

function checksAreComplete() {
  return reviewedChecks.size >= lessons[currentLesson].checks.length || completed.has(currentLesson);
}

function loadLessonState(name) {
  const lesson = lessons[name];
  completedSteps = new Set(Array.isArray(saved.steps[name]) ? saved.steps[name].filter(function (index) {
    return Number.isInteger(index) && index >= 0 && index < lesson.lab.steps.length;
  }) : []);
  scenarioSolved = Boolean(saved.scenarios[name]);
  reviewedChecks = new Set(Array.isArray(saved.checks[name]) ? saved.checks[name].filter(function (index) {
    return Number.isInteger(index) && index >= 0 && index < lesson.checks.length;
  }) : []);
  if (completed.has(name)) {
    completedSteps = new Set(lesson.lab.steps.map(function (_, index) { return index; }));
    scenarioSolved = true;
    reviewedChecks = new Set(lesson.checks.map(function (_, index) { return index; }));
  }
  conceptVisited = new Set();
  chainVisited = new Set();
  currentStage = 'understand';
}

function readProgress(key, expected) {
  let value = {};
  try { value = JSON.parse(localStorage.getItem(key) || '{}'); } catch (_) { value = {}; }
  const count = Array.isArray(value.completed) ? new Set(value.completed).size : 0;
  return {count: count, ready: count >= expected};
}

function renderPrerequisiteReadiness() {
  const environment = readProgress('axisEnvironmentProgress', 5);
  const communication = readProgress('axisModule01Foundations', 8);
  const envIcon = $('#readiness00');
  const communicationIcon = $('#readiness01');
  envIcon.textContent = environment.ready ? '✓' : '○';
  communicationIcon.textContent = communication.ready ? '✓' : '○';
  envIcon.classList.toggle('complete', environment.ready);
  communicationIcon.classList.toggle('complete', communication.ready);
  $('#module02EnvState').textContent = environment.ready ? '✓' : '○';
  $('#module02CommState').textContent = communication.ready ? '✓' : '○';
  $('#readinessMessage').textContent = environment.ready && communication.ready
    ? '前置模块已完成，可以按本章顺序执行真实实验。'
    : '允许预览和自主选章；真实实验前请补齐未完成的环境、Topic、TF 与控制证据。';
  $('#prerequisiteReadiness').classList.toggle('ready', environment.ready && communication.ready);
}

function renderProgress() {
  const percent = Math.round(completed.size / lessonOrder.length * 100);
  $('#module02Percent').textContent = percent + '%';
  $('#module02Bar').style.width = percent + '%';
  $('#module02GaugePercent').textContent = percent + '%';
  $('.module02-gauge').style.setProperty('--score', (percent * 3.6) + 'deg');
  $$('[data-lesson]').forEach(function (button, index) {
    const name = button.dataset.lesson;
    const done = completed.has(name);
    const active = name === currentLesson;
    button.classList.toggle('complete', done);
    button.classList.toggle('active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
    $(':scope > i', button).textContent = done ? '✓' : active ? '→' : String(index + 1).padStart(2, '0');
  });
  renderEvidencePanel();
}

function renderEvidencePanel() {
  const lesson = lessons[currentLesson];
  const done = completed.has(currentLesson);
  const conceptDone = conceptIsComplete();
  const chainDone = chainIsComplete();
  const labDone = labIsComplete();
  const verifyDone = done;
  $('#statusLessonCode').textContent = lesson.code;
  $('#statusLessonTitle').textContent = lesson.title;
  const rows = [
    {element: $('#statusUnderstand'), stage:'understand', complete:conceptDone, meta:conceptDone ? '概念关系已经建立' : conceptVisited.size + ' / ' + lesson.concepts.length + ' 个概念'},
    {element: $('#statusChain'), stage:'chain', complete:chainDone, meta:chainVisited.size + ' / ' + lesson.chain.nodes.length + ' 个节点'},
    {element: $('#statusLab'), stage:'lab', complete:labDone, meta:completedSteps.size + ' / ' + lesson.lab.steps.length + ' 条证据'},
    {element: $('#statusVerify'), stage:'verify', complete:verifyDone, meta:done ? '本节已经完成' : labDone ? ((scenarioSolved ? 1 : 0) + ' / 1 诊断 · ' + reviewedChecks.size + ' / ' + lesson.checks.length + ' 检查') : '等待真实实验证据'}
  ];
  rows.forEach(function (row) {
    row.element.classList.toggle('active', currentStage === row.stage);
    row.element.classList.toggle('complete', row.complete);
    $('small', row.element).textContent = row.meta;
  });
}

function updateStageLocks() {
  $$('[data-stage]').forEach(function (button) {
    const stage = button.dataset.stage;
    const locked = (stage === 'chain' && !conceptIsComplete())
      || (stage === 'lab' && !chainIsComplete())
      || (stage === 'verify' && !labIsComplete());
    button.classList.toggle('locked', locked);
    button.setAttribute('aria-disabled', String(locked));
  });
}

function renderLearningGuard() {
  const lesson = lessons[currentLesson];
  let title = '';
  let text = '';
  let state = '';
  if (currentStage === 'understand') {
    const remaining = Math.max(0, lesson.concepts.length - conceptVisited.size);
    title = remaining ? '还要理解 ' + remaining + ' 个核心概念' : '概念已经看完，可以进入系统链';
    text = remaining
      ? '点击尚未查看的概念，重点理解它与前置 Topic、TF 以及后续导航的关系。'
      : '下一阶段会把输入、算法、输出和失败现象串成四个连续节点。';
    state = conceptVisited.size + ' / ' + lesson.concepts.length + ' 概念';
  } else if (currentStage === 'chain') {
    const remaining = Math.max(0, lesson.chain.nodes.length - chainVisited.size);
    title = remaining ? '沿箭头继续，还差 ' + remaining + ' 个系统节点' : '系统链已经看完，可以进入真实实验';
    text = remaining
      ? '节点必须按顺序查看。每次说清它的输入、输出和故障表现，再进入下一站。'
      : '接下来只执行当前亮起的一步；看不到成功证据就停在当前层。';
    state = chainVisited.size + ' / ' + lesson.chain.nodes.length + ' 节点';
  } else if (currentStage === 'lab') {
    if (!labIsComplete()) {
      const nextIndex = lesson.lab.steps.findIndex(function (_, index) { return !completedSteps.has(index); });
      title = '当前只做第 ' + (nextIndex + 1) + ' 步：' + lesson.lab.steps[nextIndex].action;
      text = '执行位置是“' + lesson.lab.steps[nextIndex].terminal + '”。同时保持：' + lesson.lab.steps[nextIndex].keep + '。';
      state = completedSteps.size + ' / ' + lesson.lab.steps.length + ' 证据';
    } else {
      title = '真实实验证据已经齐，可以进入诊断验收';
      text = '下一阶段只使用本节已经建立的知识，根据症状选择最有效的第一项检查。';
      state = '允许验收';
    }
  } else {
    if (!scenarioSolved) {
      title = '先完成现场诊断题';
      text = '先观察症状和已经成立的证据，再选择能最快缩小故障范围的检查。答错可以继续。';
      state = '诊断待完成';
    } else if (!checksAreComplete()) {
      title = '还要核对 ' + (lesson.checks.length - reviewedChecks.size) + ' 个掌握问题';
      text = '先在心里回答，再展开答案核对。问题不会引入本节没有教过的新知识。';
      state = reviewedChecks.size + ' / ' + lesson.checks.length + ' 检查';
    } else if (!completed.has(currentLesson)) {
      title = '所有门禁已通过，可以完成本节';
      text = lesson.after.deliverable;
      state = '等待确认';
    } else {
      title = '本节已完成，可以进入下一项任务';
      text = lesson.next;
      state = '任务完成';
    }
  }
  $('#module02GuardTitle').textContent = title;
  $('#module02GuardText').textContent = text;
  $('#module02GuardState').textContent = state;
  $('#module02LearningGuard').classList.toggle('complete', completed.has(currentLesson));
  updateStageLocks();
  renderEvidencePanel();
}

function setStage(stage, options) {
  options = options || {};
  if (!stageOrder.includes(stage)) return;
  if (stage === 'chain' && !conceptIsComplete()) {
    if (options.guardMessage !== false) showToast('请先看完三个核心概念，避免直接背命令');
    stage = 'understand';
  }
  if (stage === 'lab' && !chainIsComplete()) {
    if (options.guardMessage !== false) showToast('请先按顺序看完四个系统节点');
    stage = conceptIsComplete() ? 'chain' : 'understand';
  }
  if (stage === 'verify' && !labIsComplete()) {
    if (options.guardMessage !== false) showToast('真实终端证据还不完整，不能提前验收');
    stage = chainIsComplete() ? 'lab' : conceptIsComplete() ? 'chain' : 'understand';
  }
  currentStage = stage;
  $$('[data-stage]').forEach(function (button) {
    const active = button.dataset.stage === stage;
    button.classList.toggle('active', active);
    button.setAttribute('aria-current', active ? 'step' : 'false');
  });
  $$('[data-stage-panel]').forEach(function (panel) {
    panel.hidden = panel.dataset.stagePanel !== stage;
  });
  if (stage === 'chain' && chainVisited.size === 0) selectChainNode(0, true);
  updateCommandLocks();
  renderLearningGuard();
  updateCompletionGates();
  updateCurrentAction();
  if (options.scroll !== false) $('.module02-stage-nav').scrollIntoView({behavior:'smooth', block:'start'});
}

function selectConcept(index, mark) {
  const lesson = lessons[currentLesson];
  const concept = lesson.concepts[index];
  if (!concept) return;
  if (mark !== false) conceptVisited.add(index);
  $$('[data-concept]').forEach(function (button) {
    const buttonIndex = Number(button.dataset.concept);
    button.classList.toggle('active', buttonIndex === index);
    button.classList.toggle('visited', conceptVisited.has(buttonIndex));
    button.setAttribute('aria-pressed', String(buttonIndex === index));
  });
  $('#conceptLabel').textContent = 'CONCEPT / ' + String(index + 1).padStart(2, '0') + ' · ' + concept.label;
  $('#conceptTitle').textContent = concept.title;
  $('#conceptDefinition').textContent = concept.definition;
  $('#conceptDetail').textContent = concept.detail;
  renderLearningGuard();
  updateCurrentAction();
}

function renderConcepts() {
  const lesson = lessons[currentLesson];
  $('#conceptSelector').innerHTML = lesson.concepts.map(function (concept, index) {
    return '<button type="button" data-concept="' + index + '"><i>' + String(index + 1).padStart(2, '0') + '</i><span><b>' + concept.title + '</b><small>' + concept.label + '</small></span></button>';
  }).join('');
  $$('[data-concept]').forEach(function (button) {
    button.addEventListener('click', function () { selectConcept(Number(button.dataset.concept), true); });
  });
  selectConcept(0, true);
}

function renderChain() {
  const lesson = lessons[currentLesson];
  $('#systemChainNodes').innerHTML = lesson.chain.nodes.map(function (node, index) {
    return '<button type="button" data-chain-node="' + index + '"><i>' + String(index + 1).padStart(2, '0') + '</i><span><small>' + node.tag + '</small><b>' + node.title + '</b></span><em>' + node.role + '</em></button>';
  }).join('');
  $$('[data-chain-node]').forEach(function (button) {
    button.addEventListener('click', function () { selectChainNode(Number(button.dataset.chainNode), true); });
  });
  selectChainNode(0, false);
}

function updateChainLocks() {
  $$('[data-chain-node]').forEach(function (button) {
    const index = Number(button.dataset.chainNode);
    const previousDone = Array.from({length:index}, function (_, value) { return value; }).every(function (required) { return chainVisited.has(required); });
    const available = index === 0 || previousDone || chainVisited.has(index);
    button.disabled = !available;
    button.classList.toggle('locked', !available);
    button.classList.toggle('visited', chainVisited.has(index));
  });
}

function selectChainNode(index, mark) {
  const lesson = lessons[currentLesson];
  const node = lesson.chain.nodes[index];
  if (!node) return;
  const previousDone = Array.from({length:index}, function (_, value) { return value; }).every(function (required) { return chainVisited.has(required); });
  if (mark && index > 0 && !previousDone) {
    const nextIndex = lesson.chain.nodes.findIndex(function (_, nodeIndex) { return !chainVisited.has(nodeIndex); });
    showToast('请先查看第 ' + (nextIndex + 1) + ' 个节点，系统链不能跳着学');
    return;
  }
  if (mark) chainVisited.add(index);
  $$('[data-chain-node]').forEach(function (button) {
    const buttonIndex = Number(button.dataset.chainNode);
    button.classList.toggle('active', buttonIndex === index);
    button.setAttribute('aria-pressed', String(buttonIndex === index));
  });
  $('#systemNodeTag').textContent = 'NODE / ' + String(index + 1).padStart(2, '0') + ' · ' + node.tag;
  $('#systemNodeTitle').textContent = node.title;
  $('#systemNodeRole').textContent = node.role;
  $('#systemNodeDetail').textContent = node.detail;
  $('#systemNodePreview').textContent = node.preview;
  updateChainLocks();
  renderLearningGuard();
  updateCurrentAction();
}

function renderCommands() {
  const lesson = lessons[currentLesson];
  $('#module02Commands').innerHTML = lesson.lab.steps.map(function (step, index) {
    const done = completedSteps.has(index);
    const stop = step.stop ? '<div class="command-stop"><b>何时停止或保持</b><p>' + step.stop + '</p></div>' : '';
    const copyLabel = step.manual ? '复制界面操作' : '复制命令';
    const evidenceLabel = done ? '证据已核对' : step.manual ? '我已对照界面结果' : '我已对照真实输出';
    return '<article class="module02-command' + (done ? ' complete' : '') + '" data-command="' + index + '">'
      + '<div class="command-location"><span>在哪里执行</span><b>' + step.terminal + '</b><small>必须保持：' + step.keep + '</small></div>'
      + '<div class="command-main"><span>STEP / ' + String(index + 1).padStart(2, '0') + '</span><h3>' + step.action + '</h3><code>' + step.command + '</code>'
      + '<div class="command-evidence"><b>看到这个再确认</b><p>' + step.expected + '</p></div>'
      + '<div class="command-recovery"><b>失败时只修当前层</b><p>' + step.recovery + '</p></div>' + stop + '</div>'
      + '<div class="command-actions"><label class="evidence-confirmation"><input class="evidence-ready" type="checkbox"' + (done ? ' checked disabled' : '') + ' /><span>' + evidenceLabel + '</span></label>'
      + '<button type="button" class="copy-command">' + copyLabel + '</button><button type="button" class="confirm-command">' + (done ? '已经确认' : '先勾选证据') + '</button></div></article>';
  }).join('');
  $$('.copy-command', $('#module02Commands')).forEach(function (button) {
    button.addEventListener('click', function () {
      const row = button.closest('[data-command]');
      const step = lesson.lab.steps[Number(row.dataset.command)];
      copyText(step.command, button);
    });
  });
  $$('.evidence-ready', $('#module02Commands')).forEach(function (input) {
    input.addEventListener('change', function () {
      updateCommandLocks();
      if (input.checked) showToast('证据自检已勾选，请再次确认真实结果与说明一致');
    });
  });
  $$('.confirm-command', $('#module02Commands')).forEach(function (button) {
    button.addEventListener('click', function () { confirmCommand(button.closest('[data-command]')); });
  });
  updateCommandLocks();
}

function updateCommandLocks() {
  $$('.module02-command').forEach(function (row) {
    const index = Number(row.dataset.command);
    const done = completedSteps.has(index);
    const previousDone = Array.from({length:index}, function (_, value) { return value; }).every(function (required) { return completedSteps.has(required); });
    const available = done || previousDone;
    const evidence = $('.evidence-ready', row);
    const copyButton = $('.copy-command', row);
    const confirmButton = $('.confirm-command', row);
    row.classList.toggle('locked', !available);
    row.classList.toggle('current', available && !done);
    row.classList.toggle('complete', done);
    row.setAttribute('aria-disabled', String(!available));
    copyButton.disabled = !available;
    evidence.disabled = !available || done;
    confirmButton.disabled = !available || done || !evidence.checked;
    confirmButton.textContent = done ? '已经确认' : evidence.checked ? '我看到了，确认' : '先勾选证据';
  });
}

function confirmCommand(row) {
  const index = Number(row.dataset.command);
  const lesson = lessons[currentLesson];
  if (completedSteps.has(index)) return;
  const previousDone = Array.from({length:index}, function (_, value) { return value; }).every(function (required) { return completedSteps.has(required); });
  if (!previousDone) {
    showToast('请先完成上一项，避免跳过必要状态');
    return;
  }
  const evidence = $('.evidence-ready', row);
  if (!evidence.checked) {
    showToast('只有真实结果符合说明后才能确认');
    return;
  }
  completedSteps.add(index);
  persist();
  $('#module02Output').innerHTML = '<i>EVIDENCE ' + String(index + 1).padStart(2, '0') + '</i>' + lesson.lab.steps[index].expected;
  updateCommandLocks();
  updateCompletionGates();
  renderLearningGuard();
  updateCurrentAction();
  if (labIsComplete()) showToast('真实实验证据已齐，可以进入“验收与任务”');
}

function renderScenario() {
  const scenario = lessons[currentLesson].scenario;
  $('#scenarioTitle').textContent = scenario.title;
  $('#scenarioSymptom').textContent = scenario.symptom;
  $('#scenarioQuestion').textContent = scenario.question;
  $('#scenarioOptions').innerHTML = scenario.options.map(function (option, index) {
    return '<button type="button" data-scenario-option="' + index + '"><i>' + String.fromCharCode(65 + index) + '</i><span>' + option + '</span></button>';
  }).join('');
  $('#scenarioFeedback').textContent = scenarioSolved ? '该诊断已经通过。你仍可重新比较其他选项。' : '先观察证据，再选择第一项检查_';
  $('#scenarioFeedback').className = scenarioSolved ? 'success' : '';
  $$('[data-scenario-option]').forEach(function (button) {
    button.addEventListener('click', function () { answerScenario(Number(button.dataset.scenarioOption)); });
  });
}

function answerScenario(index) {
  const scenario = lessons[currentLesson].scenario;
  const correct = index === scenario.correct;
  $$('[data-scenario-option]').forEach(function (button) {
    button.classList.remove('correct', 'wrong');
    if (Number(button.dataset.scenarioOption) === index) button.classList.add(correct ? 'correct' : 'wrong');
  });
  $('#scenarioFeedback').textContent = correct ? scenario.correctText : scenario.wrongText;
  $('#scenarioFeedback').className = correct ? 'success' : 'error';
  if (correct) {
    scenarioSolved = true;
    persist();
    updateCompletionGates();
    renderLearningGuard();
    updateCurrentAction();
  }
}

function renderMasteryChecks() {
  const lesson = lessons[currentLesson];
  $('#masteryChecks').innerHTML = lesson.checks.map(function (check, index) {
    const reviewed = reviewedChecks.has(index);
    return '<button type="button" class="mastery-check' + (reviewed ? ' reviewed' : '') + '" data-check="' + index + '" aria-expanded="' + String(reviewed) + '"><span>CHECK / ' + String(index + 1).padStart(2, '0') + '</span><b>' + check.prompt + '</b><em>' + (reviewed ? '已展开并核对' : '先回答，再点击查看') + '</em><p>' + check.answer + '</p></button>';
  }).join('');
  $$('[data-check]').forEach(function (button) {
    button.addEventListener('click', function () {
      const index = Number(button.dataset.check);
      reviewedChecks.add(index);
      button.classList.add('reviewed');
      button.setAttribute('aria-expanded', 'true');
      $('em', button).textContent = '已展开并核对';
      persist();
      updateCompletionGates();
      renderLearningGuard();
      updateCurrentAction();
    });
  });
}

function updateCompletionGates() {
  const lesson = lessons[currentLesson];
  $('#labGate').textContent = '实验证据 · ' + completedSteps.size + '/' + lesson.lab.steps.length;
  $('#scenarioGate').textContent = scenarioSolved ? '诊断 · 已通过' : '诊断 · 待完成';
  $('#checkGate').textContent = '掌握检查 · ' + reviewedChecks.size + '/' + lesson.checks.length;
  $('#labGate').classList.toggle('complete', labIsComplete());
  $('#scenarioGate').classList.toggle('complete', scenarioSolved);
  $('#checkGate').classList.toggle('complete', checksAreComplete());
}

function renderQuickCommands() {
  const lesson = lessons[currentLesson];
  $('#lessonQuickCommands').innerHTML = lesson.lab.steps.slice(0, 4).map(function (step, index) {
    return '<button type="button" data-quick-index="' + index + '"><code>' + step.command + '</code><small>' + step.terminal + '</small><i>COPY</i></button>';
  }).join('');
  $$('[data-quick-index]').forEach(function (button) {
    button.addEventListener('click', function () {
      const step = lesson.lab.steps[Number(button.dataset.quickIndex)];
      copyText(step.command, button);
    });
  });
}

function updateCurrentAction() {
  const lesson = lessons[currentLesson];
  let action = '';
  if (currentStage === 'understand') {
    const nextConcept = lesson.concepts.findIndex(function (_, index) { return !conceptVisited.has(index); });
    action = nextConcept >= 0 ? '查看概念：' + lesson.concepts[nextConcept].title : '三个概念已看完，进入系统链';
  } else if (currentStage === 'chain') {
    const nextNode = lesson.chain.nodes.findIndex(function (_, index) { return !chainVisited.has(index); });
    action = nextNode >= 0 ? '继续追踪：' + lesson.chain.nodes[nextNode].title : '四个节点已看完，进入真实实验';
  } else if (currentStage === 'lab') {
    const nextStep = lesson.lab.steps.findIndex(function (_, index) { return !completedSteps.has(index); });
    action = nextStep >= 0 ? '当前只做：' + lesson.lab.steps[nextStep].action : '实验证据已齐，进入诊断验收';
  } else if (!scenarioSolved) {
    action = '完成现场诊断题';
  } else if (!checksAreComplete()) {
    action = '核对剩余 ' + (lesson.checks.length - reviewedChecks.size) + ' 个掌握问题';
  } else if (!completed.has(currentLesson)) {
    action = '所有条件已满足，确认完成本节';
  } else {
    action = lessonIndex(currentLesson) === lessonOrder.length - 1 ? '模块完成，进入 03 创建 ROS 2 功能包' : '进入下一任务：' + lesson.next;
  }
  $('#currentActionText').textContent = action;
}

function takeNextAction() {
  const lesson = lessons[currentLesson];
  if (currentStage === 'understand') {
    const nextConcept = lesson.concepts.findIndex(function (_, index) { return !conceptVisited.has(index); });
    if (nextConcept >= 0) {
      selectConcept(nextConcept, true);
      $('[data-concept="' + nextConcept + '"]').scrollIntoView({behavior:'smooth', block:'nearest'});
    } else setStage('chain');
    return;
  }
  if (currentStage === 'chain') {
    const nextNode = lesson.chain.nodes.findIndex(function (_, index) { return !chainVisited.has(index); });
    if (nextNode >= 0) {
      selectChainNode(nextNode, true);
      $('[data-chain-node="' + nextNode + '"]').scrollIntoView({behavior:'smooth', block:'nearest'});
    } else setStage('lab');
    return;
  }
  if (currentStage === 'lab') {
    if (!labIsComplete()) {
      const nextStep = lesson.lab.steps.findIndex(function (_, index) { return !completedSteps.has(index); });
      const row = $('[data-command="' + nextStep + '"]');
      if (row) row.scrollIntoView({behavior:'smooth', block:'center'});
    } else setStage('verify');
    return;
  }
  if (!scenarioSolved) {
    $('.diagnostic-scenario').scrollIntoView({behavior:'smooth', block:'start'});
  } else if (!checksAreComplete()) {
    const nextCheck = lesson.checks.findIndex(function (_, index) { return !reviewedChecks.has(index); });
    $('[data-check="' + nextCheck + '"]').scrollIntoView({behavior:'smooth', block:'center'});
  } else if (!completed.has(currentLesson)) {
    $('#completeLesson').scrollIntoView({behavior:'smooth', block:'center'});
  } else {
    goToNextLesson();
  }
}

function renderLesson(name, options) {
  options = options || {};
  currentLesson = name;
  loadLessonState(name);
  const lesson = lessons[name];
  const index = lessonIndex(name);
  $('#lessonCode').textContent = lesson.code;
  $('#lessonCategory').textContent = lesson.category;
  $('#lessonTitle').textContent = lesson.title;
  $('#lessonIntro').textContent = lesson.intro;
  $('#lessonTime').textContent = lesson.time;
  $('#lessonLearn').textContent = lesson.route.learn;
  $('#lessonDo').textContent = lesson.route.do;
  $('#lessonAfter').textContent = lesson.route.after;
  $('#lessonPrerequisite').textContent = lesson.prerequisite;
  $('#knowledgeBefore').textContent = lesson.chain.before;
  $('#knowledgeCurrent').textContent = lesson.chain.current;
  $('#knowledgeNext').textContent = lesson.chain.next;
  $('#lessonGuideTitle').textContent = lesson.code + ' · ' + lesson.title;
  $('#lessonGuideReason').textContent = lesson.route.do;
  $('#labTitle').textContent = lesson.lab.title;
  $('#labIntro').textContent = lesson.lab.intro;
  $('#labSuccess').textContent = lesson.lab.success;
  $('#labRecovery').textContent = lesson.lab.recovery;
  $('#afterTitle').textContent = lesson.after.title;
  $('#afterText').textContent = lesson.after.text;
  $('#afterDeliverable').textContent = lesson.after.deliverable;
  $('#nextLessonName').textContent = lesson.next;
  $('#completeLesson').innerHTML = completed.has(name) ? '本节已完成 <i>✓</i>' : '确认完成本节 <i>→</i>';
  $('#module02Output').innerHTML = completedSteps.size
    ? '<i>RESTORED</i> 已读取本节保存的真实证据；视图仍从“先理解”开始。'
    : '<i>READY</i> 页面不会执行命令，请从第一步开始。';
  renderConcepts();
  renderChain();
  renderCommands();
  renderScenario();
  renderMasteryChecks();
  renderQuickCommands();
  updateCompletionGates();
  renderProgress();
  renderPrerequisiteReadiness();
  setStage('understand', {scroll:false, guardMessage:false});
  $('#previousLesson').disabled = false;
  $('#previousLesson').textContent = index === 0 ? '← MODULE 01' : '← PREVIOUS';
  $('#nextLesson').textContent = index === lessonOrder.length - 1 ? '进入 MODULE 03 →' : 'NEXT MISSION →';
  if (options.updateUrl !== false) history.replaceState(null, '', './module-02.html?lesson=' + encodeURIComponent(name));
  if (options.clearSearch !== false) {
    $('#module02Filter').value = '';
    filterLessons();
  }
  if (window.matchMedia('(max-width: 860px)').matches) {
    const lessonRail = $('.module02-lesson-list');
    const activeLesson = $('[data-lesson="' + name + '"]');
    const moduleRail = $('.course-module-links');
    const activeModule = $('.course-module-links .active');
    if (lessonRail && activeLesson) lessonRail.scrollLeft = Math.max(0, activeLesson.offsetLeft - (lessonRail.clientWidth - activeLesson.clientWidth) / 2);
    if (moduleRail && activeModule) moduleRail.scrollLeft = Math.max(0, activeModule.offsetLeft - (moduleRail.clientWidth - activeModule.clientWidth) / 2);
  }
  persist();
  if (options.scroll) {
    $('#module02Lesson').scrollIntoView({behavior:'smooth', block:'start'});
    $('#lessonTitle').setAttribute('tabindex', '-1');
    $('#lessonTitle').focus({preventScroll:true});
  }
}

function filterLessons() {
  const query = $('#module02Filter').value.trim().toLowerCase();
  let visible = 0;
  $$('[data-lesson]').forEach(function (button) {
    const match = !query || button.textContent.toLowerCase().includes(query);
    button.hidden = !match;
    if (match) visible += 1;
  });
  $('#module02FilterCount').textContent = visible + ' MISSION' + (visible === 1 ? '' : 'S') + ' VISIBLE';
  $('.module02-lesson-list').classList.toggle('no-results', visible === 0);
}

function completeCurrentLesson() {
  const lesson = lessons[currentLesson];
  if (completed.has(currentLesson)) {
    showToast('本节已经完成，可以进入下一任务');
    return;
  }
  if (!labIsComplete()) {
    showToast('请先收集并确认所有真实实验证据');
    setStage('lab');
    return;
  }
  if (!scenarioSolved) {
    showToast('请先完成现场诊断题');
    setStage('verify');
    return;
  }
  if (!checksAreComplete()) {
    showToast('请先回答并核对全部掌握问题');
    setStage('verify');
    return;
  }
  completed.add(currentLesson);
  persist();
  renderProgress();
  renderLearningGuard();
  updateCurrentAction();
  $('#completeLesson').innerHTML = '本节已完成 <i>✓</i>';
  showToast(lesson.code + ' 已完成，进度与证据已保存');
}

function goToNextLesson() {
  const index = lessonIndex(currentLesson);
  if (!completed.has(currentLesson)) {
    showToast('请先完成当前任务；左侧目录仍允许预览其他章节');
    takeNextAction();
    return;
  }
  if (index === lessonOrder.length - 1) {
    if (window.routeTo) window.routeTo('./module-03.html');
    else window.location.href = './module-03.html';
    return;
  }
  renderLesson(lessonOrder[index + 1], {scroll:true});
}

async function copyText(value, button) {
  let copied = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
      copied = true;
    }
  } catch (_) {}
  if (!copied) {
    const fallback = document.createElement('textarea');
    fallback.value = value;
    fallback.setAttribute('readonly', '');
    fallback.style.position = 'fixed';
    fallback.style.opacity = '0';
    document.body.appendChild(fallback);
    fallback.select();
    try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
    fallback.remove();
  }
  if (copied) {
    const original = button.innerHTML;
    button.textContent = '已复制';
    showToast('内容已复制；先确认终端职责，再粘贴执行');
    setTimeout(function () { button.innerHTML = original; }, 1400);
  } else {
    showToast('浏览器未允许复制，请手动选择文本');
  }
}

$$('[data-lesson]').forEach(function (button) {
  button.addEventListener('click', function () { renderLesson(button.dataset.lesson, {scroll:true}); });
});
$$('[data-stage]').forEach(function (button) {
  button.addEventListener('click', function () { setStage(button.dataset.stage); });
});
$('#lessonGuideAction').addEventListener('click', function () {
  setStage('understand', {scroll:false});
  $('#module02Lesson').scrollIntoView({behavior:'smooth', block:'start'});
});
$('#currentActionButton').addEventListener('click', takeNextAction);
$('#completeLesson').addEventListener('click', completeCurrentLesson);
$('#previousLesson').addEventListener('click', function () {
  const index = lessonIndex(currentLesson);
  if (index > 0) {
    renderLesson(lessonOrder[index - 1], {scroll:true});
    return;
  }
  const target = './module-01.html?mission=assessment';
  if (window.routeTo) window.routeTo(target);
  else window.location.href = target;
});
$('#nextLesson').addEventListener('click', goToNextLesson);
$('#module02Filter').addEventListener('input', filterLessons);
$('#module02Filter').addEventListener('keydown', function (event) {
  if (event.key !== 'Enter') return;
  const target = $$('[data-lesson]').find(function (button) { return !button.hidden; });
  if (target) renderLesson(target.dataset.lesson, {scroll:true});
});
window.addEventListener('pageshow', function (event) {
  if (event.persisted) window.location.reload();
});
window.addEventListener('storage', function (event) {
  if ([stateKey, 'axisEnvironmentProgress', 'axisModule01Foundations'].includes(event.key)) window.location.reload();
});

loadLessonState(currentLesson);
renderLesson(currentLesson, {scroll:false, clearSearch:false, updateUrl:Boolean(requestedLesson)});
