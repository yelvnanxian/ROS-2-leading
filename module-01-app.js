const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const missions = window.module01Missions;
const order = window.module01Order;
const extensions = window.missionExtensions;
const stateKey = 'axisModule01Foundations';
const stageOrder = ['concept', 'trace', 'lab', 'assessment'];
const modelKeys = ['package', 'node', 'dds', 'robot'];
const toast = $('#moduleToast');

let saved = {};
try { saved = JSON.parse(localStorage.getItem(stateKey) || '{}'); } catch (_) { saved = {}; }
saved.completed = Array.isArray(saved.completed) ? saved.completed : [];
saved.steps = saved.steps && typeof saved.steps === 'object' ? saved.steps : {};
saved.scenarios = saved.scenarios && typeof saved.scenarios === 'object' ? saved.scenarios : {};
saved.stages = saved.stages && typeof saved.stages === 'object' ? saved.stages : {};
saved.traces = saved.traces && typeof saved.traces === 'object' ? saved.traces : {};
const completed = new Set(saved.completed);
const requestedMission = new URLSearchParams(window.location.search).get('mission');
let currentMission = missions[requestedMission] ? requestedMission : missions[saved.currentMission] ? saved.currentMission : 'intro';
let currentStage = 'concept';
let completedSteps = new Set(saved.steps[currentMission] || []);
let scenarioSolved = Boolean(saved.scenarios[currentMission]);
let visitedTraceSteps = new Set(saved.traces[currentMission] || []);

function persist() {
  saved.completed = [...completed];
  saved.currentMission = currentMission;
  saved.steps[currentMission] = [...completedSteps];
  saved.scenarios[currentMission] = scenarioSolved;
  saved.stages[currentMission] = currentStage;
  saved.traces[currentMission] = [...visitedTraceSteps];
  try { localStorage.setItem(stateKey, JSON.stringify(saved)); } catch (_) {}
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.moduleToastTimer);
  window.moduleToastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function loadMissionState(name) {
  const mission = missions[name];
  if (completed.has(name)) {
    completedSteps = new Set(mission.steps.map((_, index) => index));
    scenarioSolved = true;
  } else {
    completedSteps = new Set(saved.steps[name] || []);
    scenarioSolved = Boolean(saved.scenarios[name]);
  }
  visitedTraceSteps = new Set(saved.traces[name] || []);
  if (completed.has(name) || completedSteps.size > 0 || scenarioSolved) {
    visitedTraceSteps = new Set(extensions[name].trace[2].map((_, index) => index));
  }
  // 每次进入小章节都回到“先理解”；终端证据、诊断结果与完成度仍然保留。
  currentStage = 'concept';
}

function renderModule00State() {
  let environment = {};
  try { environment = JSON.parse(localStorage.getItem('axisEnvironmentProgress') || '{}'); } catch (_) {}
  const ready = Array.isArray(environment.completed) && environment.completed.length >= 5;
  $('#module00State').textContent = ready ? '✓' : '○';
  $('#module00State').title = ready ? '环境部署已完成' : '环境部署尚未全部完成';
}

function missionCode(name) {
  return missions[name].code.replace(/^MISSION\s*/i, '');
}

function renderPhaseProgress() {
  $$('[data-phase-missions]').forEach(button => {
    const phaseMissions = button.dataset.phaseMissions.split(',');
    const finished = phaseMissions.filter(name => completed.has(name)).length;
    const nextMission = phaseMissions.find(name => !completed.has(name)) || phaseMissions[phaseMissions.length - 1];
    const phaseComplete = finished === phaseMissions.length;
    button.dataset.jumpMission = nextMission;
    button.classList.toggle('active', phaseMissions.includes(currentMission));
    button.classList.toggle('complete', phaseComplete);
    $('[data-phase-progress]', button).textContent = `${finished} / ${phaseMissions.length} 完成`;
    $('[data-phase-action]', button).textContent = phaseComplete ? '阶段完成 · 点击复习 ↗' : `继续 ${missionCode(nextMission)} →`;
    $('i', button).textContent = phaseComplete ? '✓' : String($$('[data-phase-missions]').indexOf(button) + 1).padStart(2, '0');
  });
}

function renderPhaseCoach(currentAction) {
  const currentIndex = order.indexOf(currentMission);
  const nextIncomplete = order.slice(currentIndex + 1).find(name => !completed.has(name));
  const allComplete = completed.size === order.length;
  const target = allComplete ? 'assessment' : completed.has(currentMission) && nextIncomplete ? nextIncomplete : currentMission;
  const targetMission = missions[target];
  const continuingCurrent = target === currentMission && !completed.has(currentMission);
  $('#phaseCoachTitle').textContent = allComplete
    ? '模块已完成 · 可回到 01.08 复盘'
    : `${continuingCurrent ? '继续' : '下一步'} ${missionCode(target)} · ${targetMission.title}`;
  $('#phaseCoachText').textContent = allComplete
    ? '你已经通过全部 8 个任务，可以复查综合验收证据，或返回首页查看全局进度。'
    : continuingCurrent
      ? currentAction
      : '当前任务已经完成，进入下一项未完成任务，继续按“理解 → 追踪 → 实验 → 验收”推进。';
  $('#phaseCoachAction').textContent = allComplete ? '复习综合验收 →' : continuingCurrent ? '执行当前下一步 →' : '进入下一任务 →';
  $('#phaseCoachAction').dataset.coachMission = target;
}

function renderProgress() {
  const percent = Math.round(completed.size / order.length * 100);
  $('#module01Percent').textContent = `${percent}%`;
  $('#module01Bar').style.width = `${percent}%`;
  $('#foundationPercent').textContent = `${percent}%`;
  $('.module-gauge').style.setProperty('--score', `${percent * 3.6}deg`);
  $$('[data-mission]').forEach((button, index) => {
    const name = button.dataset.mission;
    const isComplete = completed.has(name);
    button.classList.toggle('complete', isComplete);
    button.classList.toggle('active', name === currentMission);
    button.setAttribute('aria-current', name === currentMission ? 'page' : 'false');
    button.querySelector(':scope > i').textContent = isComplete ? '✓' : String(index + 1).padStart(2, '0');
  });
  renderMissionEvidence();
  renderPhaseProgress();
}

function renderMissionEvidence() {
  const mission = missions[currentMission];
  const missionIndex = order.indexOf(currentMission);
  const traceTotal = extensions[currentMission].trace[2].length;
  const missionDone = completed.has(currentMission);
  const conceptComplete = visitedTraceSteps.size > 0 || completedSteps.size > 0 || scenarioSolved || missionDone;
  const traceComplete = visitedTraceSteps.size >= traceTotal || completedSteps.size > 0 || missionDone;
  const labComplete = completedSteps.size >= mission.steps.length || missionDone;
  $('#statusMissionCode').textContent = `01.${String(missionIndex + 1).padStart(2, '0')}`;
  $('#statusMissionTitle').textContent = mission.title;
  const gates = [
    {element: $('#missionConceptGate'), stage: 'concept', complete: conceptComplete, meta: currentStage === 'concept' ? '当前入口 · 选择概念查看' : '已进入后续阶段'},
    {element: $('#missionTraceGate'), stage: 'trace', complete: traceComplete, meta: `${visitedTraceSteps.size} / ${traceTotal} 个数据节点`},
    {element: $('#missionLabGate'), stage: 'lab', complete: labComplete, meta: `${completedSteps.size} / ${mission.steps.length} 条终端证据`},
    {element: $('#missionAssessmentGate'), stage: 'assessment', complete: scenarioSolved || missionDone, meta: missionDone ? '任务已经完成' : scenarioSolved ? '诊断已经通过' : labComplete ? '可以进入诊断' : '等待终端证据'}
  ];
  gates.forEach(gate => {
    gate.element.classList.toggle('active', currentStage === gate.stage);
    gate.element.classList.toggle('complete', gate.complete);
    $('small', gate.element).textContent = gate.meta;
  });
}

function renderLearningGuard() {
  const mission = missions[currentMission];
  const traceTotal = extensions[currentMission].trace[2].length;
  const traceRemaining = traceTotal - visitedTraceSteps.size;
  const commandRemaining = mission.steps.length - completedSteps.size;
  const traceReady = traceRemaining === 0 || completedSteps.size > 0;
  const assessmentReady = commandRemaining === 0;

  $$('[data-lesson-stage]').forEach(button => {
    const stage = button.dataset.lessonStage;
    const locked = (stage === 'lab' && !traceReady) || (stage === 'assessment' && !assessmentReady);
    button.classList.toggle('locked', locked);
    button.setAttribute('aria-disabled', String(locked));
  });

  let title = '';
  let text = '';
  let state = '';
  if (currentStage === 'concept') {
    title = '先用白话建立系统地图，不需要背定义';
    text = '先用概念选择器看懂术语，再沿知识图谱确认系统位置。你的目标是能说清“谁产生数据、数据走哪里、谁使用数据”。';
    state = '理解阶段';
  } else if (currentStage === 'trace' && traceRemaining > 0) {
    title = `还要查看 ${traceRemaining} 个数据阶段`;
    text = '只点击当前可用的数据站点。看懂它做什么并确认已读，下一站才会解锁；四站看完才开放终端实验。';
    state = `${visitedTraceSteps.size} / ${traceTotal} 已查看`;
  } else if (currentStage === 'trace') {
    title = '数据路径已经看完，可以进入终端实验';
    text = '接下来只操作当前亮起的命令。输出不符合预期时停在原地排错，不要跳步。';
    state = '实验已开放';
  } else if (currentStage === 'lab' && commandRemaining > 0) {
    const nextIndex = mission.steps.findIndex((_, index) => !completedSteps.has(index));
    title = `当前只做第 ${nextIndex + 1} 步：${mission.steps[nextIndex].action}`;
    text = `执行位置是“${mission.steps[nextIndex].terminal}”。只有真实输出符合证据说明，才能确认并解锁下一步。`;
    state = `${completedSteps.size} / ${mission.steps.length} 已确认`;
  } else if (currentStage === 'lab') {
    title = '终端证据已齐，可以进入诊断验收';
    text = '下一阶段不是背答案，而是根据故障现象选择最先检查的证据。';
    state = '允许验收';
  } else {
    title = scenarioSolved ? '诊断已经通过，完成课后任务即可结束本节' : '先观察证据，再选择检查动作';
    text = scenarioSolved ? mission.after[1] : '不要直接修改系统。先选能最快缩小问题范围的检查项；答错可以继续尝试。';
    state = scenarioSolved ? '诊断通过' : '等待诊断';
  }
  $('#moduleGuardTitle').textContent = title;
  $('#moduleGuardText').textContent = text;
  $('#moduleGuardState').textContent = state;
  $('#moduleLearningGuard').classList.toggle('complete', commandRemaining === 0 && scenarioSolved);
  renderMissionEvidence();
}

function setStage(stage, options = {}) {
  if (!stageOrder.includes(stage)) return;
  const traceTotal = extensions[currentMission].trace[2].length;
  const traceReady = visitedTraceSteps.size >= traceTotal || completedSteps.size > 0;
  if (stage === 'lab' && !traceReady) {
    if (options.guardMessage !== false) showToast(`请先看完四个数据阶段，还差 ${traceTotal - visitedTraceSteps.size} 个`);
    stage = 'trace';
  }
  if (stage === 'assessment' && completedSteps.size < missions[currentMission].steps.length) {
    const remaining = missions[currentMission].steps.length - completedSteps.size;
    if (options.guardMessage !== false) showToast(`还差 ${remaining} 个终端步骤未确认，不能提前验收`);
    stage = traceReady ? 'lab' : 'trace';
  }
  if (stage === 'trace') {
    const nextTrace = extensions[currentMission].trace[2].findIndex((_, index) => !visitedTraceSteps.has(index));
    renderTrace(nextTrace < 0 ? 0 : nextTrace);
  }
  currentStage = stage;
  saved.stages[currentMission] = stage;
  $$('[data-lesson-stage]').forEach(button => {
    const active = button.dataset.lessonStage === stage;
    button.classList.toggle('active', active);
    button.setAttribute('aria-current', active ? 'step' : 'false');
  });
  $$('[data-lesson-stage-panel]').forEach(panel => {
    panel.hidden = panel.dataset.lessonStagePanel !== stage;
  });
  updateCommandLocks();
  renderLearningGuard();
  updateCurrentAction();
  persist();
  if (options.scroll !== false) $('.lesson-stage-nav').scrollIntoView({behavior: 'smooth', block: 'start'});
}

function selectFoundationConcept(index) {
  const mission = missions[currentMission];
  const extension = extensions[currentMission];
  const concept = mission.concepts[index];
  if (!concept) return;
  $$('[data-foundation-concept]').forEach((button, buttonIndex) => {
    const active = buttonIndex === index;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#foundationConceptLabel').textContent = `CONCEPT / ${String(index + 1).padStart(2, '0')}`;
  $('#foundationConceptTitle').textContent = concept[1];
  $('#foundationConceptDefinition').textContent = concept[2];
  $('#foundationConceptDetail').textContent = extension.details[index];
}

function renderFoundationConcepts(mission) {
  $('#foundationConcepts').innerHTML = mission.concepts.map((concept, index) => `<button type="button" data-foundation-concept="${index}"><i>${concept[0]}</i><span><b>${concept[1]}</b><small>${concept[2].split(/[。；]/)[0]}</small></span></button>`).join('');
  $$('[data-foundation-concept]').forEach((button, index) => button.addEventListener('click', () => selectFoundationConcept(index)));
  selectFoundationConcept(0);
}

function renderModel() {
  selectModel(modelKeys[0]);
}

function renderMissionKnowledgeMap(mission, extension) {
  $('#missionKnowledgeFlow').innerHTML = extension.model.map((item, index) => `<button type="button" data-knowledge-model="${modelKeys[index]}"><i>${String(index + 1).padStart(2, '0')}</i><span>${item[0]}</span><b>${item[1]}</b><small>${item[2]}</small></button>`).join('');
  const missionIndex = order.indexOf(currentMission);
  const previousMission = missionIndex > 0 ? missions[order[missionIndex - 1]] : null;
  $('#missionKnowledgeBefore').textContent = previousMission ? `${previousMission.code.replace('MISSION ', '')}：${previousMission.route[0]}` : '模块 00：已经能启动课程容器、Gazebo 与 Andino 仿真';
  $('#missionKnowledgeCurrent').textContent = mission.model[1];
  $('#missionKnowledgeNext').textContent = mission.next;
  $$('[data-knowledge-model]').forEach(button => button.addEventListener('click', () => selectModel(button.dataset.knowledgeModel)));
}

function selectModel(key) {
  const index = modelKeys.indexOf(key);
  const item = extensions[currentMission].model[index];
  $$('[data-knowledge-model]').forEach(button => {
    const active = button.dataset.knowledgeModel === key;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#modelDetailTitle').textContent = item[3];
  $('#modelDetailText').textContent = item[4];
}

function renderDeep(index = 0) {
  const item = extensions[currentMission].deep[index];
  $$('[data-deep-tab]').forEach((button, buttonIndex) => {
    const active = buttonIndex === index;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#deepDiveLabel').textContent = item[0];
  $('#deepDiveTitle').textContent = item[1];
  $('#deepDiveText').textContent = item[2];
  $('#deepDiveNoteTitle').textContent = item[3];
  $('#deepDiveNoteText').textContent = item[4];
}

function updateTraceLocks() {
  $$('[data-trace-step]').forEach((button, index) => {
    const previousVisited = [...Array(index).keys()].every(required => visitedTraceSteps.has(required));
    const available = index === 0 || previousVisited || visitedTraceSteps.has(index);
    button.disabled = !available;
    button.classList.toggle('locked', !available);
    button.setAttribute('aria-disabled', String(!available));
  });
}

function renderTrace(index = 0, options = {}) {
  const trace = extensions[currentMission].trace;
  const previousVisited = [...Array(index).keys()].every(required => visitedTraceSteps.has(required));
  if (options.mark && !previousVisited) {
    const nextTrace = trace[2].findIndex((_, stepIndex) => !visitedTraceSteps.has(stepIndex));
    showToast(`请先查看第 ${nextTrace + 1} 站，数据路径不能跳着学`);
    return;
  }
  const item = trace[2][index];
  if (options.mark) visitedTraceSteps.add(index);
  $('#traceTitle').textContent = trace[0];
  $('#traceIntro').textContent = `${trace[1]} 下方命令是观察点提示；只有对应节点或仿真已经启动时才执行，正式操作以“终端实验”为准。`;
  $$('[data-trace-step]').forEach((button, buttonIndex) => {
    const step = trace[2][buttonIndex];
    const active = buttonIndex === index;
    button.classList.toggle('active', active);
    button.classList.toggle('visited', visitedTraceSteps.has(buttonIndex));
    button.setAttribute('aria-pressed', String(active));
    $('b', button).textContent = step[0];
    $('small', button).textContent = step[1];
  });
  $('#traceStepLabel').textContent = `STAGE / ${String(index + 1).padStart(2, '0')}`;
  $('#traceStepTitle').textContent = item[2];
  $('#traceStepText').textContent = item[3];
  $('#traceStepCode').textContent = item[4];
  updateTraceLocks();
  if (options.mark) {
    persist();
    renderLearningGuard();
    updateCurrentAction();
  }
}

function renderScenario() {
  const scenario = extensions[currentMission].scenario;
  $('#scenarioTitle').textContent = scenario[0];
  $('#scenarioText').textContent = scenario[1];
  $('#scenarioSymptom').textContent = scenario[2];
  $('#scenarioOptions').innerHTML = scenario[3].map((option, index) => `<button data-scenario-option="${index}"><i>${String.fromCharCode(65 + index)}</i><span>${option}</span></button>`).join('');
  $('#scenarioFeedback').textContent = scenarioSolved ? '该诊断题已经通过。你仍可重新检查其他选项。' : '请选择最有效的第一项证据_';
  $('#scenarioFeedback').className = `scenario-feedback${scenarioSolved ? ' success' : ''}`;
  $$('[data-scenario-option]').forEach(button => button.addEventListener('click', () => answerScenario(Number(button.dataset.scenarioOption))));
}

function answerScenario(index) {
  const scenario = extensions[currentMission].scenario;
  const correct = index === scenario[4];
  $$('[data-scenario-option]').forEach(button => {
    button.classList.remove('correct', 'wrong');
    if (Number(button.dataset.scenarioOption) === index) button.classList.add(correct ? 'correct' : 'wrong');
  });
  $('#scenarioFeedback').textContent = correct ? scenario[5] : scenario[6];
  $('#scenarioFeedback').className = `scenario-feedback ${correct ? 'success' : 'error'}`;
  if (correct) {
    scenarioSolved = true;
    persist();
    updateCompletionGates();
    renderLearningGuard();
    updateCurrentAction();
  }
}

function updateCommandLocks() {
  $$('.foundation-command').forEach(row => {
    const index = Number(row.dataset.command);
    const done = completedSteps.has(index);
    const previousComplete = [...Array(index).keys()].every(required => completedSteps.has(required));
    const available = done || previousComplete;
    row.classList.toggle('locked', !available);
    row.classList.toggle('current', available && !done);
    row.setAttribute('aria-disabled', String(!available));
    const copyButton = $('.copy-command', row);
    const confirmButton = $('.confirm-command', row);
    const evidenceCheck = $('.evidence-ready', row);
    const evidenceReady = done || Boolean(evidenceCheck?.checked);
    if (copyButton) copyButton.disabled = !available;
    if (evidenceCheck) evidenceCheck.disabled = !available || done;
    if (confirmButton) {
      confirmButton.disabled = !available || done || !evidenceReady;
      confirmButton.textContent = done ? '已经确认' : evidenceReady ? '我看到了，确认' : '先勾选证据自检';
    }
  });
}

function renderSteps(mission) {
  $('#foundationCommands').innerHTML = mission.steps.map((step, index) => {
    const done = completedSteps.has(index);
    const copyButton = step.manual ? '' : `<button class="copy-command" data-copy-step="${index}">复制命令</button>`;
    const commandLabel = step.manual ? '在界面中完成' : '复制后粘贴到上述终端';
    const evidenceLabel = done ? '证据已核对' : step.manual ? '我已对照界面结果' : '我已对照真实输出';
    return `<article class="foundation-command${done ? ' complete' : ''}" data-command="${index}"><div class="command-terminal"><span>在哪里执行</span><b>${step.terminal}</b></div><div class="command-copy"><span class="command-action-label">这一步要做</span><b>${step.action}</b><span class="command-run-label">${commandLabel}</span><code>${step.command}</code><div class="expected-evidence"><span>看到这个再确认</span><p>${step.expected}</p></div><div class="command-stop"><b>没有看到？</b><span>先不要确认。检查终端、前置程序和命令输出，再重试当前步骤。</span></div></div><div class="command-actions"><label class="evidence-confirmation"><input class="evidence-ready" type="checkbox"${done ? ' checked disabled' : ''} /><span>${evidenceLabel}</span></label>${copyButton}<button class="confirm-command">${done ? '已经确认' : '先勾选证据自检'}</button></div></article>`;
  }).join('');
  $$('.copy-command').forEach(button => button.addEventListener('click', () => {
    const step = mission.steps[Number(button.dataset.copyStep)];
    copyText(step.command, button);
  }));
  $$('.evidence-ready').forEach(input => input.addEventListener('change', () => {
    updateCommandLocks();
    if (input.checked) showToast('证据自检已勾选；请再确认真实结果与说明一致');
  }));
  $$('.confirm-command').forEach(button => button.addEventListener('click', () => confirmStep(button.closest('.foundation-command'))));
  updateCommandLocks();
}

function confirmStep(row) {
  const index = Number(row.dataset.command);
  if (completedSteps.has(index)) return;
  const previousComplete = [...Array(index).keys()].every(required => completedSteps.has(required));
  if (!previousComplete) {
    showToast('请先完成上一项，避免跳过必要的终端状态');
    return;
  }
  completedSteps.add(index);
  row.classList.add('complete');
  const evidenceCheck = $('.evidence-ready', row);
  if (evidenceCheck) {
    evidenceCheck.checked = true;
    evidenceCheck.disabled = true;
    $('span', evidenceCheck.closest('label')).textContent = '证据已核对';
  }
  const step = missions[currentMission].steps[index];
  $('#foundationOutput').innerHTML = `<i>EVIDENCE ${String(index + 1).padStart(2, '0')}</i> ${step.expected}`;
  persist();
  updateCommandLocks();
  updateCompletionGates();
  renderLearningGuard();
  updateCurrentAction();
  if (completedSteps.size === missions[currentMission].steps.length) showToast('终端证据已齐，可以进入“诊断验收”');
}

function updateCompletionGates() {
  const total = missions[currentMission].steps.length;
  $('#cliGate').textContent = `终端证据 · ${completedSteps.size}/${total}`;
  $('#cliGate').classList.toggle('complete', completedSteps.size === total);
  $('#scenarioGate').textContent = scenarioSolved ? '诊断题 · 已通过' : '诊断题 · 待完成';
  $('#scenarioGate').classList.toggle('complete', scenarioSolved);
}

function updateCurrentAction() {
  const mission = missions[currentMission];
  const traceTotal = extensions[currentMission].trace[2].length;
  let action = '';
  if (currentStage === 'concept') action = '先选择一个核心概念，再沿知识图谱说清它在系统中的位置';
  else if (currentStage === 'trace') action = visitedTraceSteps.size < traceTotal ? `继续查看数据路径，还差 ${traceTotal - visitedTraceSteps.size} 站` : '四站已经看完，进入终端实验';
  else if (completedSteps.size < mission.steps.length) action = `当前只做：${mission.steps[completedSteps.size].action}`;
  else if (!scenarioSolved) action = '终端证据已齐，完成现场诊断题';
  else if (!completed.has(currentMission)) action = '所有条件已满足，标记本任务完成';
  else action = '本任务已完成，可以进入下一任务';
  $('#foundationNextAction').textContent = action;
  renderPhaseCoach(action);
}

function renderMission(name, options = {}) {
  currentMission = name;
  loadMissionState(name);
  const mission = missions[name];
  const extension = extensions[name];
  $('#missionGuideTitle').textContent = mission.guideTitle;
  $('#missionGuideWhy').textContent = mission.guideWhy;
  $('#foundationCode').textContent = mission.code;
  $('#foundationCategory').textContent = mission.category;
  $('#foundationTitle').textContent = mission.title;
  $('#foundationIntro').textContent = mission.intro;
  $('#foundationTime').textContent = mission.time;
  $('#routeLearn').textContent = mission.route[0];
  $('#routeDo').textContent = mission.route[1];
  $('#routeAfter').textContent = mission.route[2];
  $('#labTitle').textContent = mission.lab.title;
  $('#labIntro').textContent = mission.lab.intro;
  $('#labPrerequisite').textContent = mission.lab.prerequisite;
  $('#labSuccess').textContent = mission.lab.success;
  $('#labRecovery').textContent = mission.lab.recovery || '先保留完整错误，确认终端位置和前置程序；不要跳过当前步骤，也不要同时修改多个配置。';
  $('#foundationAfterTitle').textContent = mission.after[0];
  $('#foundationAfterText').textContent = mission.after[1];
  $('#nextFoundationName').textContent = mission.next;
  renderFoundationConcepts(mission);
  $('#foundationChecks').innerHTML = mission.checks.map(check => `<button class="foundation-check" aria-expanded="false"><span>${check[0]}</span><b>${check[1]}</b><em>先想一想，再查看答案</em><p>${check[2]}</p></button>`).join('');
  $('#foundationOutput').innerHTML = completedSteps.size ? '<i>已恢复</i> 已读取本任务的终端证据进度。' : '<i>准备开始</i> 页面不会执行命令，请从第一步开始。';
  $('#completeFoundation').innerHTML = completed.has(name) ? '本节已完成 <i>✓</i>' : '确认完成本节 <i>→</i>';
  $$('.foundation-check').forEach(button => button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    button.classList.toggle('revealed', !expanded);
  }));
  renderSteps(mission);
  renderMissionKnowledgeMap(mission, extension);
  renderModel();
  renderDeep();
  renderTrace();
  renderScenario();
  updateCompletionGates();
  renderProgress();
  setStage(currentStage, {scroll:false, guardMessage:false});
  persist();
  const index = order.indexOf(name);
  $('#previousFoundation').disabled = false;
  $('#previousFoundation').textContent = index === 0 ? '← MODULE 00' : '← PREVIOUS';
  $('#nextFoundation').textContent = index === order.length - 1 ? '进入 MODULE 02 →' : '下一任务 →';
  if (options.updateUrl !== false) history.replaceState(null, '', `./module-01.html?mission=${encodeURIComponent(name)}`);
  if (options.clearSearch !== false) {
    $('#missionFilterInput').value = '';
    filterMissions();
  }
  if (options.scroll) {
    $('#foundationMission').scrollIntoView({behavior:'smooth', block:'start'});
    $('#foundationTitle').setAttribute('tabindex', '-1');
    $('#foundationTitle').focus({preventScroll:true});
  }
  if (window.matchMedia('(max-width: 860px)').matches) {
    const missionRail = $('.foundation-list');
    const activeMission = $(`[data-mission="${name}"]`);
    const moduleRail = $('.course-module-links');
    const activeModule = $('.course-module-links .active');
    if (missionRail && activeMission) missionRail.scrollLeft = Math.max(0, activeMission.offsetLeft - (missionRail.clientWidth - activeMission.clientWidth) / 2);
    if (moduleRail && activeModule) moduleRail.scrollLeft = Math.max(0, activeModule.offsetLeft - (moduleRail.clientWidth - activeModule.clientWidth) / 2);
  }
}

async function copyText(value, button) {
  let copied = false;
  try {
    if (navigator.clipboard?.writeText) {
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
    showToast('命令已复制；请先确认终端位置，再粘贴执行');
    setTimeout(() => { button.innerHTML = original; }, 1400);
  } else {
    showToast('浏览器未允许复制，请手动选择命令文本');
  }
}

function filterMissions() {
  const query = $('#missionFilterInput').value.trim().toLowerCase();
  let visible = 0;
  $$('[data-mission]').forEach(button => {
    const match = !query || button.textContent.toLowerCase().includes(query);
    button.hidden = !match;
    if (match) visible += 1;
  });
  $('#missionFilterCount').textContent = `${visible} MISSION${visible === 1 ? '' : 'S'} VISIBLE`;
  $('.foundation-list').classList.toggle('no-results', visible === 0);
}

function takeNextAction() {
  const mission = missions[currentMission];
  if (currentStage === 'concept') setStage('trace');
  else if (currentStage === 'trace') setStage('lab');
  else if (completedSteps.size < mission.steps.length) setStage('lab');
  else setStage('assessment');
}

$$('[data-mission]').forEach(button => button.addEventListener('click', () => renderMission(button.dataset.mission, {scroll:true})));
$$('[data-jump-mission]').forEach(button => button.addEventListener('click', () => renderMission(button.dataset.jumpMission, {scroll:true})));
$$('[data-lesson-stage]').forEach(button => button.addEventListener('click', () => setStage(button.dataset.lessonStage)));
$$('[data-deep-tab]').forEach((button, index) => button.addEventListener('click', () => renderDeep(index)));
$$('[data-trace-step]').forEach((button, index) => button.addEventListener('click', () => renderTrace(index, {mark:true})));
$$('[data-copy-command]').forEach(button => button.addEventListener('click', () => copyText(button.dataset.copyCommand, button)));
$('#missionFilterInput').addEventListener('input', filterMissions);
$('#missionFilterInput').addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  const firstVisible = $$('[data-mission]').find(button => !button.hidden);
  if (firstVisible) renderMission(firstVisible.dataset.mission, {scroll:true});
});
$('#missionJump').addEventListener('click', () => {
  setStage('concept', {scroll:false});
  $('#foundationMission').scrollIntoView({behavior:'smooth', block:'start'});
});
$('#foundationStatusJump').addEventListener('click', takeNextAction);
$('#phaseCoachAction').addEventListener('click', event => {
  const target = event.currentTarget.dataset.coachMission;
  if (target === currentMission && !completed.has(currentMission)) takeNextAction();
  else renderMission(target, {scroll:true});
});
$('#completeFoundation').addEventListener('click', () => {
  const mission = missions[currentMission];
  if (completed.has(currentMission)) {
    showToast('该任务已经完成，可以进入下一任务');
    return;
  }
  if (completedSteps.size < mission.steps.length) {
    showToast('请先在真实终端收集并确认所有证据');
    setStage('lab');
    return;
  }
  if (!scenarioSolved) {
    showToast('请先完成现场诊断题');
    setStage('assessment');
    return;
  }
  completed.add(currentMission);
  persist();
  renderProgress();
  updateCurrentAction();
  $('#completeFoundation').innerHTML = '本节已完成 <i>✓</i>';
  showToast(`${mission.code} 已完成 · 进度已保存`);
});
$('#previousFoundation').addEventListener('click', () => {
  const index = order.indexOf(currentMission);
  if (index > 0) {
    renderMission(order[index - 1], {scroll:true});
    return;
  }
  const target = './module-00.html?task=validation';
  if (window.routeTo) window.routeTo(target);
  else window.location.href = target;
});
$('#nextFoundation').addEventListener('click', () => {
  const index = order.indexOf(currentMission);
  if (!completed.has(currentMission)) {
    showToast('请先完成当前任务；也可以使用左侧目录预览其他章节');
    takeNextAction();
    return;
  }
  if (index === order.length - 1) {
    if (window.routeTo) window.routeTo('./module-02.html');
    else window.location.href = './module-02.html';
    return;
  }
  renderMission(order[index + 1], {scroll:true});
});

window.addEventListener('pageshow', event => {
  if (event.persisted) window.location.reload();
});
window.addEventListener('storage', event => {
  if (event.key === stateKey || event.key === 'axisEnvironmentProgress') window.location.reload();
});

renderModule00State();
renderMission(currentMission, {scroll:false, clearSearch:false});
