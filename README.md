# Motion Atlas 341 · 代码动画创作工作台

341 种真实代码动画风格、193 张参考静帧、可组合的任务编辑器，以及可直接交给 **DeepSeek Harness** / `fy-code-animation` Skill 的 Prompt 与 ZIP 任务包生成器。

- **在线工作台**：<https://ccqspace.site/animation/>
- **成功案例**：《完成之后》<https://ccqspace.site/animation/showcase/>
- **总首页入口**：<https://ccqspace.site/>
- **GitHub**：<https://github.com/WuChangqing1/MotionAtlas_341>

> 状态：工作台已部署；自动静态/ZIP/Skill 检查通过，浏览器交互和桌面/手机布局仍标记为人工 QA 待复核。详见 [`docs/QA_REPORT.md`](docs/QA_REPORT.md)。

## 核心功能

- **341 条风格**：10 个系列（A–G、M、K、Z、H、L、V、X、R、O），编号/中英文/关键词/原文搜索，类别筛选，收藏，多选，已选视图。
- **真实资料**：193 张本地参考图；完整原始 Markdown；原文路径与 SHA256；无图明确标注；“不完整”原文（8 条）不伪造内容。
- **组合**：主视觉 / 动态语言 / 辅助特效 / 排版配色 / 特定场景；全片统一、分镜不同、主风格+辅助、由 DSH 安排；冲突提醒。
- **任务编辑**：主题、文案、观众、核心意思、事实、时长、画幅、分辨率、帧率、字幕、音乐、音效、旁白、角色、输出、阶段、禁止事项。
- **Prompt**：以 `/fy-code-animation` 开头，同时明确 Skill 实际加载验证；包含风格原文路径/SHA、DSH 模块、`build/doctor/get` 自检、制作流程、阶段边界、验收与禁止事项。
- **ZIP**：真实客户端下载；轻量包与完整离线包；包含任务 JSON、选中风格原文、参考图、Skill 调用说明、Windows PowerShell 说明、许可、SHA manifest；不依赖外部 CDN。
- **示例**：[`web/downloads/MotionAtlas-Task-MA341-EXAMPLE-B3-O63.zip`](web/downloads/MotionAtlas-Task-MA341-EXAMPLE-B3-O63.zip)（B3 + O63）。
- **原案例**：已验收《完成之后》移至 `showcase/`，MP4 SHA256 `ab039c173f6f9c972da44d468af21265d36376418ef5027d449cbb1b11adebd6` 未改。

## 目录

```text
MotionAtlas_341/
├─ web/                             可直接部署的工作台
│  ├─ index.html
│  ├─ css/app.css + workbench.css
│  ├─ js/data.js (341 条真实数据 + 原文)
│  ├─ js/app.js
│  ├─ js/zip.js (store-only ZIP writer)
│  ├─ assets/stills/ (193 张)
│  ├─ assets/skill-bundle.json
│  ├─ assets/licenses/
│  ├─ downloads/ (真实示例 ZIP)
│  └─ showcase/ (成功案例页)
├─ style-library/                   341 篇原始 Markdown + 示例 + 许可
├─ .dsh/skills/fy-code-animation/   完整项目级 Skill
├─ docs/                            需求、架构、Skill、导出、部署、QA、回滚
├─ MotionAtlas_341_Deploy/          服务器部署包与状态
├─ outputs/first-demo/              已完成动画源码、报告与最终 MP4
└─ scripts/                         示例 ZIP / 发布辅助脚本
```

大体积生成物（450 帧、旧 FAIL 归档、专项/QA PNG、node_modules）不进入公共仓库；它们保留在本地和服务器。

## 本地预览

```powershell
python -m http.server 18094 --directory web
```

打开 <http://127.0.0.1:18094/>。没有后端、数据库或 npm 必需依赖。

## Skill 自检

```powershell
python .dsh/skills/fy-code-animation/scripts/style_library.py build --root ./style-library
python .dsh/skills/fy-code-animation/scripts/doctor.py --root ./style-library
python .dsh/skills/fy-code-animation/scripts/style_library.py get --root ./style-library --query B3
```

`doctor` 应返回 `ready=true`、`verdict=ready`、`prompt_count=341`。如果当前文件系统只读导致 build 无法写 `adapters/style-index.json`，以 doctor 的库/索引一致性结果为准并修复写权限；不要伪造 build 成功。

## 部署

- 生产 URL：`https://ccqspace.site/animation/`
- Nginx：现有 `/animation/` → `127.0.0.1:18093`，无新增公网端口
- 当前 release：`/var/www/motion-atlas-341/releases/20261107T1250Z-workbench`
- 旧 release：`/var/www/motion-atlas-341/releases/20261107T042005Z-ab039c173f6f`
- 回滚：[`docs/ROLLBACK.md`](docs/ROLLBACK.md)

## 许可与来源

风格库与 Skill 由各自作者免费分享；不得包装为付费课程、付费 Skill 或收费素材出售。第三方材料继续遵循其原始许可：

- [`style-library/许可与来源.md`](style-library/许可与来源.md)
- [`style-library/第三方许可/`](style-library/第三方许可/)
- [`.dsh/skills/fy-code-animation/LICENSE.md`](.dsh/skills/fy-code-animation/LICENSE.md)
- [`web/assets/licenses/`](web/assets/licenses/)
