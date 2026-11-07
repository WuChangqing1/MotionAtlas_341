'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'web', 'downloads', 'MotionAtlas-Task-MA341-EXAMPLE-B3-O63.zip');
const zip = require(path.join(ROOT, 'web', 'js', 'zip.js'));
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'web', 'js', 'data.js'), 'utf8'), ctx);
const DATA = ctx.window.MOTION_ATLAS_DATA;
const lookup = new Map(DATA.map(x => [x.id, x]));
const ids = ['B3', 'O63'];
const roles = { B3: 'effect', O63: 'main' };
const roleNames = { main: '主视觉风格', motion: '动态语言', effect: '辅助特效', typography: '排版/配色', scene: '特定场景', aux: '辅助参考' };
const task = {
  task_id: 'MA341-EXAMPLE-B3-O63', title: '完成之后 · 第二集（示例）',
  theme: '动作完成 ≠ 任务完成', audience: '产品团队与自动化验收人员',
  core: '执行动作并不等于任务目标已经得到可靠验证。',
  facts: '机械臂抓取、放置、视觉复核；6.2 mm、+23°、71% 均仅作模拟演示数据。',
  script: '机械臂完成一次抓取与放置，检测系统却给出未通过的复核证据。画面最后说明：动作完成不等于任务完成，纠正指令仍需执行。',
  duration: 15, ratio: '16:9', fps: 30, resolution: '1920x1080', language: '中文',
  music: '无音乐', sfx: '按镜头设计音效', narration: '不需要旁白', characters: '不需要',
  style_mode: '主风格 + 辅助特效', phase: 'card', output: 'HTML + Canvas 可运行工程 + 静帧/视频',
  constraints: '中文大字可读；O63 负责纸张、物件与整体气质；B3 只负责粒子入座/复核特效，不覆盖主体和文字。',
  prohibited: '不自动部署；不上传未公开文案；不使用外部付费素材；不把模拟测量写成实测。'
};
const styleMeta = ids.map(id => { const x=lookup.get(id); return {id,title:x.title,role:roles[id],role_label:roleNames[roles[id]],path:x.path,sha256:x.sha256,missing_prompt:Boolean(x.missingPrompt)}; });
const prompt = `/fy-code-animation

# ${task.title} · DeepSeek Harness 制作任务

## 0. 授权与阶段
- 阶段：**card**。只交任务卡、分镜、时间轴和制作方案；不安装依赖、不生成媒体。
- 本任务来自 Motion Atlas 341 工作台真实导出，不是演示占位。
- 不得自动部署、上传、购买第三方服务或进入 final。

## 1. 实际加载 Skill
通过当前 DSH 的 Skill 机制加载 \`fy-code-animation\`，项目级入口：
\`<项目根>/.dsh/skills/fy-code-animation/SKILL.md\`
\`/fy-code-animation\` 只是入口提示；当前 DSH 不支持斜杠时必须使用 skill 工具或手动读取 SKILL.md，并在制作记录里说明实际加载方式。至少读取：
- \`modules/decisions.md\`
- \`modules/workflow.md\`
- \`modules/meaning.md\`
- \`modules/style.md\`
- \`modules/engineering.md\`
- \`modules/qa.md\`

## 2. 风格库自检
\`\`\`powershell
python .dsh/skills/fy-code-animation/scripts/style_library.py build --root ./style-library
python .dsh/skills/fy-code-animation/scripts/doctor.py --root ./style-library
python .dsh/skills/fy-code-animation/scripts/style_library.py get --root ./style-library --query B3
\`\`\`
若 doctor 不通过，停止并报告缺项，不得假称已读取风格。

## 3. 选定风格与角色
${styleMeta.map((x,i)=>`${i+1}. [${x.role_label}] ${x.id} ${x.title}\n   原文：${x.path}\n   SHA256：${x.sha256}`).join('\n')}

组合方式：**主风格 + 辅助特效**
- O63：主视觉。负责纸张、印刷、物件和整体色彩；先按原文确认材料与构图。
- B3：辅助特效。只在机械臂入座、视觉复核和数据显现处使用；粒子不能遮挡实体、文字或关键抓取点。
- 不得把两份完整 Prompt 机械拼接；冲突时保留作者选择并说明折中。

## 4. 制作需求
- 主题：${task.theme}
- 观众：${task.audience}
- 核心：${task.core}
- 关键事实：${task.facts}
- 文案/故事：${task.script}
- 时长：${task.duration}s；画幅：${task.ratio}；分辨率：${task.resolution}；${task.fps}fps
- 字幕：${task.language}；声音：${task.music} / ${task.sfx} / ${task.narration}
- 角色：${task.characters}
- 输出：${task.output}
- 特别要求：${task.constraints}
- 禁止：${task.prohibited}

## 5. 执行流程
1. 先阅读全文，提炼语义、事实边界、观众认识变化和情绪走向；写理解摘要。
2. 完整读取 B3、O63 原文，记录依赖、材料、动作语法、技术限制与参考出处。
3. 按 \`templates/task-card.md\` 输出 card：分镜、时间轴、画面、文字、镜头、转场、声音需求和待确认项。
4. 不生成媒体、不安装依赖；若发现风格冲突，提出方案让作者选择。

## 6. 完成标准
- 交付任务卡/分镜，不是空泛方案；
- 引用真实原文路径与 SHA；
- 主视觉与辅助特效职责清楚；
- 区分机器检查、人工观看、作者采用；
- 说明未完成项和风险；
- 不虚构 Skill 调用或制作结果。

## 7. 完工汇报
列出实际读取的 Skill 模块、风格原文/SHA、生成文件、运行命令、真实结果、遗留问题。`;
const run = `# Windows 11 · 运行示例任务

## 解压
\`\`\`powershell
Expand-Archive -LiteralPath .\\MotionAtlas-Task-MA341-EXAMPLE-B3-O63.zip -DestinationPath . -Force
cd .\\MotionAtlas-Task-MA341-EXAMPLE-B3-O63
\`\`\`

## 确认工作区
把任务包放入已安装完整 Skill 与 341 风格库的 MotionAtlas_341 工作区，或使用包含 \`skill/\` 的完整包。确认：
\`\`\`powershell
Test-Path .\\.dsh\\skills\\fy-code-animation\\SKILL.md
Test-Path .\\style-library\\风格提示词
python .\\.dsh\\skills\\fy-code-animation\\scripts\\style_library.py build --root .\\style-library
python .\\.dsh\\skills\\fy-code-animation\\scripts\\doctor.py --root .\\style-library
\`\`\`

## 加载 Skill
在 DSH 中调用 skill 工具加载 \`fy-code-animation\`，或手动读取项目内 SKILL.md。不要只输入 \`/fy-code-animation\` 就假定加载成功。

## 交给 DSH
把 \`PROMPT_FOR_DSH.md\` 全文交给 DSH。默认阶段为 **card**；不要擅自升级到 final。

## 检查
查看 DSH 是否输出任务卡、分镜、风格引用 SHA、待确认项，以及是否明确没有生成媒体。`;
const skillUsage = `# Skill 调用说明

- 项目级 Skill：\`.dsh/skills/fy-code-animation/SKILL.md\`
- 通过 DSH skill 工具加载 \`fy-code-animation\`；\`/fy-code-animation\` 只是入口。
- 如果当前 DSH 不支持斜杠，手动读取 SKILL.md，并读取 modules/workflow.md、decisions.md、meaning.md、style.md、engineering.md、qa.md。
- card 只设计；still 只静帧；audition 只试听；final 需要明确授权。
- 判定真实调用的证据：实际读取文件、style_library build/doctor/get 的真实输出、任务卡中的 SHA 和依赖。`;
const install = `# Skill 安装

## A. 已有 MotionAtlas_341 工程
直接使用项目 \`.dsh/skills/fy-code-animation/\` 与 \`style-library/\`。

## B. 其他工作区
将完整 \`fy-code-animation\` 复制到目标项目 \`.dsh/skills/\`，将原始 341 风格库放到含 \`风格提示词/\` 的根目录，再运行 build/doctor。缺少依赖时不要直接宣称可用。`;
const license = `# 许可与来源

- 风格库许可：见 \`LICENSES/style-library-license.md\`
- Skill 许可：见 \`LICENSES/skill-LICENSE.md\`
- 第三方来源：见 \`LICENSES/third-party/\`
- 风格原文参考出处见 \`styles/selected/\` 末尾。

免费分享；不得包装成付费课程、付费 skill 或收费资料出售。参考图仅作风格判断。`;
function bytes(v){ return Buffer.isBuffer(v) ? v : Buffer.from(String(v),'utf8'); }
function sha(b){ return crypto.createHash('sha256').update(b).digest('hex'); }
const entries = [];
function add(name,data){entries.push({name,data:Buffer.isBuffer(data)?new Uint8Array(data):new TextEncoder().encode(String(data))});}
add('PROMPT_FOR_DSH.md',prompt); add('RUN_WITH_DSH.md',run); add('README.md',`# ${task.task_id}\n\n${task.title}\n\n- 阶段：${task.phase}\n- 风格：B3（辅助特效）+ O63（主视觉）\n- 任务：${task.theme}\n- 输出：任务卡/分镜\n\n先读 RUN_WITH_DSH.md，再把 PROMPT_FOR_DSH.md 交给 DSH。`);
add('skill/SKILL_USAGE.md',skillUsage); add('skill/INSTALLATION.md',install); add('LICENSES/README.md',license);
for (const f of [['LICENSES/style-library-license.md','web/assets/licenses/style-library-license.md'],['LICENSES/skill-LICENSE.md','web/assets/licenses/skill-LICENSE.md'],['LICENSES/third-party/code-video_LICENSE.txt','web/assets/licenses/code-video_LICENSE.txt'],['LICENSES/third-party/Lemo-Opuscar_LICENSE.txt','web/assets/licenses/Lemo-Opuscar_LICENSE.txt'],['LICENSES/third-party/mg-styles-15_LICENSE.txt','web/assets/licenses/mg-styles-15_LICENSE.txt']]) add(f[0],fs.readFileSync(path.join(ROOT,f[1])));
add('task.json',JSON.stringify({task_id:task.task_id,title:task.title,brief:task.theme,audience:task.audience,script:task.script,selected_styles:ids,style_roles:roles,style_source_sha256:Object.fromEntries(styleMeta.map(x=>[x.id,x.sha256])),duration_seconds:task.duration,aspect_ratio:task.ratio,fps:task.fps,resolution:task.resolution,audio_mode:{music:task.music,sfx:task.sfx,narration:task.narration},phase:task.phase,constraints:task.constraints,prohibited:task.prohibited,required_outputs:['任务卡','分镜表','风格取舍说明','待确认项']},null,2));
const selected = {task_id:task.task_id,selected_styles:styleMeta};
add('selected-styles.json',JSON.stringify(selected,null,2));
for (const m of styleMeta) { const x=lookup.get(m.id); add(`styles/selected/${m.id}.md`,x.markdown); const img=path.join(ROOT,'web',x.image); if(fs.existsSync(img)) add(`references/${m.id}.${path.extname(x.image).slice(1)}`,fs.readFileSync(img)); }
const files = entries.map(e=>({path:e.name,bytes:e.data.length,sha256:sha(Buffer.from(e.data))}));
add('manifest.json',JSON.stringify({task_id:task.task_id,project:'MA341-DEMO-001',export_version:'example-v1',created_at:new Date().toISOString(),mode:'light',selected_styles:styleMeta,files,complete:true},null,2));
fs.mkdirSync(path.dirname(OUT),{recursive:true});
const z = zip.buildZipBytes(entries);
fs.writeFileSync(OUT, Buffer.from(z));
console.log('WROTE',OUT,z.length,'bytes',entries.length,'files');
