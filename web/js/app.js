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
    audition: '只生成一条本机氛围床供试听，不制作视频。',
    final: '已授权直接完成成片。分镜、排版、节奏与检查由 DSH 自主完成，无需逐步确认。'
  };
  const phaseOutputs = {
    card: '任务卡 Markdown、分镜表、风格取舍说明、待确认项',
    still: '指定静帧 PNG、对应源码/参数、静帧检查记录',
    audition: '一条本机氛围床 WAV 与真实测量记录',
    final: '可运行源码、可复现渲染流程、成片 MP4/静帧、完整 QA 记录'
  };
  const defaultTask = {
    title:'', theme:'', content:'', audience:'', core:'', facts:'', extra:'',
    duration:20, ratio:'16:9', resolution:'1920x1080', fps:30, language:'中文',
    music:'默认氛围床', sfx:'无音效', narration:'不需要旁白',
    characters:'由内容决定', styleMode:'主风格 + 辅助特效',
    prohibited:'', phase:'final'
  };
  const prefKey = 'motion_atlas_341_workbench_v3';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(prefKey) || 'null'); if (!saved) { saved = JSON.parse(localStorage.getItem('motion_atlas_341_workbench_v2') || '{}'); saved.task = {...saved.task,phase:'final',music:'默认氛围床',sfx:'无音效',characters:'由内容决定',duration:20}; } } catch (_) {}
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
  const taskFields = ['title','theme','content','audience','core','facts','extra','duration','ratio','resolution','fps','language','music','sfx','narration','characters','styleMode','prohibited','phase'];
  const taskIds = { title:'taskTitleInput', theme:'taskTheme', content:'taskContent', audience:'taskAudience', core:'taskCore', facts:'taskFacts', extra:'taskExtra', duration:'taskDuration', ratio:'taskRatio', resolution:'taskResolution', fps:'taskFps', language:'taskLanguage', music:'taskMusic', sfx:'taskSfx', narration:'taskNarration', characters:'taskCharacters', styleMode:'taskStyleMode', prohibited:'taskProhibited', phase:'taskPhase' };
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
    for (const [id,key] of [['startIntent','content'],['startPhase','phase'],['startDuration','duration'],['startRatio','ratio']]) {
      if ($(id)) $(id).value=String(task[key]??'');
    }
    const phase = task.phase || 'final';
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
    $('startSelection').textContent = selected.length ? `已选 ${selected.join('、')}` : '尚未选风格';
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
    $('inspectorBody').innerHTML = `<div class="detail-visual">${media(x,true).replace('</div>',`<button class="drawer-zoom" data-drawer-action="zoom" aria-label="查看原图">查看原图 ↗</button></div>`)}</div>
      <div class="detail-info">
        <div class="drawer-meta">${esc(x.seriesName)} <span>/ ${esc(x.id)}</span></div>
        <h2 id="inspectorTitle" class="drawer-title">${esc(x.title)}</h2>
        ${x.english?`<p class="drawer-english">${esc(x.english)}</p>`:''}
        <p class="drawer-desc">${esc(x.description || x.previewText || '该条没有单独简介，请以原始 Markdown 为准。')}</p>
        <div class="drawer-buttons"><button class="primary-btn" data-drawer-action="select">${picked?'✓ 已加入任务':'＋ 使用这个风格'}</button><button class="ghost-btn" data-drawer-action="favorite">${faved?'★ 已收藏':'☆ 收藏'}</button><button class="ghost-btn" data-drawer-action="create">加入并配置任务 ↗</button></div>
        ${x.missingPrompt?'<div class="note-badge warning-inline">原始 Markdown 不完整：请补充，或明确同意按已有简述尝试；不会伪造内容。</div>':''}
        <dl class="drawer-kv"><dt>系列</dt><dd>${esc(x.seriesName)}</dd><dt>分类</dt><dd>${esc(x.category||x.groupName||'未标注')}</dd><dt>适用场景</dt><dd>${esc(x.fit||'以完整风格说明为准')}</dd><dt>关键词</dt><dd>${esc(x.keywords||'未单独标注')}</dd></dl>
        <details class="tech-details"><summary>完整提示词与技术信息</summary>
          <dl class="drawer-kv"><dt>原文路径</dt><dd>${esc(x.path)}</dd><dt>文件 SHA256</dt><dd class="sha-cell" title="${esc(x.sha256)}">${esc(x.sha256)}</dd><dt>许可 / 来源</dt><dd>风格库原始条目；参考出处见原文末尾；许可与来源见 LICENSES。</dd></dl>
          <div class="prompt-head"><b>原始完整 Markdown</b><button data-drawer-action="copy">复制全部原文 ↗</button></div>
          <pre class="prompt-source" id="rawPrompt"></pre>
        </details>
        <p class="task-small">参考图仅用于风格判断；没有参考图时会明确标注。完整原文保留，可复制或随 ZIP 下载。</p>
      </div>`;
    $('rawPrompt').textContent = x.markdown || '（原始 Markdown 为空。本条目不完整，不能伪造内容。）';
  }
  let inspectorScroll = 0, inspectorFocus = null;
  function stepInspector(delta) {
    const list = matches();
    const idx = list.findIndex(x => x.id === state.drawerId);
    if (idx < 0) return;
    const next = list[(idx + delta + list.length) % list.length];
    if (next) openInspector(next.id, true);
  }
  function ensureInspectorNav() {
    if (!$('inspector').querySelector('.drawer-prev')) {
      const prev = document.createElement('button'); prev.className = 'drawer-prev'; prev.type = 'button'; prev.textContent = '‹'; prev.setAttribute('aria-label', '上一个风格'); prev.addEventListener('click', () => stepInspector(-1));
      const next = document.createElement('button'); next.className = 'drawer-next'; next.type = 'button'; next.textContent = '›'; next.setAttribute('aria-label', '下一个风格'); next.addEventListener('click', () => stepInspector(1));
      $('inspector').append(prev, next);
    }
  }
  function openInspector(id, keepScroll = false) {
    if (!lookup.has(id)) return;
    if (!keepScroll) { inspectorScroll = window.scrollY; inspectorFocus = document.activeElement; }
    renderInspector(id); ensureInspectorNav();
    $('overlay').hidden = false; $('inspector').hidden = false; document.body.style.overflow = 'hidden';
    const url = new URL(location.href); url.searchParams.set('style', id); history.replaceState(null, '', url);
    $('closeInspector').focus();
  }
  function closeInspector() {
    state.drawerId = null; $('inspector').hidden = true;
    if ($('taskModal').hidden) $('overlay').hidden = true;
    document.body.style.overflow = '';
    const url = new URL(location.href); url.searchParams.delete('style'); history.replaceState(null, '', url);
    window.scrollTo(0, inspectorScroll || 0);
    if (inspectorFocus && document.contains(inspectorFocus)) inspectorFocus.focus();
  }
  function styleRows() {
    if (!selected.length) return '<p class="task-small">还没有选择风格。返回风格库添加至少一种，或让 DSH 根据内容安排。</p>';
    return selected.map(id => {
      const x = lookup.get(id); if (!x) return '';
      const role = roleOf(id);
      return `<div class="task-style-row task-style-rich"><span class="task-style-id">${esc(id)}</span><span class="task-style-name" title="${esc(x.title)}">${esc(x.title)}${x.missingPrompt?' <em class="tiny-warning">不完整</em>':''}</span><select class="task-role-select" data-task-role="${esc(id)}" aria-label="${esc(id)} 的角色">${roleOptions.map(([v,l])=>`<option value="${v}" ${role===v?'selected':''}>${l}</option>`).join('')}</select><button data-task-remove="${esc(id)}" aria-label="移除 ${esc(id)}">×</button></div>`;
    }).join('');
  }
  function autoTitle(t) {
    const raw = (t.title || '').trim() || (t.content || '').trim().replace(/\s+/g, ' ').slice(0, 26) || '未命名动画任务';
    return raw;
  }
  function missingItems(t) {
    const m=[];
    if(!t.content.trim()) m.push('一句创意描述');
    if(!selected.length) m.push('至少一种风格');
    if(selected.some(id=>lookup.get(id)?.missingPrompt)) m.push('完整风格原文（请选择其他风格）');
    return m;
  }
  function warnings(t) {
    const w=[];
    if(t.styleMode === '全片统一' && mainStyles().length > 1) w.push(`全片统一模式选择了 ${mainStyles().length} 个主视觉风格，可能冲突；请保留一个主风格或改成分镜/主+辅助。`);
    if(selected.some(id => lookup.get(id)?.missingPrompt)) w.push('选中包含原始 Markdown 不完整的条目；Prompt 会标记待补充，不会伪造原文。');

    if(t.phase === 'final' && !t.content.trim()) w.push('请写一句动画想法，文案和分镜由 DSH 自动完成。');
    return w;
  }
  function summaryMarkup(t) {
    const missing = missingItems(t), warn = warnings(t);
    const main = (mainStyles().length ? mainStyles() : selected.slice(0,1)).map(id=>`${id} ${lookup.get(id)?.title||''}`).join('、') || '未指定';
    const aux = selected.filter(id=>roleOf(id)!=='main').map(id=>`${id} ${roleName(id)}`).join('、') || '无';
    return `<div class="summary-head"><b>任务摘要</b><span>${selected.length} 风格 · ${esc(t.phase)}</span></div>
      <dl class="summary-kv"><dt>作品</dt><dd>${esc(autoTitle(t))}</dd><dt>主视觉</dt><dd>${esc(main)}</dd><dt>辅助</dt><dd>${esc(aux)}</dd><dt>规格</dt><dd>${esc(t.duration)}s · ${esc(t.ratio)} · ${esc(t.resolution)} · ${esc(t.fps)}fps</dd><dt>声音</dt><dd>${esc(t.music)} / ${esc(t.sfx)} / ${esc(t.narration)}</dd><dt>阶段</dt><dd><b>${esc(t.phase)}</b></dd><dt>预计交付</dt><dd>${esc(phaseOutputs[t.phase]||'')}</dd></dl>
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
    document.querySelector('.task-side').classList.toggle('show-advanced', document.querySelector('.task-fields').classList.contains('show-advanced'));
    const missing = missingItems(task);
    $('taskStatus').textContent = missing.length ? `待补充：${missing.join('、')}` : `${selected.length} 个风格 · ${task.phase} 阶段 · 可导出`;
    $('taskHeaderState').textContent = '草稿自动保存在本机浏览器';
  }
  function openTask() {
    const si = $('startIntent');
    if (si && si.value.trim() && !$('taskContent').value.trim()) $('taskContent').value = si.value.trim();
    if ($('startPhase') && !$('taskContent').value.trim()) $('taskPhase').value = $('startPhase').value;
    if(!$('inspector').hidden) closeInspector();
    $('overlay').hidden=false; $('taskModal').hidden=false; document.body.style.overflow='hidden'; renderTask(); $('taskContent').focus();
  }
  function closeTask() { $('taskModal').hidden=true; $('overlay').hidden=true; document.body.style.overflow=''; }
  function taskContract(taskId) {
    if (!task.taskId) task.taskId = `MA341-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${[...crypto.getRandomValues(new Uint8Array(3))].map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase()}`;
    return window.MotionAtlasTask.createTask(readTask(), selected.map(id=>lookup.get(id)), styleRoles, taskId || task.taskId);
  }
  function taskText() {
    try { return window.MotionAtlasTask.prompt(taskContract()); }
    catch (err) { return err.message; }
  }
  async function copyText(text) { try { if(navigator.clipboard && isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (_) {} const f=document.createElement('textarea'); f.value=text; f.style.cssText='position:fixed;left:-9999px'; document.body.append(f); f.select(); let ok=false; try{ok=document.execCommand('copy')}catch(_){} f.remove(); return ok; }
  function hideMobile() { $('sidebar').classList.remove('open'); if($('taskModal').hidden && $('inspector').hidden) $('overlay').hidden=true; }
  function bindTaskInputs() {
    for (const key of taskFields) {
      const el=$(taskIds[key]); if(!el) continue;
      const evt = (el.tagName==='SELECT' || key==='duration' || key==='fps') ? 'change' : 'input';
      el.addEventListener(evt,()=>{ readTask(); store(); if(!$('taskModal').hidden) renderTask(); });
    }
  }
  function setupV2Ui() {
    const fields = [...document.querySelectorAll('.task-fields .field')];
    const essential = new Set(['taskContent']);
    fields.forEach(field => {
      const control = field.querySelector('textarea,input,select');
      field.classList.add(control && essential.has(control.id) ? 'essential' : 'advanced-field');
    });
    const actions = document.querySelector('.task-bottom-actions');
    const adv = document.createElement('button');
    adv.type = 'button'; adv.id = 'advancedToggle'; adv.className = 'ghost-btn'; adv.textContent = '高级设置';
    if (actions && $('saveDraft')) actions.insertBefore(adv, $('saveDraft'));
    adv.addEventListener('click', () => {
      const on = document.querySelector('.task-fields').classList.toggle('show-advanced');
      adv.textContent = on ? '收起高级设置' : '高级设置'; document.querySelector('.task-side').classList.toggle('show-advanced',on);
    });
    const clear = document.createElement('button');
    clear.type = 'button'; clear.className = 'clear-btn'; clear.textContent = '清空任务';
    const headActions = document.querySelector('.task-head-actions');
    if (headActions) headActions.insertBefore(clear, $('closeTask'));
    clear.addEventListener('click', () => {
      if (!confirm('清空当前任务、已选风格和高级设置？收藏不会清空。')) return;
      task = Object.assign({}, defaultTask); selected = []; styleRoles = {}; applyTask(); if($('startIntent')) $('startIntent').value=''; store(); render(); renderTask();
      notify('当前任务已清空');
    });
    $('startCreate').addEventListener('click', async () => {
      readTask();
      if (!ensureFinalAuth()) return;
      const ok = await copyText(taskText());
      if (!ok) openTask();
      $('startHint').textContent = ok ? '已复制。在本地 DeepSeek Harness 粘贴发送，即可开始完整制作。' : '复制受限，请在预览中手动复制。';
      notify(ok ? '成片 Prompt 已复制，粘贴到本地 DSH 即可制作' : '请从预览中复制 Prompt');
    });
    $('startIntent').addEventListener('input', () => { task.content = $('startIntent').value; applyTask(); store(); });
    for (const [id,key] of [['startPhase','phase'],['startDuration','duration'],['startRatio','ratio']]) {
      $(id).addEventListener('change',()=>{task[key]=key==='duration'?Number($(id).value):$(id).value; applyTask(); store();});
    }
    applyTask();
    $('startBrowse').addEventListener('click', () => $('explore').scrollIntoView({ behavior:'smooth', block:'start' }));
    $('startExample').addEventListener('click', () => {
      if (($('taskContent').value.trim() || $('startIntent').value.trim() || selected.length) && !confirm('载入示例会覆盖当前任务内容和已选风格；收藏不会改变。继续吗？')) return;
      task = Object.assign({}, defaultTask, {
        content: '我想制作一段 20 秒的动画，解释为什么机器人动作完成不等于任务完成。',
        theme: '动作完成 ≠ 任务完成', phase: 'final', duration: 20, ratio: '16:9'
      });
      selected = ['O63','B3']; styleRoles = { O63:'main', B3:'effect' };
      $('startIntent').value = task.content;
      applyTask(); store(); render(); openTask(); notify('示例已载入：O63 主视觉 + B3 辅助特效');
    });
  }
  function ensureFinalAuth() {
    try { taskContract(); return true; } catch(err) {
      notify(err.message);
      if (!selected.length) { closeTask(); $('explore').scrollIntoView({behavior:'smooth'}); }
      return false;
    }
  }
  function boot() {
    menuMarkup(); applyTask(); bindTaskInputs(); setupV2Ui(); render();
    $('categoryNav').addEventListener('click',e=>{const n=e.target.closest('[data-series]');if(n)setSeries(n.dataset.series)});
    document.querySelectorAll('[data-special]').forEach(b=>b.addEventListener('click',()=>setSpecial(b.dataset.special)));
    $('searchInput').addEventListener('input',e=>{state.query=e.target.value;state.limit=36;render()});
    $('withImage').addEventListener('change',e=>{state.onlyImage=e.target.checked;state.limit=36;render()});
    $('sortSelect').addEventListener('change',e=>{state.sort=e.target.value;render()});
    $('gridView').addEventListener('click',()=>{state.view='grid';store();render()});
    $('listView').addEventListener('click',()=>{state.view='list';store();render()});
    $('quickChips').addEventListener('click',e=>{const b=e.target.closest('[data-keyword]');if(!b)return;state.query=state.query===b.dataset.keyword?'':b.dataset.keyword;$('searchInput').value=state.query;state.limit=36;render()});
    $('clearFilters').addEventListener('click',reset); $('emptyReset').addEventListener('click',reset);
    $('cards').addEventListener('click',e=>{
      const n=e.target.closest('[data-action]');
      const cardEl=e.target.closest('.style-card');
      if(n&&cardEl){const a=n.dataset.action,id=cardEl.dataset.id;if(a==='open')openInspector(id);else if(a==='favorite')toggleId('favorite',id);else if(a==='select')toggleId('select',id);return;}
      if(cardEl && !e.target.closest('button,select,a')) openInspector(cardEl.dataset.id);
    });
    $('loadMore').addEventListener('click',()=>{state.limit+=36;render()});
    $('heroExplore').addEventListener('click',()=>$('explore').scrollIntoView({behavior:'smooth'}));
    $('heroCreate').addEventListener('click',openTask); $('sidebarBuild').addEventListener('click',openTask);
    $('selectionCreate').addEventListener('click',()=>{ $('startPanel').scrollIntoView({behavior:'smooth'}); $('startIntent').focus(); }); $('viewSelected').addEventListener('click',()=>setSpecial('selected'));
    $('closeInspector').addEventListener('click',closeInspector); $('closeTask').addEventListener('click',closeTask);
    $('overlay').addEventListener('click',()=>{if(!$('taskModal').hidden)closeTask();else if(!$('inspector').hidden)closeInspector();else hideMobile()});
    $('inspectorBody').addEventListener('click',async e=>{const b=e.target.closest('[data-drawer-action]');if(!b)return;const a=b.dataset.drawerAction,id=state.drawerId;const x=lookup.get(id);if(!x)return;if(a==='copy'){const ok=await copyText(x.markdown);notify(ok?'原始 Markdown 已复制':'浏览器禁止复制，请手动选中')}else if(a==='zoom'){window.open(x.image,'_blank','noopener')}else if(a==='create'){if(!selected.includes(id)){if(x.missingPrompt&&!confirm(`${id} 原文不完整，仍要加入并配置吗？`))return;selected.push(id);styleRoles[id]=roleOf(id);store();render()}openTask()}else toggleId(a,id)});
    $('taskStyleList').addEventListener('click',e=>{const b=e.target.closest('[data-task-remove]');if(b)toggleId('select',b.dataset.taskRemove)});
    $('taskStyleList').addEventListener('change',e=>{const s=e.target.closest('[data-task-role]');if(!s)return;styleRoles[s.dataset.taskRole]=s.value;store();renderTask()});
    $('taskBrowse').addEventListener('click',()=>{closeTask();$('explore').scrollIntoView({behavior:'smooth'})});
    $('saveDraft').addEventListener('click',()=>{readTask();store();notify('草稿已保存在本机浏览器')});
    $('copyTask').addEventListener('click',async()=>{if(!ensureFinalAuth())return;const missing=missingItems(readTask());if(missing.length)notify(`仍有待补充：${missing.join('、')}`);const ok=await copyText(taskText());notify(ok?'完整 Prompt 已复制':'复制失败，请从预览区手动复制')});
    $('themeButton').addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;$('themeButton').textContent=next==='dark'?'☀':'☾';try{localStorage.setItem('motion_atlas_theme',next)}catch(_){}});
    try{const theme=localStorage.getItem('motion_atlas_theme');if(theme==='dark'){document.documentElement.dataset.theme='dark';$('themeButton').textContent='☀'}}catch(_){}
    $('menuButton').addEventListener('click',()=>{$('sidebar').classList.toggle('open');$('overlay').hidden=!$('sidebar').classList.contains('open')});
    document.addEventListener('keydown',e=>{
      if(!$('inspector').hidden&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();stepInspector(e.key==='ArrowLeft'?-1:1);return;}
      if(e.key==='Escape'){if(!$('taskModal').hidden)closeTask();else if(!$('inspector').hidden)closeInspector();else hideMobile();return}
      if((e.key==='/'||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'))&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();$('searchInput').focus();$('searchInput').select()}
    });
    const id=new URL(location.href).searchParams.get('style'); if(id&&lookup.has(id))openInspector(id);
  }
  boot();
})();
