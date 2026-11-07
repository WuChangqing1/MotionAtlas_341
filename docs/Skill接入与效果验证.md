# DeepSeek Harness：fy-code-animation Skill 接入与效果验证

## 一、为什么不是点一下网页就生成视频？

这个项目分两层：
- **Motion Atlas 前端**：全部 341 种风格的原文检索、参考静帧、收藏、选择和任务指令生成。这是一个**无后端静态网站**，不能运行服务器命令或自动调 DeepSeek Harness。
- **fy-code-animation Skill + DeepSeek Harness**：在**你授权的 DSH 本地工作区**中阅读 `SKILL.md`，检索同一份原始风格库，生成任务卡、静帧、音频和动画。这里才需要 Agent 的文件与命令执行权限。

这两层通过 **风格编号 + SHA256 + 原始路径 + Markdown 任务** 连接，避免过度授权公网服务，能追踪生成过程。

## 二、最快的项目级安装（推荐）

此包已经把 Skill 完整放在：

`<项目根>/.dsh/skills/fy-code-animation/SKILL.md`

原始风格库位于：

`<项目根>/style-library/`（这个目录**直接**包含 `风格提示词/`）

**请让 DSH 以解压后的 `MotionAtlas_341` 目录为工作目录**。DSH 的文件系统 Skill 提供者会扫描项目根下 `.dsh/skills/<name>/SKILL.md`；若当前 DSH 版本未启用技能文件系统提供者或没有 `skill` 工具，要先检查本机安装组件，不要宣称已经接入。官方说明：

- https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/skills.md
- https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/skill/skill-filesystem/README.md

> DSH 的项目根与 `.git` 目录有关：在未初始化 Git 之前，以当前工作目录作为项目根；Git 初始化后，应继续在此仓库根目录运行 Agent。若 DSH 工作在其他项目，不会自动看到本仓库项目级 Skill。

### Windows 11 PowerShell（在项目根运行）

```powershell
# 确认文件路径
Test-Path .\.dsh\skills\fy-code-animation\SKILL.md
Test-Path .\style-library\风格提示词

# Python 3.10+；必要时用 py -3 替换 python
python .\.dsh\skills\fy-code-animation\scripts\style_library.py build --root .\style-library
python .\.dsh\skills\fy-code-animation\scripts\doctor.py --root .\style-library
python .\.dsh\skills\fy-code-animation\scripts\style_library.py get --root .\style-library --query B3
```

`doctor` 预期：`ready=true`、`verdict=ready`、`prompt_count=341`、`索引与库一致=true`。文件全部在包内，不需要重新从 GitHub 下载。**第一次索引构建和以后替换风格库以后，重新执行 build。**

### 不在这个项目根目录工作时（用户级安装）

将 **整个** `.dsh/skills/fy-code-animation` 目录复制到 DSH 当前用户级 Skills 根目录（常见 `~/.dsh/skills/fy-code-animation`，以自己的 DSH 配置与版本实际扫描路径为准）。只复制 `SKILL.md` 而不复制 `modules/`、`scripts/`、`templates/` 会导致缺文件。

用户级 Skill 的默认路径未必能自动找到项目中的风格库。两种方式选择一种：

1. **建议**：每次 `build/get/doctor` 显式传 `--root "D:\你的项目路径\MotionAtlas_341\style-library"`；
2. 设置用户环境变量 `FY_STYLE_LIBRARY_ROOT` 指向同一目录（不能指向 `风格提示词/` 本身），然后重新打开 DSH 进程。

Windows 示例：

```powershell
$root = (Resolve-Path '.\style-library').Path
[Environment]::SetEnvironmentVariable('FY_STYLE_LIBRARY_ROOT', $root, 'User')
$env:FY_STYLE_LIBRARY_ROOT = $root
```

请注意：复制 `fy-code-animation` 到全局 Skills 后，网页的任务提示词如果仍使用相对路径 `.dsh/skills/...`，需要让 DSH 把**当前真实 Skill 路径**替换进去，不可硬套路径。

## 三、DSH 会话验证（比文件检查更重要）

在包含 Skill 的项目根目录创建会话，发送下面这段内容：

```text
请使用 skill 工具加载 fy-code-animation，先阅读 SKILL.md 中的第0步、modules/decisions.md、modules/workflow.md 和 adapters/style-library.md。
当前工作目录就是 MotionAtlas_341 项目根目录；原始风格库根为 ./style-library。
先运行 style_library.py build --root ./style-library 和 doctor.py --root ./style-library。
然后读取 B3、O63 两种风格的完整 Markdown，并输出它们的实际文件路径、SHA256、核心视觉特征、各自适用场景。
本次授权仅为 card：以“一个机器人执行了动作，但任务未必真正成功”为主题，产出10秒的分镜任务卡，不执行动画渲染，不生成音乐。请严格注明实际调用了哪些工具，未调用的不要声称调用。
```

**验收**：

- DSH 会话记录里能看到 `fy-code-animation` 以真实 Skill 文件加载；不只是模型口头说“用了 Skill”。
- `doctor` 返回 ready，索引总数 341、SHA 一致。
- B3、O63 的具体视觉特征来自原始 Markdown，不是泛泛的“粒子、电影风格”。
- 生成了含镜头号、时间段、风格、转场与声音方案的任务卡，并符合 `card` 不生成任何媒体的授权。
- 若 `doctor` 失败，Agent 明确报告问题，而不是跳过检查。

## 四、自动化逻辑测试

在 Skill 根目录（`cd .dsh/skills/fy-code-animation`）运行：

```bash
python tests/test_contracts.py
node tests/test_logic.mjs
node tests/test_canvas_contract.mjs
```

当前包内实测：Python 13 条任务契约检查通过、Node 运动逻辑 12 条通过、Canvas 契约检查通过。Canvas 测试报告 `real_canvas_used=false`，**不能据此认定实际浏览器图形渲染或最终视频质量已通过**。

## 五、分阶段真实效果验收

| 阶段 | 指令 | 要交付的真实结果 | 检查重点 |
|---|---|---|---|
| 任务卡 card | 「本次只交任务卡」 | `task.json`、分镜表、风格选用与 SHA | 语义、镜头衔接、时长、风格特征 |
| 静帧 still | 「授权做 S01 与 S02 静帧」 | 可打开的 PNG / HTML 静态画面 | 中文清晰、构图与风格一致 |
| 试听 audition | 「四案声音试听」 | 四个实际音频样本与音效表（依实际能力） | 四案有区别、可播放、无虚构 |
| 成片 final | 「授权完整生成成片」 | 可运行源码、渲染命令、MP4、检查记录 | 播放完整、音画同步、无黑帧、无裁切、可 seek |

成片工程可优先使用 Remotion（需要 Node、ffmpeg 或可渲染依赖），或纯 HTML / Canvas + 浏览器录制；选择以目标项目实际条件为准。**Skill 不自带渲染能力，也不保证任意风格均可只凭一句话得到高质量视频。**

## 六、常见故障

- 找不到 Skill：检查路径的目录层级是否正好是 `.dsh/skills/fy-code-animation/SKILL.md`，检查 `skill-filesystem` 提供者和会话工作目录。
- `MISSING_LIBRARY_ROOT`：`--root` 应指向 `style-library`，不是 `风格提示词`。
- 索引过期：重新 `build --root`，然后 `doctor --root`。
- 只读了 SKILL.md，没有读风格原文：要求输出选中每个 ID 的 Markdown 路径和 SHA，并指出语法和依赖。
- 用了网页但 DSH 没动：网页不提供直接调用 DSH 的后端。这是预期的安全边界。
- 生成 MP4 失败：检查实际运行环境的 Node、Remotion、Chrome、ffmpeg 和素材授权，不能假定 DSH 已有所有依赖。
