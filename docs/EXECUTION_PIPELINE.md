# 一次 Prompt 完成代码动画

日常用法：在网站选择风格，写下想法，点击“复制成片 Prompt”，在本地 MotionAtlas_341 工作区的 DeepSeek Harness 粘贴发送。无需 ZIP、手改 JSON、补作品名或逐阶段批准。Prompt 已包含完整任务 JSON 和 final 授权；DSH 将想法转成真实片内文案与语义分镜，再制作、检查与修复。

默认 20 秒、1920×1080、30fps、中文、一条本机合成氛围床。可选高级设置保留明确 card/still/audition 阶段；不会擅自升级。网站不执行本地或服务器命令。

开发/复现只有一个入口，在工程根运行：

```powershell
python tools/animate.py --task examples/a1-a2.task.json --out outputs/my-film
```

另一个示例：将 task 换成 `examples/l42-v6.task.json`，out 换成新的目录。现有非空输出目录会拒绝覆盖。无需新依赖，使用本机 Python、Pillow、ffmpeg、ffprobe 和中文字体。

## 唯一任务契约

`web/js/task-contract.js` 产生 schema_version=1 的任务；网页 Prompt 内 JSON、本地入口与 manifest.task 使用相同字段。Prompt 不再依赖 ZIP 才能拿到参数。DSH 在自动保存任务时可以补 scenes、renderer，不得更改所选原文 SHA 或伪造事实。

| 字段 | 含义 |
|---|---|
| schema_version / task_id | 1 / 字母数字横线下划线任务 ID |
| title / brief | 自动标题 / 一句创作要求，brief 必填 |
| phase | card 只文本；still 只静帧；audition 只一条氛围床；final 成片 |
| duration_seconds / width / height / fps | 3–300 秒；256–3840 偶数尺寸；24/25/30/60fps；总帧数必须整数 |
| aspect_ratio / seed | 画幅；固定整数 seed，默认 341 |
| style_ids / styles | 有序编号；每项 id、style-library/ 相对原文路径、原文件 SHA256 |
| style_roles / style_mode | 自动分工 / 风格组合方式，无需手填 |
| audio | mode=none/ambient、narration、sfx；默认无旁白/无音效 |
| authorization | final_render=true 才允许 final；autonomous_decisions=true 允许自主完成设计 |
| output | MP4、源码、静帧、manifest、QA |
| constraints / prohibited | 制作要求与禁止事项；不等于授权付费、安装或部署 |
| audience / facts / core_meaning | 可空；推断内容属于建议，不得编成事实 |
| scenes（可选） | 连续覆盖全片的秒制 start/end、真实文案 text；A1 可附 rain_words |
| still_times（可选） | 指定片内秒数；省略为 20%/50%/85% |
| renderer（可选） | DSH 实现的 animation.模块名，显式指定优先于内置 |

## 执行与产物

读取任务 → doctor → 验证每条 SHA 并读完整 Markdown → 阶段处理 → 真实编码 → 全帧解码、ffprobe、blackdetect、编码后静帧 → manifest/QA。doctor 失败立即停止，不强写只读索引。

```text
outputs/my-film/
  task.json / doctor.json
  sources/<ID>.md                 本次完整实读原文快照
  video/<task_id>.mp4             final 才生成
  stills/encoded_*.png            final 从编码后视频提取
  audio/ambient.wav              ambient 时真实生成
  render_manifest.json           task、源 SHA、大小、ffprobe、检查、文件哈希
  QA_REPORT.md                   机器结果与观看边界
  ffmpeg.log / blackdetect.log / encode_command.json
```

失败 exit 2，并写 `failure.json` 的 stage/error（包括 task、doctor、styles、dependencies、renderer、audio、encode、media_qa）。非空目录拒绝覆盖时只在 stderr 报告，不改原目录。日志不是人工观看证据。

doctor 索引过期且 Skill 只读时，使用可写索引，不自动修改 Skill：

```powershell
python .dsh/skills/fy-code-animation/scripts/style_library.py build --root ./style-library --index ./outputs/style-index.json
$env:MOTION_ATLAS_STYLE_INDEX = (Resolve-Path ./outputs/style-index.json).Path
```

库可通过 FY_STYLE_LIBRARY_ROOT 指向；字体可通过 MOTION_ATLAS_FONT 指向已有中文字体。doctor 仍失败则修复其列出的缺项，不渲染。

## 适配边界

内置 rain_type 支持 A1/A2（单选也可），tech_morph 支持 L42/V6（单选也可）。这些是最小可复用适配示例，并非 341 风格通用模板。其他风格由 DSH 实读原文后在 `tools/animation/` 创建独立模块：声明 STYLE_IDS、GRAMMAR，提供 Renderer(task).render(t)，返回指定尺寸的 Pillow RGB Image。render(t) 必须纯时间、可任意 seek；字体等内部属性不属于强制接口。

默认渲染器不合成旁白或镜头音效。显式要求这些内容会报清楚的阻断，需 DSH 接入真实本机音频及检查，不能用氛围床冒充。默认氛围床不声称达到原风格示例的商业音乐混音标准。

未完成边界：未在本次会话调用 DSH 自身启动一段全新 AI 制作会话；不同风格/主题的最终内容质量依赖 DSH 实现与复核。工具通过不代表作者已采用。
