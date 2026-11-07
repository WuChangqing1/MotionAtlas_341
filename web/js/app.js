(() => {
  'use strict';
  const RAW = Array.isArray(window.MOTION_ATLAS_DATA) ? window.MOTION_ATLAS_DATA : [];
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s || '').normalize('NFKC').toLowerCase().replace(/[\s·\-_/]+/g, '');
  const seriesConfig = [['ALL','全部风格','▦'],['AG','代码样片','⌘'],['M','动态风格','〰'],['K','卡通画风','◉'],['Z','中国风','✿'],['H','版式设计','▤'],['L','Lemo-Opuscar','◇'],['V','MG 动效','✦'],['X','创意代码','⌗'],['R','参考型风格','◈'],['O','电影视觉','◐']];
  const roleOptions = [['main','主视觉风格'],['motion','动态语言'],['effect','辅助特效'],['typography','排版/配色'],['scene','特定场景'],['aux','辅助参考']];
  const roleLabels = Object.fromEntries(roleOptions);
  const phaseTips = {
    card: '只输出任务卡、分镜、时间轴和制作方案；不安装依赖、不生成媒体。',
    still: '只生成被指定的静帧/风格样片；先做视觉确认，不擅自渲染成片。',
    audition: '先做四套有差异的声音方案，供作者试听选择；不把未选音乐定稿。',
    final: '仅在明确授权下制作完整成片；先完成方案和依赖检查。'
  };
  const phaseOutputs = {
    card: '任务卡 Markdown、分镜表、风格取舍说明、待确认项',
    still: '指定静帧 PNG、对应源码/参数、静帧检查记录',
    audition: '四套音乐/声音方案、试听文件或明确的本机生成限制、音效表',
    final: '可运行源码、可复现渲染流程、成片 MP4/静帧、完整 QA 记录'
  };
  const defaultTask = {
    title:'', theme:'', content:'', audience:'', core:'', facts:'', extra:'',
    duration:15, ratio:'16:9', resolution:'1920x1080', fps:30, language:'中文',
    music:'四案音乐，先试听', sfx:'按镜头设计音效', narration:'不需要旁白',
    characters:'不需要', styleMode:'主风格 + 辅助特效', output:'HTML + Canvas 可运行工程 + 静帧/视频',
    prohibited:'', phase:'card', packageMode:'light'
  };
  const prefKey = 'motion_atlas_341_workbench_v2';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(prefKey) || '{}') || {}; } catch (_) {}
  let selected = [...new Set((saved.selected || []).filter(id => RAW.some(x => x.id === id)))];
  let favorites = [...new Set((saved.favorites || []).filter(id => RAW.some(x => x.id === id)))];
  let styleRoles = (saved.styleRoles && typeof saved.styleRoles === 'object') ? saved.styleRoles : {};
  let task = Object.assign({}, defaultTask, saved.task || {});
  const lookup = new Map();
  const DATA = RAW.map(x => {
    const md = String(x.markdown || '');
    const titleLine = md.match(/^#\s+\S+\s+(.+)$/m);
    const paren = titleLine ? titleLine[1].match(/[（(]([^）)]+)[）)]/) : null;
    const english = paren && /[A-Za-z]/.test(paren[1]) ? paren[1].trim() : '';
    const missingPrompt = Boolean(x.missingPrompt) || md.trim().length < 50;
    const row = { ...x, markdown: md, english, missingPrompt };
    row._index = norm([row.id,row.title,row.english,row.seriesName,row.groupName,row.category,row.description,row.fit,row.keywords,row.markdown].join(' '));
    lookup.set(row.id, row);
    return row;
  });
  // Preserve archive order shown in the original library; D1/C1/A1 are intentional.
  const state = { series:'ALL', special:'', query:'', onlyImage:false, sort:'default', limit:36, view:saved.view === 'list' ? 'list' : 'grid', drawerId:null };
  const taskFields = ['title','theme','content','audience','core','facts','extra','duration','ratio','resolution','fps','language','music','sfx','narration','characters','styleMode','output','prohibited','phase','packageMode'];
  const taskIds = { title:'taskTitleInput', theme:'taskTheme', content:'taskContent', audience:'taskAudience', core:'taskCore', facts:'taskFacts', extra:'taskExtra', duration:'taskDuration', ratio:'taskRatio', resolution:'taskResolution', fps:'taskFps', language:'taskLanguage', music:'taskMusic', sfx:'taskSfx', narration:'taskNarration', characters:'taskCharacters', styleMode:'taskStyleMode', output:'taskOutput', prohibited:'taskProhibited', phase:'taskPhase', packageMode:'taskPackageMode' };
  let toastTimer = null;
  function notify(msg) { const t=$('toast'); if(!t) return; t.textContent=msg; t.classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('visible'),3000); }
  function store() {
    try { localStorage.setItem(prefKey, JSON.stringify({ selected, favorites, styleRoles, task, view:state.view })); } catch (_) {}
  }
  function defaultRole(x) {
    if (!x) return 'aux';
    if (x.series === 'H') return 'typography';
    if (['M','V','X'].includes(x.series)) return 'motion';
    if (x.series === 'R') return 'scene';
    if (x.id === 'B3' || x.id === 'B6') return 'effect';
    return 'main';
  }
  function roleOf(id) { return roleLabels[styleRoles[id]] ? styleRoles[id] : defaultRole(lookup.get(id)); }
  function roleName(id) { return roleLabels[roleOf(id)] || '辅助参考'; }
  function mainStyles() { return selected.filter(id => roleOf(id) === 'main'); }
  function applyTask() {
    for (const key of taskFields) {
      const el = $(taskIds[key]); if (!el) continue;
      el.value = task[key] ?? defaultTask[key];
    }
    const phase = task.phase || 'card';
    if ($('phaseHint')) $('phaseHint').textContent = phaseTips[phase] || '';
  }
  function readTask() {
    for (const key of taskFields) {
      const el = $(taskIds[key]); if (!el) continue;
      let v = el.value;
      if (key === 'duration') v = Number(v) || 0;
      if (key === 'fps') v = Number(v) || 0;
      task[key] = v;
    }
    return task;
  }
  function seriesCount(id) { return DATA.filter(x => id === 'ALL' || x.series === id).length; }
  function media(x, large = false) {
    const tag = large ? 'drawer-preview' : 'card-image';
    if (!x.image) return `<div class="${tag} placeholder" data-series="${esc(x.series)}"><span class="placeholder-monogram">${esc(x.series === 'AG' ? 'AG' : x.series)}</span><span class="no-still">暂无参考图</span></div>`;
    return `<div class="${tag}"><img loading="lazy" src="${esc(x.image)}" alt="${esc(x.id + ' ' + x.title + ' 参考静帧')}" onerror="this.hidden=true;this.parentElement.classList.add('broken-img')"><span class="card-tag">${esc(x.groupName || x.seriesName)}</span></div>`;
  }
  function menuMarkup() {
    $('categoryNav').innerHTML = seriesConfig.map(([id,title,icon]) => `<button class="nav-item ${id === 'ALL' ? 'active' : ''}" data-series="${id}"><span class="nav-icon">${icon}</span>${esc(title)}<span class="nav-number">${seriesCount(id)}</span></button>`).join('');
    $('sidebarCount').textContent = DATA.length;
  }
  function syncNav() {
    document.querySelectorAll('.nav-item[data-series]').forEach(n => n.classList.toggle('active', !state.special && n.dataset.series === state.series));
    document.querySelectorAll('[data-special]').forEach(n => n.classList.toggle('active', state.special === n.dataset.special));
    $('favoriteCount').textContent = favorites.length;
    $('selectedCountSide').textContent = selected.length;
    $('selectedCountBar').textContent = selected.length;
    $('taskSelectedCount').textContent = `${selected.length} 种`;
    $('selectionBar').hidden = selected.length === 0;
    $('selectedAvatars').innerHTML = selected.slice(0,4).map(id => `<i>${esc(id)}</i>`).join('') + (selected.length > 4 ? `<i>+${selected.length-4}</i>` : '');
  }
  function score(item, terms) {
    let s = 0;
    for (const raw of terms) {
      const t = norm(raw);
      if (norm(item.id) === t) s += 800;
      else if (norm(item.id).startsWith(t)) s += 180;
      if (norm(item.title).includes(t)) s += 110;
      if (norm(item.english).includes(t)) s += 100;
      if (norm(item.keywords).includes(t)) s += 45;
      if (norm(item.description).includes(t)) s += 25;
      if (norm(item.markdown).includes(t)) s += 8;
    }
    return s;
  }
  function matches() {
    const terms = state.query.trim().split(/\s+/).filter(Boolean);
    const list = DATA.filter(x => {
      if (state.special === 'favorites' && !favorites.includes(x.id)) return false;
      if (state.special === 'selected' && !selected.includes(x.id)) return false;
      if (!state.special && state.series !== 'ALL' && x.series !== state.series) return false;
      if (state.onlyImage && !x.image) return false;
      return terms.every(t => x._index.includes(norm(t)));
    });
    if (terms.length && state.sort === 'default') list.sort((a,b) => score(b,terms) - score(a,terms) || a.id.localeCompare(b.id));
    else if (state.sort === 'name') list.sort((a,b) => a.title.localeCompare(b.title,'zh-CN') || a.id.localeCompare(b.id));
    else if (state.sort === 'image') list.sort((a,b) => Number(Boolean(b.image)) - Number(Boolean(a.image)) || a.id.localeCompare(b.id));
    return list;
  }
  function card(x) {
    const picked = selected.includes(x.id), faved = favorites.includes(x.id);
    return `<article class="style-card" data-id="${esc(x.id)}">${media(x).replace('</div>',`<button class="fav-btn ${faved?'on':''}" data-action="favorite" title="${faved?'取消收藏':'收藏风格'}" aria-label="收藏 ${esc(x.title)}">${faved?'★':'☆'}</button></div>`)}
      <div class="card-body"><div class="card-name-row"><span class="card-id">${esc(x.id)}</span><h4 class="card-name">${esc(x.title)}</h4></div>${x.english?`<div class="card-english">${esc(x.english)}</div>`:''}<p class="card-description">${esc(x.description || x.previewText || x.groupName || '')}</p><div class="card-actions"><button class="card-more" data-action="open">查看完整原文 →</button><button class="card-select ${picked?'selected':''}" data-action="select">${picked?'✓ 已选':'＋ 选择'}</button></div></div></article>`;
  }
  function render() {
    const items = matches(), visible = items.slice(0, state.limit);
    const title = state.special === 'favorites' ? '我的收藏' : state.special === 'selected' ? '已选风格' : state.series === 'ALL' ? '全部风格' : (seriesConfig.find(x => x[0] === state.series)?.[1] || '全部风格');
    $('resultsHeading').textContent = title;
    $('resultsCount').textContent = `${items.length} 个结果`;
    $('cards').className = 'cards-grid' + (state.view === 'list' ? ' list-layout' : '');
    $('cards').innerHTML = visible.map(card).join('');
    $('loadMoreWrap').hidden = visible.length >= items.length;
    $('moreCount').textContent = items.length - visible.length;
    $('emptyResults').hidden = items.length !== 0;
    $('gridView').classList.toggle('active', state.view === 'grid');
    $('listView').classList.toggle('active', state.view === 'list');
    syncNav();
  }
  function setSeries(id) { state.series=id; state.special=''; state.query=''; $('searchInput').value=''; state.limit=36; render(); hideMobile(); $('explore').scrollIntoView({behavior:'smooth',block:'start'}); }
  function setSpecial(s) { state.special=s; state.series='ALL'; state.query=''; $('searchInput').value=''; state.limit=36; render(); hideMobile(); $('explore').scrollIntoView({behavior:'smooth',block:'start'}); }
  function reset() { state.series='ALL'; state.special=''; state.query=''; state.onlyImage=false; state.sort='default'; state.limit=36; $('searchInput').value=''; $('withImage').checked=false; $('sortSelect').value='default'; render(); }
  function toggleId(which,id) {
    const arr = which === 'favorite' ? favorites : selected;
    const had = arr.includes(id);
    if (!had && which === 'select' && lookup.get(id)?.missingPrompt) {
      if (!confirm(`${id} 的原始 Markdown 不完整。\n\n仍要把它加入任务吗？加入后 Prompt 会明确标记“待补充”，不会伪造原文。`)) return;
    }
    if (had) arr.splice(arr.indexOf(id),1); else arr.push(id);
    if (which === 'select' && !had) styleRoles[id] = roleOf(id);
    if (which === 'select' && had) delete styleRoles[id];
    store(); render(); if (state.drawerId) renderInspector(state.drawerId); if (!$('taskModal').hidden) renderTask();
    notify(which === 'favorite' ? (had?'已取消收藏':'已收藏') : (had?'已从任务移除':'已加入任务'));
  }
  function renderInspector(id) {
    const x = lookup.get(id); if (!x) return;
    state.drawerId = id;
    const picked = selected.includes(id), faved = favorites.includes(id);
    $('inspectorBody').innerHTML = `${media(x,true).replace('</div>',`<button class="drawer-zoom" data-drawer-action="zoom" aria-label="查看原图">查看原图 ↗</button></div>`)}
      <div class="drawer-meta">${esc(x.seriesName)} <span>/ ${esc(x.id)}</span></div>
      <h2 id="inspectorTitle" class="drawer-title">${esc(x.title)}</h2>
      ${x.english?`<p class="drawer-english">${esc(x.english)}</p>`:''}
      <p class="drawer-desc">${esc(x.description || x.previewText || '该条没有单独简介，请以原始 Markdown 为准。')}</p>
      <div class="drawer-buttons"><button class="primary-btn" data-drawer-action="select">${picked?'✓ 已加入任务':'＋ 选择这个风格'}</button><button class="ghost-btn" data-drawer-action="favorite">${faved?'★ 已收藏':'☆ 收藏'}</button><button class="ghost-btn" data-drawer-action="create">加入并配置任务 ↗</button></div>
      ${x.missingPrompt?'<div class="note-badge warning-inline">原始 Markdown 不完整：不要伪造内容；选择时需确认按已有简述制作或先补充原文。</div>':''}
      <dl class="drawer-kv"><dt>风格系列</dt><dd>${esc(x.seriesName)}</dd><dt>分类</dt><dd>${esc(x.category||x.groupName||'未标注')}</dd><dt>推荐场景</dt><dd>${esc(x.fit||'以完整风格说明为准')}</dd><dt>关键词</dt><dd>${esc(x.keywords||'未单独标注')}</dd><dt>原文路径</dt><dd>${esc(x.path)}</dd><dt>文件 SHA256</dt><dd class="sha-cell" title="${esc(x.sha256)}">${esc(x.sha256)}</dd><dt>许可 / 来源</dt><dd>风格库原始条目；许可与来源见 LICENSES；参考出处以原文末尾为准。</dd></dl>
      <div class="prompt-head"><b>原始完整 Markdown</b><button data-drawer-action="copy">复制全部原文 ↗</button></div>
      <pre class="prompt-source" id="rawPrompt"></pre>
      <p class="task-small">本页显示资料中的真实原文。参考图仅用于风格判断；没有参考图时会明确标注，不生成替代图。</p>`;
    $('rawPrompt').textContent = x.markdown || '（原始 Markdown 为空。本条目不完整，不能伪造内容。）';
  }
  function openInspector(id) { if(!lookup.has(id)) return; renderInspector(id); $('overlay').hidden=false; $('inspector').hidden=false; document.body.style.overflow='hidden'; const url=new URL(location.href); url.searchParams.set('style',id); history.replaceState(null,'',url); $('closeInspector').focus(); }
  function closeInspector() { state.drawerId=null; $('inspector').hidden=true; if($('taskModal').hidden) $('overlay').hidden=true; document.body.style.overflow=''; const url=new URL(location.href); url.searchParams.delete('style'); history.replaceState(null,'',url); }
  function styleRows() {
    if (!selected.length) return '<p class="task-small">还没有选择风格。返回风格库添加至少一种，或让 DSH 根据内容安排。</p>';
    return selected.map(id => {
      const x = lookup.get(id); if (!x) return '';
      const role = roleOf(id);
      return `<div class="task-style-row task-style-rich"><span class="task-style-id">${esc(id)}</span><span class="task-style-name" title="${esc(x.title)}">${esc(x.title)}${x.missingPrompt?' <em class="tiny-warning">不完整</em>':''}</span><select class="task-role-select" data-task-role="${esc(id)}" aria-label="${esc(id)} 的角色">${roleOptions.map(([v,l])=>`<option value="${v}" ${role===v?'selected':''}>${l}</option>`).join('')}</select><button data-task-remove="${esc(id)}" aria-label="移除 ${esc(id)}">×</button></div>`;
    }).join('');
  }
  function missingItems(t) {
    const m=[];
    if(!t.title.trim()) m.push('作品名称');
    if(!t.theme.trim()) m.push('动画主题');
    if(!t.content.trim()) m.push('完整文案/故事');
    if(!t.audience.trim()) m.push('目标观众');
    if(!t.core.trim()) m.push('核心意思');
    if(!selected.length) m.push('至少一种风格');
    if(selected.length && !mainStyles().length) m.push('至少一个主视觉角色');
    return m;
  }
  function warnings(t) {
    const w=[];
    if(t.styleMode === '全片统一' && mainStyles().length > 1) w.push(`全片统一模式选择了 ${mainStyles().length} 个主视觉风格，可能冲突；请保留一个主风格或改成分镜/主+辅助。`);
    if(selected.some(id => lookup.get(id)?.missingPrompt)) w.push('选中包含原始 Markdown 不完整的条目；Prompt 会标记待补充，不会伪造原文。');
    if(selected.length && !mainStyles().length) w.push('当前没有主视觉角色；建议指定一个。');
    if(t.phase === 'final' && !t.content.trim()) w.push('final 阶段缺少完整文案；不允许直接开始成片制作。');
    return w;
  }
  function summaryMarkup(t) {
    const missing = missingItems(t), warn = warnings(t);
    const main = mainStyles().map(id=>`${id} ${lookup.get(id)?.title||''}`).join('、') || '未指定';
    const aux = selected.filter(id=>roleOf(id)!=='main').map(id=>`${id} ${roleName(id)}`).join('、') || '无';
    return `<div class="summary-head"><b>任务摘要</b><span>${selected.length} 风格 · ${esc(t.phase)}</span></div>
      <dl class="summary-kv"><dt>作品</dt><dd>${esc(t.title||'未命名')}</dd><dt>主视觉</dt><dd>${esc(main)}</dd><dt>辅助</dt><dd>${esc(aux)}</dd><dt>规格</dt><dd>${esc(t.duration)}s · ${esc(t.ratio)} · ${esc(t.resolution)} · ${esc(t.fps)}fps</dd><dt>声音</dt><dd>${esc(t.music)} / ${esc(t.sfx)} / ${esc(t.narration)}</dd><dt>阶段</dt><dd><b>${esc(t.phase)}</b></dd><dt>预计交付</dt><dd>${esc(phaseOutputs[t.phase]||'')}</dd></dl>
      <div class="summary-warnings">${warn.length?warn.map(x=>`<p>⚠ ${esc(x)}</p>`).join(''):'<p class="ok-line">✓ 当前配置没有阻断性冲突</p>'}</div>
      <div class="summary-missing">${missing.length?`<b>待补充：</b>${missing.map(esc).join('、')}`:'<span class="ok-line">✓ 关键信息已填写</span>'}</div>`;
  }
  function renderTask() {
    readTask();
    applyTask();
    $('phaseHint').textContent = phaseTips[task.phase] || '';
    $('taskStyleList').innerHTML = styleRows();
    $('taskSummary').innerHTML = summaryMarkup(task);
    $('taskPromptPreview').textContent = taskText();
    const missing = missingItems(task);
    $('taskStatus').textContent = missing.length ? `待补充：${missing.join('、')}` : `${selected.length} 个风格 · ${task.phase} 阶段 · 可导出`;
    $('taskHeaderState').textContent = '草稿自动保存在本机浏览器';
  }
  function openTask() { if(!$('inspector').hidden) closeInspector(); $('overlay').hidden=false; $('taskModal').hidden=false; document.body.style.overflow='hidden'; renderTask(); $('taskTitleInput').focus(); }
  function closeTask() { $('taskModal').hidden=true; $('overlay').hidden=true; document.body.style.overflow=''; }
  function pathForStyle(x) { return `style-library/${x.path}`; }
  function selectedStyleLines() {
    return selected.map((id,i) => {
      const x=lookup.get(id); if(!x) return `${i+1}. ${id}`;
      return `${i+1}. [${roleName(id)}] ${x.id} ${x.title}${x.english?` / ${x.english}`:''}\n   原文：${pathForStyle(x)}\n   SHA256：${x.sha256}${x.missingPrompt?'\n   状态：原始 Markdown 不完整（待补充，不得伪造）':''}`;
    }).join('\n');
  }
  function taskText() {
    const t = readTask();
    const content = t.content.trim() || '【缺失：请补充完整文案/故事。】';
    const main = mainStyles().length ? mainStyles().map(id=>`${id} ${lookup.get(id)?.title||''}`).join('、') : '【未指定主视觉，需由 DSH 或作者决定】';
    const missing = missingItems(t);
    const warn = warnings(t);
    const pkg = t.packageMode === 'full' ? '完整离线包' : '轻量任务包';
    return `/fy-code-animation

# Motion Atlas 341 · DeepSeek Harness 动画制作任务

## 0. 本次任务性质与授权
这是 Motion Atlas 341 工作台导出的一份正式制作任务，不是网页演示。请按 \`fy-code-animation\` 的实际工作流执行，不要只在文字上声称“已加载 Skill”。
- 制作阶段：**${t.phase}**（${phaseTips[t.phase]||''}）
- 阶段边界：严格只做该阶段允许的事；final 需要作者明确授权。不要自动部署、上传、联网购买或生成付费第三方 API 请求。
- 交付形式：${phaseOutputs[t.phase]||''}

## 1. Skill 实际加载（必须核验）
1. 通过当前 DSH 的可用 Skill 机制加载 \`fy-code-animation\`；项目级入口是：
   \`<项目根>/.dsh/skills/fy-code-animation/SKILL.md\`
2. 斜杠 \`/fy-code-animation\` 只是入口提示；如果当前 DSH 版本不能直接斜杠触发，必须使用其 skill 工具/手动方式读取 SKILL.md，并在回复中说明实际采用了哪种方式。
3. 不能仅凭模型文字“我已加载”判定成功；必须实际读取 SKILL.md，并在制作记录中列出读取到的模块和关键阶段规则。
4. 按 SKILL.md 的模块路由至少读取并遵循：
   - \`modules/decisions.md\`（默认约定、已决定、声音/字体/阶段取舍）
   - \`modules/workflow.md\`（card/still/audition/final）
   - \`modules/meaning.md\`（语义与观众认识变化）
   - \`modules/style.md\`（风格选择与组合）
   - \`modules/engineering.md\`（实现契约与确定性）
   - \`modules/qa.md\`（机器检查、观看、作者采用分开记录）
   按内容再加载叙事、字体、镜头、背景、音乐、实现等配方；不要跳过语义直接套风格。

## 2. 341 风格库定位与自检
风格库根：\`./style-library\`（必须含 \`风格提示词/\`）。
若当前工作目录不在项目根，先定位用户明确提供的 MotionAtlas_341 根目录；不得全盘搜索、不得臆造路径。
~~~
powershell
python .dsh/skills/fy-code-animation/scripts/style_library.py build --root ./style-library
python .dsh/skills/fy-code-animation/scripts/doctor.py --root ./style-library
python .dsh/skills/fy-code-animation/scripts/style_library.py get --root ./style-library --query ${selected[0]||'B3'}
~~~
- 先确认 Python、路径、Skill 安装状态和命令支持。
- 若 doctor 不通过，不得假称已读取风格；列出缺项并停止进入制作，先修复环境。
- 任务包是“${pkg}”模式：轻量包依赖本地完整库；完整包内含 \`style-library/风格提示词/\` 与 Skill 文件，可直接按包内路径执行。

## 3. 选定风格（用真实原文，不得只看摘要）
${selectedStyleLines()||'【本任务未选择具体风格；由 DSH 根据内容提出候选并等待作者确认】'}

主视觉：${main}
组合方式：**${t.styleMode}**
${t.styleMode === '主风格 + 辅助特效' ? '- 主视觉负责材料、色彩、构图和整体气质；动态语言/辅助特效只能在主风格上叠加，不得反客为主。' : ''}
${t.styleMode === '全片统一' ? '- 全片使用同一套主视觉语法；辅助风格只能补充局部层次，不能改变主视觉材料与构图。' : ''}
${t.styleMode === '分镜使用不同风格' ? '- 必须给每个场景/分镜明确指定风格 ID 与角色；场景之间写清接缝、转场与视觉连续性。' : ''}
${t.styleMode === '由 DSH 根据内容安排' ? '- 根据内容语义给出 2–3 套可行组合，先说明取舍，再等待作者确认；不能擅自把多套完整 Prompt 硬拼。' : ''}
${warn.length?`\n**冲突与缺项提醒（必须处理或向作者确认）：**\n${warn.map(x=>'- '+x).join('\n')}`:''}
${missing.length?`\n**缺失必要信息：** ${missing.join('、')}。请先补齐；不能把缺失内容编造成事实。`:''}

## 4. 完整制作需求
- 作品名称：${t.title || '【未命名】'}
- 动画主题：${t.theme || '【未填写】'}
- 目标观众：${t.audience || '【未填写】'}
- 希望表达的核心意思：${t.core || '【未填写】'}
- 关键事实/必须出现：${t.facts || '【未提供】'}
- 完整文案/故事：
${content}
- 时长：${t.duration} 秒
- 画幅：${t.ratio}
- 分辨率：${t.resolution}
- 帧率：${t.fps} fps
- 字幕语言：${t.language}
- 背景音乐：${t.music}
- 音效：${t.sfx}
- 旁白：${t.narration}
- 人物角色：${t.characters}
- 输出格式：${t.output}
- 特别要求：${t.extra || '无额外要求'}
- 禁止事项：${t.prohibited || '不自动部署、不上传未授权内容、不虚构事实与完成状态。'}

## 5. 风格角色与冲突处理
风格角色不是装饰性标签：主视觉决定材料/色调/构图；动态语言决定运动语法；辅助特效只能在主视觉上叠加；排版/配色负责字与信息层级；场景风格只用于明确场景。
- 先读取每个选中 ID 的完整 Markdown，记录其依赖、技术限制、许可与不可用项。
- 不把多个完整 Prompt 直接拼接。遇到互斥（写实 vs 手绘、极简 vs 高密度、固定机位 vs 一镜到底）时，保留作者选择并说明冲突，提出一个可控的折中方案；不得擅自删除用户选择。
- 对不完整条目：要求作者补充原文或明确同意“按简述尝试”，并在交付中标注风险；不得伪造风格内容。

## 6. 执行流程（按阶段）
1. 语义阅读：提炼主旨、观众理解变化、事实与比喻、因果/对比/递进；写一段你的理解和建议。
2. 风格取舍：打开每个原始 Markdown，记录 SHA/依赖/缺项；给出主视觉与辅助的角色安排。
3. 分镜/任务卡：按 \`templates/task-card.md\` 和 \`modules/workflow.md\` 输出；明确每镜的时间、画面、动作、文字、镜头、转场、声音需求。
4. 按授权阶段执行：
   - **card**：只交任务卡与分镜，不安装依赖、不生成媒体。
   - **still**：只做指定静帧/样片，输出真实 PNG 与参数。
   - **audition**：做四套差异化声音方案并说明本机生成能力；未选择前不得把音乐定稿。
   - **final**：先确认方案、依赖、声音选择与作者授权；再实现可复现的 HTML/Canvas 或 Remotion 工程；真实渲染，不虚构成片。
5. 每个阶段分开记录：机器检查、实际观看/聆听、作者采用；未发生的不要写成已通过。

## 7. 验收与回归
- 语义：核心意思能否被观众看懂；是否有逐句贴 PPT 的倾向。
- 风格：材料、构图、运动语法是否真的取自原始 Markdown，而不是只借名称/配色。
- 确定性：任意时间点可 seek 重现；固定随机种子；不依赖 Date.now/无种子随机。
- 画面：无文字碰撞、裁切、过曝或粒子遮挡关键信息；关键帧实际检查。
- 声音：四案差异、授权、混音与口播让位；未实际生成就明确说明。
- 工程：真实命令、真实文件、真实退出码；不伪造测试结果。
- 回归：至少核对所有已通过场景与冻结/慢推等关键时间窗；没有回归才进入下一阶段。

## 8. 完工汇报（必须）
按以下顺序报告，缺一不可：
1. 实际读取的 Skill 文件和模块；
2. 读取的每条风格原文路径与 SHA256；
3. 生成的源码/素材/静帧/视频文件清单；
4. 运行命令、测试命令与真实结果；
5. 机器检查 vs 人工观看 vs 作者采用的区分；
6. 未完成项、依赖缺项与风险；
7. 若为 final，提供最终成片路径和可复现步骤；若未授权，明确未制作。
`;
  }
  function runWithDsh(t, pkg) {
    return `# 在 Windows 11 上用 DeepSeek Harness 运行此任务

> 这是本地交付说明。网页不会、也不能通过公网执行任何 DSH/SSH/Shell 命令。

## 1. 解压
在 Windows PowerShell 中：
\`\`\`powershell
Expand-Archive -LiteralPath .\\MotionAtlas-Task-${t.title ? 'TASK' : 'TASK'}.zip -DestinationPath . -Force
cd .\\MotionAtlas-Task-*
\`\`\`
（下载文件名以实际 ZIP 为准。）

## 2. 确认 Skill
- **轻量包**：任务包需要放在已安装完整 Skill 与 341 风格库的 MotionAtlas_341 工作区；确认：
  \`\`\`powershell
  Test-Path .\\.dsh\\skills\\fy-code-animation\\SKILL.md
  Test-Path .\\style-library\\风格提示词
  \`\`\`
- **完整包**：包内 \`skill/fy-code-animation/\` 是完整 Skill；把它复制到你的工作区：
  \`\`\`powershell
  New-Item -ItemType Directory -Force .\\.dsh\\skills | Out-Null
  Copy-Item -Recurse -Force .\\skill\\fy-code-animation .\\.dsh\\skills\\
  \`\`\`
  并把包内 \`style-library/\` 作为风格库根。

## 3. 构建与自检
\`\`\`powershell
python .\\.dsh\\skills\\fy-code-animation\\scripts\\style_library.py build --root .\\style-library
python .\\.dsh\\skills\\fy-code-animation\\scripts\\doctor.py --root .\\style-library
python .\\.dsh\\skills\\fy-code-animation\\scripts\\style_library.py get --root .\\style-library --query ${selected[0]||'B3'}
\`\`\`
doctor 不通过时不要开始制作；按提示修复 Python、路径或库。

## 4. 在 DSH 中加载 Skill
- 在 DSH 中调用 skill 工具加载 \`fy-code-animation\`，或直接让 DSH 读取：
  \`C:\\...\\MotionAtlas_341\\.dsh\\skills\\fy-code-animation\\SKILL.md\`
- \`/fy-code-animation\` 只是入口；如果当前 DSH 不支持斜杠，使用 skill 工具或手动加载。不要只输入斜杠就假定已加载。

## 5. 把 Prompt 交给 DSH
打开 \`PROMPT_FOR_DSH.md\`，整段粘贴到 DSH；或在 DSH 当前会话中执行：
\`\`\`text
请读取 PROMPT_FOR_DSH.md 并严格按其中 Skill 加载、风格库自检和阶段授权执行。
\`\`\`
本任务默认阶段：**${t.phase}**。不要擅自升级到 final。

## 6. 检查结果
- card：任务卡/分镜表；是否明确语义、风格角色、时间轴与待确认项。
- still：真实 PNG；尺寸、SHA、是否只做指定静帧。
- audition：四套差异方案/试听文件；是否说明本机限制。
- final：源码、可复现命令、MP4；是否有真实测试和人工观看记录。

## 7. 常见故障
- \`style_library.py\` 找不到：检查 Skill 是否完整，尤其 \`scripts/\`、\`modules/\`、\`templates/\`。
- doctor 失败：检查 \`--root\` 是否指向含 \`风格提示词/\` 的库根。
- 中文乱码：使用 Windows Terminal/PowerShell UTF-8；不要用旧版 cmd 重定向。
- 不能调用 Skill：按 \`skill/SKILL_USAGE.md\` 手动读取 SKILL.md，报告实际使用的加载方式。
- 风格原文为空：回到风格库补充；不要伪造。`;
  }
  function skillUsage() {
    return `# fy-code-animation 调用说明

## 项目级位置
- \`.dsh/skills/fy-code-animation/SKILL.md\`
- 完整技能包括 \`modules/\`、\`recipes/\`、\`templates/\`、\`adapters/\`、\`scripts/\`、\`implementations/\`。

## DSH 加载
1. 优先使用 DSH 的 Skill 机制加载 \`fy-code-animation\`。
2. \`/fy-code-animation\` 只是入口提示；当前 DSH 若不支持斜杠触发，必须使用 skill 工具或手动读取 SKILL.md。
3. 确认实际读到了 SKILL.md；仅在文字里声称调用不算。

## 手动兜底
让 DSH 读取项目内 \`.dsh/skills/fy-code-animation/SKILL.md\`，并按其模块路由继续读取 \`modules/workflow.md\`、\`modules/decisions.md\`、\`modules/meaning.md\`、\`modules/style.md\`、\`modules/engineering.md\`、\`modules/qa.md\`。

## 阶段权限
- card：只写任务卡/分镜，不生成媒体。
- still：只做指定静帧。
- audition：只做四案试听，不擅自定稿。
- final：必须明确授权；完成方案、依赖、声音选择后再渲染。

## 如何判断真的调用
- DSH 回复中列出实际读取的 SKILL.md/modules 文件；
- 使用 style_library.py 实际 build/doctor/get，并给出真实结果；
- 在任务卡中引用选中风格原文的 SHA 与依赖；
- 未通过 doctor 时停止，而非继续声称完成。`;
  }
  function installation() {
    return `# 安装与工作区准备

## A. 已在 MotionAtlas_341 工程内
直接使用项目内：
- \`.dsh/skills/fy-code-animation/\`
- \`style-library/\`
无需重新安装。先运行 build/doctor。

## B. 在其他工作目录/电脑
### 轻量包
需要把本任务包放入已有完整 Skill 和风格库的 MotionAtlas_341 工作区；否则先安装完整 Skill 与原始风格库。

### 完整离线包
1. 解压；
2. 将 \`skill/fy-code-animation/\` 复制到目标项目 \`.dsh/skills/\`；
3. 将包内 \`style-library/\` 作为风格库根；
4. 运行：
\`\`\`powershell
python .\\.dsh\\skills\\fy-code-animation\\scripts\\style_library.py build --root .\\style-library
python .\\.dsh\\skills\\fy-code-animation\\scripts\\doctor.py --root .\\style-library
\`\`\`
5. doctor 通过后才交给 DSH。

## 缺依赖
不要在缺少 Skill/风格库时假装可用。按 doctor 输出安装/修复，或只保留 card 阶段的设计讨论。`;
  }
  function licensesNote(styles) {
    return `# 许可与来源

本任务包保留 Motion Atlas 341 风格库与 fy-code-animation 的原始许可/来源说明。

- 风格库原始许可：见 \`LICENSES/style-library-license.md\`
- Skill 许可：见 \`LICENSES/skill-LICENSE.md\`
- 第三方来源：见 \`LICENSES/third-party/\`
- 原始风格参考出处：见各 \`styles/selected/<ID>.md\` 末尾的参考出处

约定：免费使用与分享；不得包装成付费课程、付费 skill 或收费资料出售。参考图仅用于风格判断；第三方材料仍受其原始许可约束。
选中风格：${styles.join('、')}`;
  }
  async function sha256Bytes(bytes) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2,'0')).join('');
  }
  function textBytes(s) { return new TextEncoder().encode(s); }
  function fileExt(path) { const m = String(path).match(/\.([a-z0-9]+)$/i); return m ? m[1].toLowerCase() : 'jpg'; }
  async function fetchBytes(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
    return new Uint8Array(await r.arrayBuffer());
  }
  async function fetchText(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`${path} HTTP ${r.status}`);
    return await r.text();
  }
  async function fetchLicenseFiles() {
    const files = [
      ['LICENSES/style-library-license.md','assets/licenses/style-library-license.md'],
      ['LICENSES/skill-LICENSE.md','assets/licenses/skill-LICENSE.md'],
      ['LICENSES/third-party/code-video_LICENSE.txt','assets/licenses/code-video_LICENSE.txt'],
      ['LICENSES/third-party/Lemo-Opuscar_LICENSE.txt','assets/licenses/Lemo-Opuscar_LICENSE.txt'],
      ['LICENSES/third-party/mg-styles-15_LICENSE.txt','assets/licenses/mg-styles-15_LICENSE.txt']
    ];
    const out=[];
    for (const [dest,src] of files) {
      try { out.push({name:dest,data:await fetchBytes(src)}); } catch (_) { out.push({name:dest,data:textBytes(`缺少本地许可文件：${src}。请回到 Motion Atlas 341 原始库核对。`)}); }
    }
    return out;
  }
  async function buildTaskPackage() {
    const t = readTask();
    if (!selected.length) throw new Error('请先选择至少一种风格');
    if (!t.title.trim() || !t.theme.trim() || !t.content.trim()) throw new Error('请填写作品名称、动画主题和完整文案');
    if (!window.MotionAtlasZip) throw new Error('ZIP 模块未加载');
    const taskId = `MA341-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
    const prompt = taskText();
    const entries = [];
    const addText = (name,data) => entries.push({name,data:textBytes(data)});
    const addBytes = (name,data) => entries.push({name,data});
    const full = t.packageMode === 'full';
    addText('PROMPT_FOR_DSH.md',prompt);
    addText('RUN_WITH_DSH.md',runWithDsh(t,full?'full':'light'));
    addText('README.md',`# MotionAtlas-Task-${taskId}\n\n《${t.title}》\n\n- 阶段：${t.phase}\n- 模式：${full?'完整离线包':'轻量任务包'}\n- 风格：${selected.join('、')}\n- 时长：${t.duration}s / ${t.ratio} / ${t.fps}fps\n- 生成：${new Date().toISOString()}\n\n先读 \`RUN_WITH_DSH.md\`，再把 \`PROMPT_FOR_DSH.md\` 交给本地 DeepSeek Harness。公网网页不会执行任何本地命令。`);
    addText('skill/SKILL_USAGE.md',skillUsage());
    addText('skill/INSTALLATION.md',installation());
    addText('LICENSES/README.md',licensesNote(selected));
    for (const f of await fetchLicenseFiles()) addBytes(f.name,f.data);
    const styleMeta = selected.map(id => {
      const x=lookup.get(id);
      return {id,title:x.title,english:x.english||'',role:roleOf(id),role_label:roleName(id),path:x.path,sha256:x.sha256,missing_prompt:x.missingPrompt};
    });
    addText('selected-styles.json',JSON.stringify(styleMeta,null,2));
    const taskJson = {
      task_id:taskId,title:t.title,brief:t.theme,audience:t.audience,script:t.content,core_meaning:t.core,facts:t.facts,
      selected_styles:selected,style_roles:Object.fromEntries(selected.map(id=>[id,roleOf(id)])),
      style_source_sha256:Object.fromEntries(selected.map(id=>[id,lookup.get(id)?.sha256||''])),
      duration_seconds:Number(t.duration),aspect_ratio:t.ratio,fps:Number(t.fps),resolution:t.resolution,
      audio_mode:{music:t.music,sfx:t.sfx,narration:t.narration},characters:t.characters,
      phase:t.phase,style_mode:t.styleMode,constraints:t.extra,prohibited:t.prohibited,output_format:t.output,
      required_outputs:phaseOutputs[t.phase],package_mode:full?'full':'light',created_at:new Date().toISOString()
    };
    addText('task.json',JSON.stringify(taskJson,null,2));
    for (const id of selected) {
      const x=lookup.get(id); if(!x) continue;
      addText(`styles/selected/${id}.md`,x.markdown || `# ${id} ${x.title}\n\n> 原始 Markdown 不完整。请先补充；本包不伪造内容。\n`);
      if (x.image) {
        try { addBytes(`references/${id}.${fileExt(x.image)}`,await fetchBytes(x.image)); } catch (_) {}
      }
    }
    if (full) {
      try {
        const bundle = JSON.parse(await fetchText('assets/skill-bundle.json'));
        for (const f of bundle.files || []) {
          if (typeof f.path === 'string' && typeof f.text === 'string') addText(`skill/fy-code-animation/${f.path}`,f.text);
        }
      } catch (_) { addText('skill/SKILL_BUNDLE_MISSING.txt','完整 Skill bundle 未加载；本包不能声称完整离线。请回到工作中台重新导出。'); }
      for (const x of DATA) {
        addText(`style-library/${x.path}`,x.markdown || `# ${x.id}\n\n> 原始 Markdown 不完整。\n`);
      }
    }
    const fileList = [];
    for (const e of entries) {
      const b = e.data instanceof Uint8Array ? e.data : textBytes(e.data);
      fileList.push({path:e.name,bytes:b.length,sha256:await sha256Bytes(b)});
    }
    const manifest = {
      task_id:taskId,project:'MA341-DEMO-001',export_version:'workbench-v1',package_mode:full?'full':'light',
      created_at:new Date().toISOString(),selected_styles:styleMeta,files:fileList,
      skill:{included:full,source:'.dsh/skills/fy-code-animation'},
      library:{included:full?'341 markdown included':'selected styles only',root:'./style-library'},
      complete:true
    };
    addText('manifest.json',JSON.stringify(manifest,null,2));
    const zip = window.MotionAtlasZip.createZip(entries);
    return {zip,taskId,taskJson,fileList};
  }
  function downloadBlob(name,blob) { const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1500); }
  function downloadText(name,text,mime='text/markdown;charset=utf-8') { downloadBlob(name,new Blob([text],{type:mime})); }
  async function copyText(text) { try { if(navigator.clipboard && isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (_) {} const f=document.createElement('textarea'); f.value=text; f.style.cssText='position:fixed;left:-9999px'; document.body.append(f); f.select(); let ok=false; try{ok=document.execCommand('copy')}catch(_){} f.remove(); return ok; }
  function hideMobile() { $('sidebar').classList.remove('open'); if($('taskModal').hidden && $('inspector').hidden) $('overlay').hidden=true; }
  function bindTaskInputs() {
    for (const key of taskFields) {
      const el=$(taskIds[key]); if(!el) continue;
      const evt = (el.tagName==='SELECT' || key==='duration' || key==='fps') ? 'change' : 'input';
      el.addEventListener(evt,()=>{ readTask(); store(); if(!$('taskModal').hidden) renderTask(); });
    }
  }
  function boot() {
    menuMarkup(); applyTask(); bindTaskInputs(); render();
    $('categoryNav').addEventListener('click',e=>{const n=e.target.closest('[data-series]');if(n)setSeries(n.dataset.series)});
    document.querySelectorAll('[data-special]').forEach(b=>b.addEventListener('click',()=>setSpecial(b.dataset.special)));
    $('searchInput').addEventListener('input',e=>{state.query=e.target.value;state.limit=36;render()});
    $('withImage').addEventListener('change',e=>{state.onlyImage=e.target.checked;state.limit=36;render()});
    $('sortSelect').addEventListener('change',e=>{state.sort=e.target.value;render()});
    $('gridView').addEventListener('click',()=>{state.view='grid';store();render()});
    $('listView').addEventListener('click',()=>{state.view='list';store();render()});
    $('quickChips').addEventListener('click',e=>{const b=e.target.closest('[data-keyword]');if(!b)return;state.query=state.query===b.dataset.keyword?'':b.dataset.keyword;$('searchInput').value=state.query;state.limit=36;render()});
    $('clearFilters').addEventListener('click',reset); $('emptyReset').addEventListener('click',reset);
    $('cards').addEventListener('click',e=>{const n=e.target.closest('[data-action]');if(!n)return;const a=n.closest('[data-id]');if(!a)return;const id=a.dataset.id;if(n.dataset.action==='open')openInspector(id);else if(n.dataset.action==='favorite')toggleId('favorite',id);else if(n.dataset.action==='select')toggleId('select',id)});
    $('loadMore').addEventListener('click',()=>{state.limit+=36;render()});
    $('heroExplore').addEventListener('click',()=>$('explore').scrollIntoView({behavior:'smooth'}));
    $('heroCreate').addEventListener('click',openTask); $('sidebarBuild').addEventListener('click',openTask);
    $('selectionCreate').addEventListener('click',openTask); $('viewSelected').addEventListener('click',()=>setSpecial('selected'));
    $('closeInspector').addEventListener('click',closeInspector); $('closeTask').addEventListener('click',closeTask);
    $('overlay').addEventListener('click',()=>{if(!$('taskModal').hidden)closeTask();else if(!$('inspector').hidden)closeInspector();else hideMobile()});
    $('inspectorBody').addEventListener('click',async e=>{const b=e.target.closest('[data-drawer-action]');if(!b)return;const a=b.dataset.drawerAction,id=state.drawerId;const x=lookup.get(id);if(!x)return;if(a==='copy'){const ok=await copyText(x.markdown);notify(ok?'原始 Markdown 已复制':'浏览器禁止复制，请手动选中')}else if(a==='zoom'){window.open(x.image,'_blank','noopener')}else if(a==='create'){if(!selected.includes(id)){if(x.missingPrompt&&!confirm(`${id} 原文不完整，仍要加入并配置吗？`))return;selected.push(id);styleRoles[id]=roleOf(id);store();render()}openTask()}else toggleId(a,id)});
    $('taskStyleList').addEventListener('click',e=>{const b=e.target.closest('[data-task-remove]');if(b)toggleId('select',b.dataset.taskRemove)});
    $('taskStyleList').addEventListener('change',e=>{const s=e.target.closest('[data-task-role]');if(!s)return;styleRoles[s.dataset.taskRole]=s.value;store();renderTask()});
    $('taskBrowse').addEventListener('click',()=>{closeTask();$('explore').scrollIntoView({behavior:'smooth'})});
    $('saveDraft').addEventListener('click',()=>{readTask();store();notify('草稿已保存在本机浏览器')});
    $('copyTask').addEventListener('click',async()=>{const missing=missingItems(readTask());if(missing.length)notify(`仍有待补充：${missing.join('、')}`);const ok=await copyText(taskText());notify(ok?'完整 Prompt 已复制':'复制失败，请从预览区手动复制')});
    $('downloadPrompt').addEventListener('click',()=>{downloadText('PROMPT_FOR_DSH.md',taskText());notify('Prompt Markdown 已下载')});
    $('downloadZip').addEventListener('click',async()=>{const btn=$('downloadZip');btn.disabled=true;btn.textContent='正在生成 ZIP…';try{const out=await buildTaskPackage();downloadBlob(`MotionAtlas-Task-${out.taskId}.zip`,out.zip);notify(`ZIP 已生成：${out.fileList.length} 个文件`)}catch(err){notify(`ZIP 生成失败：${err.message}`)}finally{btn.disabled=false;btn.textContent='下载任务包 ZIP'}});
    $('themeButton').addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;$('themeButton').textContent=next==='dark'?'☀':'☾';try{localStorage.setItem('motion_atlas_theme',next)}catch(_){}});
    try{const theme=localStorage.getItem('motion_atlas_theme');if(theme==='dark'){document.documentElement.dataset.theme='dark';$('themeButton').textContent='☀'}}catch(_){}
    $('menuButton').addEventListener('click',()=>{$('sidebar').classList.toggle('open');$('overlay').hidden=!$('sidebar').classList.contains('open')});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('taskModal').hidden)closeTask();else if(!$('inspector').hidden)closeInspector();else hideMobile();return}if((e.key==='/'||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'))&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('searchInput').focus();$('searchInput').select()}});
    const id=new URL(location.href).searchParams.get('style'); if(id&&lookup.has(id))openInspector(id);
  }
  boot();
})();
