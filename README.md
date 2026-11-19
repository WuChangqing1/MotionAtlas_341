# Motion Atlas 341 · 代码动画创作工作台

341 种真实代码动画风格、193 张参考静帧。选择风格，写一句想法，复制一个 Prompt，让 **DeepSeek Harness** 自主完成分镜、代码、视频渲染与检查。无需下载 ZIP 或手动编辑任务参数。

- **在线工作台**：<https://ccqspace.site/animation/>
- **成功案例**：《完成之后》<https://ccqspace.site/animation/showcase/>
- **总首页入口**：<https://ccqspace.site/>
- **GitHub**：<https://github.com/WuChangqing1/MotionAtlas_341>

默认：20 秒、1080p、30fps、中文、一条本机氛围床，直接授权完整成片。需要时可展开高级设置。网页只复制任务；制作在本地 DSH 完成，不调用付费 API。

## 使用

1. 在工作台选择喜欢的风格（支持搜索、收藏、多选）。
2. 写下动画想法，点击“复制成片 Prompt”。
3. 在本地 MotionAtlas_341 工作区的 DSH 粘贴发送一次，DSH 自动保存参数、完成制作并返回 MP4。

Prompt 包含实际 Skill 加载要求、完整任务 JSON、所选风格路径和 SHA、成片授权及真实 QA 要求。341 原文/193 静帧保留；原文不完整的 8 条风格会阻止制作，不用虚构替代。历史 ZIP 和 writer 作为历史文件保留，不再是网站功能。

执行器内置 A1/A2、L42/V6 的可复用适配；其他风格由 DSH 读完原文后实现独立适配，不保证模型无需返修就生成符合预期的视频。依赖不足会明确报告。

开发者可直接验证示例：

```powershell
python tools/animate.py --task examples/a1-a2.task.json --out outputs/my-film
```

执行入口、字段、扩展接口及失败定位见 [执行说明](docs/EXECUTION_PIPELINE.md)，真实测试和观看边界见 [执行 QA](docs/EXECUTION_QA.md)。

原成功案例《完成之后》MP4 SHA256：`ab039c173f6f9c972da44d468af21265d36376418ef5027d449cbb1b11adebd6`，不覆盖。

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
python .dsh/skills/fy-code-animation/scripts/doctor.py --root ./style-library
python .dsh/skills/fy-code-animation/scripts/style_library.py get --root ./style-library --query B3
```

`doctor` 应返回 `ready=true`、`verdict=ready`、`prompt_count=341`。索引过期且 Skill 只读时，使用执行说明中的可写索引 fallback；不要伪造 build 成功。

## 部署

- 生产 URL：`https://ccqspace.site/animation/`
- Nginx：现有 `/animation/` → `127.0.0.1:18093`，无新增公网端口
- 本次发布与精确回滚记录：[`docs/DEPLOYMENT_ONE_PROMPT.md`](docs/DEPLOYMENT_ONE_PROMPT.md)

## 许可与来源

风格库与 Skill 由各自作者免费分享；不得包装为付费课程、付费 Skill 或收费素材出售。第三方材料继续遵循其原始许可：

- [`style-library/许可与来源.md`](style-library/许可与来源.md)
- [`style-library/第三方许可/`](style-library/第三方许可/)
- [`.dsh/skills/fy-code-animation/LICENSE.md`](.dsh/skills/fy-code-animation/LICENSE.md)
- [`web/assets/licenses/`](web/assets/licenses/)
