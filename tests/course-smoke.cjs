const { chromium } = require('playwright');

const baseURL = process.env.COURSE_URL || 'http://127.0.0.1:4173';
const module00Tasks = ['requirements', 'docker', 'workspace', 'simulation', 'validation'];
const module01Missions = ['intro', 'nodes', 'topics', 'control', 'rviz', 'transforms', 'services', 'assessment'];
const module02Lessons = ['slam_model', 'mapping_launch', 'mapping_drive', 'map_save', 'localization', 'nav2_stack', 'recovery', 'field_assessment'];
const module03Lessons = ['package_model', 'creator_preflight', 'package_anatomy', 'python_node', 'build_overlay', 'run_inspect', 'field_delivery'];
const module04Lessons = ['odometry_model', 'joint_states', 'differential_kinematics', 'pose_integration', 'odometry_message', 'quaternion_frames', 'path_validation', 'odometry_delivery'];

function assert(value, message) {
  if (!value) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({
    headless:true,
    executablePath:process.env.CHROMIUM_PATH || undefined
  });
  const context = await browser.newContext({viewport:{width:1440, height:900}});
  const page = await context.newPage();
  const errors = [];
  const brokenResponses = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', error => errors.push(`page: ${error.message}`));
  page.on('response', response => {
    if (response.url().startsWith(baseURL) && response.status() >= 400) {
      brokenResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(`${baseURL}/index.html`, {waitUntil:'networkidle'});
  assert(await page.locator('.home-module-card').count() === 5, '首页应显示 5 个已开放模块');
  const moduleEntrances = await page.locator('.home-module-card a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')));
  for (const code of ['00', '01', '02', '03', '04']) {
    assert(moduleEntrances.some(href => href === `./modules/${code}/index.html`), `首页缺少 Module ${code} 的目录化入口`);
  }
  assert(await page.locator('#chapter-module-03').count() === 1, '首页应显示 Module 03 章节索引');
  assert(await page.locator('#chapter-module-04').count() === 1, '首页应显示 Module 04 章节索引');
  await page.screenshot({path:'/tmp/axis-home-five-modules.png', fullPage:true});
  await page.locator('[data-chapter-toggle="03"]').click();
  assert(await page.locator('#chapter-panel-03 .chapter-link').count() === 7, 'Module 03 应有 7 个小节直达入口');
  await page.locator('[data-chapter-toggle="04"]').click();
  assert(await page.locator('#chapter-panel-04 .chapter-link').count() === 8, 'Module 04 应有 8 个小节直达入口');

  const existingModules = [
    {file:'modules/00/index.html', param:'task', keys:module00Tasks, item:'data-task', stage:'[data-env-stage="learn"].active'},
    {file:'modules/01/index.html', param:'mission', keys:module01Missions, item:'data-mission', stage:'[data-lesson-stage="concept"].active'},
    {file:'modules/02/index.html', param:'lesson', keys:module02Lessons, item:'data-lesson', stage:'[data-stage="understand"].active'}
  ];
  for (const module of existingModules) {
    for (const key of module.keys) {
      await page.goto(`${baseURL}/${module.file}?${module.param}=${key}`, {waitUntil:'networkidle'});
      assert(await page.locator(`[${module.item}="${key}"].active`).count() === 1, `${module.file} ${key} 激活项错误`);
      assert(await page.locator(module.stage).count() === 1, `${module.file} ${key} 没有回到先理解`);
      const pageText = await page.locator('body').innerText();
      assert(!pageText.includes('undefined'), `${module.file} ${key} 出现 undefined`);
    }
  }

  await page.goto(`${baseURL}/legacy/01-04/index.html`, {waitUntil:'networkidle'});
  await page.waitForURL(/modules\/01\/index\.html\?mission=control/);
  assert(await page.locator('[data-mission="control"].active').count() === 1, '01.04 档案页未转入正式课程对应小节');
  await page.goto(`${baseURL}/legacy/01-05/index.html`, {waitUntil:'networkidle'});
  await page.waitForURL(/modules\/01\/index\.html\?mission=rviz/);
  assert(await page.locator('[data-mission="rviz"].active').count() === 1, '01.05 档案页未转入正式课程对应小节');

  for (const lesson of module03Lessons) {
    await page.goto(`${baseURL}/modules/03/index.html?lesson=${lesson}`, {waitUntil:'networkidle'});
    assert(await page.locator(`[data-lesson="${lesson}"].active`).count() === 1, `03 ${lesson} 左侧激活项错误`);
    assert(await page.locator('[data-stage="understand"].active').count() === 1, `03 ${lesson} 没有回到先理解`);
    assert(await page.locator('[data-stage-panel="understand"]:visible').count() === 1, `03 ${lesson} 初始内容未显示`);
    const pageText = await page.locator('body').innerText();
    assert(!pageText.includes('undefined'), `03 ${lesson} 出现 undefined`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    assert(!overflow, `03 ${lesson} 桌面端横向溢出`);
  }

  for (const lesson of module04Lessons) {
    await page.goto(`${baseURL}/modules/04/index.html?lesson=${lesson}`, {waitUntil:'networkidle'});
    assert(await page.locator(`[data-lesson="${lesson}"].active`).count() === 1, `04 ${lesson} 左侧激活项错误`);
    assert(await page.locator('[data-stage="understand"].active').count() === 1, `04 ${lesson} 没有回到先理解`);
    assert(await page.locator('[data-stage-panel="understand"]:visible').count() === 1, `04 ${lesson} 初始内容未显示`);
    const pageText = await page.locator('body').innerText();
    assert(!pageText.includes('undefined'), `04 ${lesson} 出现 undefined`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    assert(!overflow, `04 ${lesson} 桌面端横向溢出`);
  }

  await page.goto(`${baseURL}/modules/04/index.html?lesson=odometry_message`, {waitUntil:'networkidle'});
  const dependencySnippet = page.locator('.module02-command code').filter({hasText:'<depend>nav_msgs</depend>'});
  assert(await dependencySnippet.count() === 1, 'Module 04 的 XML 依赖代码被当成 HTML 吞掉');
  assert(await dependencySnippet.first().innerText().then(text => text.includes('<depend>geometry_msgs</depend>')), '多行 XML 代码没有完整保留换行内容');
  assert(await page.locator('.copy-command').filter({hasText:'复制依赖声明'}).count() >= 1, 'Module 04 没有生成代码片段专用复制标签');

  await page.goto(`${baseURL}/modules/03/index.html?lesson=package_model`, {waitUntil:'networkidle'});
  await page.screenshot({path:'/tmp/axis-module03-desktop.png', fullPage:false});
  for (let index = 0; index < 3; index += 1) await page.locator(`[data-concept="${index}"]`).click();
  await page.locator('[data-stage="chain"]').click();
  for (let index = 0; index < 4; index += 1) await page.locator(`[data-chain-node="${index}"]`).click();
  assert(await page.locator('[data-stage="lab"]').getAttribute('aria-disabled') === 'false', '系统链完成后应解锁实验');
  await page.locator('[data-stage="lab"]').click();
  assert(await page.locator('.module02-command.current').count() === 1, '真实实验应只高亮当前一步');

  await page.goto(`${baseURL}/modules/00/index.html?task=requirements`, {waitUntil:'networkidle'});
  assert(await page.locator('.course-rail-nav a').count() === 6, 'Module 00 全局导航应包含 HOME 与 00–04');
  await page.locator('[data-task="docker"]').click();
  assert(page.url().includes('task=docker'), 'Module 00 选择任务后 URL 未同步');
  assert(await page.locator('[data-env-stage="learn"].active').count() === 1, 'Module 00 新任务没有回到先理解');

  await page.goto(`${baseURL}/modules/01/index.html?mission=intro`, {waitUntil:'networkidle'});
  assert(await page.locator('.course-rail-nav a').count() === 6, 'Module 01 全局导航应包含 HOME 与 00–04');
  await page.locator('[data-mission="nodes"]').click();
  assert(page.url().includes('mission=nodes'), 'Module 01 选择任务后 URL 未同步');
  assert(await page.locator('[data-lesson-stage="concept"].active').count() === 1, 'Module 01 新任务没有回到先理解');

  await page.goto(`${baseURL}/modules/03/index.html?lesson=package_model`, {waitUntil:'networkidle'});
  await page.locator('#previousLesson').click();
  await page.waitForURL(/modules\/02\/index\.html\?lesson=field_assessment/);
  assert(await page.locator('[data-stage="understand"].active').count() === 1, '跨模块返回后没有回到先理解');
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('axisModule02Navigation') || '{}');
    state.completed = Array.from(new Set([...(state.completed || []), 'field_assessment']));
    localStorage.setItem('axisModule02Navigation', JSON.stringify(state));
  });
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#nextLesson').click();
  await page.waitForURL(/modules\/03\/index\.html/);
  assert(await page.locator('[data-lesson="package_model"].active').count() === 1, 'Module 02 末尾没有进入 Module 03 起点');

  await page.goto(`${baseURL}/modules/03/index.html?lesson=field_delivery`, {waitUntil:'networkidle'});
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('axisModule03Packages') || '{}');
    state.completed = Array.from(new Set([...(state.completed || []), 'field_delivery']));
    localStorage.setItem('axisModule03Packages', JSON.stringify(state));
  });
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#nextLesson').click();
  await page.waitForURL(/modules\/04\/index\.html/);
  assert(await page.locator('[data-lesson="odometry_model"].active').count() === 1, 'Module 03 末尾没有进入 Module 04 起点');
  assert(await page.locator('[data-stage="understand"].active').count() === 1, '进入 Module 04 后没有回到先理解');
  await page.locator('#previousLesson').click();
  await page.waitForURL(/modules\/03\/index\.html\?lesson=field_delivery/);
  assert(await page.locator('[data-lesson="field_delivery"].active').count() === 1, 'Module 04 第一节返回未到 Module 03 末节');

  await page.goto(`${baseURL}/modules/02/index.html?lesson=mapping_launch`, {waitUntil:'networkidle'});
  for (let index = 0; index < 3; index += 1) await page.locator(`[data-concept="${index}"]`).click();
  await page.locator('[data-stage="chain"]').click();
  for (const width of [1440, 1180, 861, 620, 390]) {
    await page.setViewportSize({width, height:900});
    const overlap = await page.locator('[data-chain-node="0"]').evaluate(button => {
      const title = button.querySelector('span');
      const role = button.querySelector('em');
      const a = title.getBoundingClientRect();
      const b = role.getBoundingClientRect();
      return !(a.bottom <= b.top + 1 || b.bottom <= a.top + 1);
    });
    assert(!overlap, `Module 02 系统链在 ${width}px 仍发生重叠`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    assert(!overflow, `Module 02 在 ${width}px 横向溢出`);
  }
  await page.setViewportSize({width:1440, height:900});
  await page.screenshot({path:'/tmp/axis-module02-chain-fixed.png', fullPage:false});

  const firstVisit = await browser.newContext({viewport:{width:1280, height:800}});
  const firstVisitPage = await firstVisit.newPage();
  await firstVisitPage.goto(`${baseURL}/modules/04/index.html?lesson=path_validation`, {waitUntil:'networkidle'});
  await firstVisitPage.waitForURL(`${baseURL}/index.html`);
  assert(firstVisitPage.url() === `${baseURL}/index.html`, '网站新会话直接访问小节时应先回到课程首页');
  await firstVisit.close();

  const mobile = await browser.newContext({viewport:{width:390, height:844}});
  const mobilePage = await mobile.newPage();
  const mobileErrors = [];
  mobilePage.on('console', message => { if (message.type() === 'error') mobileErrors.push(`console: ${message.text()}`); });
  mobilePage.on('pageerror', error => mobileErrors.push(`page: ${error.message}`));
  await mobilePage.goto(`${baseURL}/index.html`, {waitUntil:'networkidle'});
  const homeMobileOverflow = await mobilePage.evaluate(() => ({scroll:document.documentElement.scrollWidth, client:document.documentElement.clientWidth}));
  assert(homeMobileOverflow.scroll <= homeMobileOverflow.client + 1, `首页在 390px 横向溢出: ${JSON.stringify(homeMobileOverflow)}`);
  await mobilePage.goto(`${baseURL}/modules/03/index.html?lesson=creator_preflight`, {waitUntil:'networkidle'});
  const mobileOverflow = await mobilePage.evaluate(() => ({scroll:document.documentElement.scrollWidth, client:document.documentElement.clientWidth}));
  assert(mobileOverflow.scroll <= mobileOverflow.client + 1, `390px 横向溢出: ${JSON.stringify(mobileOverflow)}`);
  assert(await mobilePage.locator('[data-stage="understand"].active').count() === 1, '移动端没有回到先理解');
  await mobilePage.screenshot({path:'/tmp/axis-module03-mobile.png', fullPage:true});
  await mobilePage.goto(`${baseURL}/modules/04/index.html?lesson=path_validation`, {waitUntil:'networkidle'});
  const module04MobileOverflow = await mobilePage.evaluate(() => ({scroll:document.documentElement.scrollWidth, client:document.documentElement.clientWidth}));
  assert(module04MobileOverflow.scroll <= module04MobileOverflow.client + 1, `Module 04 在 390px 横向溢出: ${JSON.stringify(module04MobileOverflow)}`);
  assert(await mobilePage.locator('[data-stage="understand"].active').count() === 1, 'Module 04 移动端没有回到先理解');
  await mobilePage.screenshot({path:'/tmp/axis-module04-mobile.png', fullPage:true});
  for (const target of [
    'modules/00/index.html?task=validation',
    'modules/01/index.html?mission=assessment',
    'modules/02/index.html?lesson=field_assessment'
  ]) {
    await mobilePage.goto(`${baseURL}/${target}`, {waitUntil:'networkidle'});
    const size = await mobilePage.evaluate(() => ({scroll:document.documentElement.scrollWidth, client:document.documentElement.clientWidth}));
    assert(size.scroll <= size.client + 1, `${target} 在 390px 横向溢出: ${JSON.stringify(size)}`);
  }

  assert(errors.length === 0, errors.join('\n'));
  assert(brokenResponses.length === 0, `存在加载失败的站内资源:\n${brokenResponses.join('\n')}`);
  assert(mobileErrors.length === 0, mobileErrors.join('\n'));
  await mobile.close();
  await context.close();
  await browser.close();
  console.log('COURSE_SMOKE_OK');
})().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
