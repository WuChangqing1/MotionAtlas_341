# Skill 加载与风格库验证证据（LOAD-EVIDENCE）

- 会话时间：2026-11-06（Asia/Shanghai）
- 工作目录：`D:\CodingData\Github\AICartoonMaking\MotionAtlas_341`
- 结论：`fy-code-animation` 由 **DSH 原生 Skill 机制**加载，来源是项目级 `.dsh/skills/fy-code-animation/SKILL.md`；341 风格库 `ready=true`；B3、O63 完整原文读取成功，SHA256 已记录。

## 1. DSH 原生加载证据

### 1.1 会话注入块

本次会话的用户消息以 `/fy-code-animation` 调用该技能，DSH 随即在对话中注入：

```text
<skill_content name="fy-code-animation">
<skill_resources>
Base directory for this skill: D:\CodingData\Github\AICartoonMaking\MotionAtlas_341\.dsh\skills\fy-code-animation
...
```

并且注入了完整的 `SKILL.md` 指令正文。这是 DSH 的 Skill 注入格式，不是普通 `read` 文件的结果：普通读取只会返回 `<path>...</path><content>...</content>`，不会生成 `<skill_content>` 与 `<skill_resources>`，也不会把技能正文放进系统级指令区。

### 1.2 系统技能目录

本次会话的 `available_skills` 目录包含：

```text
- `fy-code-animation`: 把中文文案、画风提示词和声音做成有表达、有统一审美、前后连贯的代码动画
  （Remotion / Canvas / HTML）……按本次授权区分只交任务卡、静帧、试听和成片。
  用于需要做代码动画、写动画任务卡、设计分镜或返修动画的请求；不用于自动安装依赖或擅自生成媒体。
```

### 1.3 DSH 源码中的项目级发现规则

DSH 源码（本机 checkout `D:\CodingData\Github\deepseek-harness`）在
`packages/skill/skill-filesystem/src/index.ts:250` 明确注册：

```ts
{ path: join(projectRoot, '.dsh/skills'), source: 'project-dsh', rank: PROJECT_DSH_RANK, projectRoot }
```

即：项目根下的 `.dsh/skills` 是 `project-dsh` 来源的技能根。本项目的 `fy-code-animation` 正位于该路径下，因此是原生发现，而不是我手动拼路径读取。

### 1.4 为什么没有再次调用 `skill` 工具

系统规则写明：用户直接调用技能时，其 `<skill_content>` 块会出现在对话中；应遵循该内容，不要再次调用 `skill` 工具。因此本会话对 `fy-code-animation` **没有**重复调用 `skill` 工具；对另一个技能 `diagnose-windows-sandbox-acl` 则通过 `skill` 工具正常加载，反证 Skill 机制本身可用。

### 1.5 Skill 文件与 SHA256

| 文件 | 绝对路径 | 字节 | SHA256 |
|---|---|---:|---|
| SKILL.md | `D:\CodingData\Github\AICartoonMaking\MotionAtlas_341\.dsh\skills\fy-code-animation\SKILL.md` | 12278 | `adb6e9862bc21b8efe097978ef9fc535ac96d6340d94140b4599eb56cce5b175` |
| modules/decisions.md | `...\.dsh\skills\fy-code-animation\modules\decisions.md` | 7601 | `643eb96c32fd650bfe8ba4568bb4a562883f323c715a139a2ec70e818348605a` |
| modules/workflow.md | `...\.dsh\skills\fy-code-animation\modules\workflow.md` | 3172 | `0c06e13b3c344a820d90807cacef982334854182e7db65c46a913aa5714f33fa` |
| adapters/style-library.md | `...\.dsh\skills\fy-code-animation\adapters\style-library.md` | 4998 | `7e19d08065b0dc65d27546cc8ef52bf47ddc402a382687c3e2324ed4d85067b3` |
| templates/task-card.md | `...\.dsh\skills\fy-code-animation\templates\task-card.md` | 8564 | `4c80f7e33840247aa0d56ce60a184313704bced281c0389c48c3cd1576e197e6` |
| adapters/style-index.json | `...\.dsh\skills\fy-code-animation\adapters\style-index.json` | 99297 | `5f2dad13394a631e4fc86d862e5753c2f99e3a0a555de54f812543973103c701` |

`SKILL.md` 的 frontmatter `name` 为 `fy-code-animation`，与路径、目录名、技能目录条目一致。

## 2. 341 风格库验证

### 2.1 统计文件

`style-library/_统计.json`：

```json
{
 "total": 341,
 "withStill": 193,
 "bySeries": {
   "AG": 26, "M": 40, "K": 38, "Z": 15, "H": 12,
   "L": 59, "V": 15, "X": 31, "R": 7, "O": 98
 }
}
```

分系列求和：26+40+38+15+12+59+15+31+7+98 = **341**。SHA256：`8902bdf277a34c7722b01e5bb066dd7439ca08617e1f230804d6d02a08cea973`。

`风格提示词/` 目录下共 535 个文件；其中 341 个是正式 Markdown 提示词，其余主要是 193 张原始静帧与示例/说明文件。索引只统计正式 prompt，因此 `prompt_count=341` 与目录文件总数不矛盾。

### 2.2 重建索引

命令（项目根）：

```powershell
python .dsh/skills/fy-code-animation/scripts/style_library.py build --root ./style-library
```

输出：

```json
{"library_version": "4a96742d3643538227c849a593380f25b66f001f613ed2915dd20f3dfd216f5a", "prompt_count": 341, "content_included": false}
```

### 2.3 doctor

命令（项目根）：

```powershell
python .dsh/skills/fy-code-animation/scripts/doctor.py --root ./style-library
```

关键输出：

```json
{
  "skill_root": "D:\\CodingData\\Github\\AICartoonMaking\\MotionAtlas_341\\.dsh\\skills\\fy-code-animation",
  "python": "3.13.12",
  "checks": [
    {"name": "核心文件", "ok": true, "missing": []},
    {"name": "341 风格库", "ok": true, "root": "style-library", "resolved_from": "cli", "has_prompt_dir": true},
    {"name": "索引", "ok": true, "prompt_count": 341, "library_version": "4a96742d3643538227c849a593380f25b66f001f613ed2915dd20f3dfd216f5a"},
    {"name": "索引与库一致", "ok": true, "library_prompt_count": 341, "index_prompt_count": 341, "library_version_now": "4a96742d3643538227c849a593380f25b66f001f613ed2915dd20f3dfd216f5a"}
  ],
  "ready": true,
  "verdict": "ready"
}
```

不传 `--root` 再跑一次 `doctor.py`，同样返回 `ready: true`、`prompt_count: 341`，说明 `adapters/style-library.config.json` 的 `root` 在当前工程布局下也能解析到 `./style-library`。为交接明确，任务卡仍写显式 `--root ./style-library`。

## 3. B3、O63 读取结果

命令（项目根）：

```powershell
python .dsh/skills/fy-code-animation/scripts/style_library.py get --root ./style-library --query B3 --kind prompt --audit-dependencies
python .dsh/skills/fy-code-animation/scripts/style_library.py get --root ./style-library --query O63 --kind prompt --audit-dependencies
```

返回的元数据：

| 字段 | B3 | O63 |
|---|---|---|
| id | `B3` | `O63` |
| name | 粒子聚形 | 与狼共舞（Dances with Wolves） |
| kind | `prompt` | `prompt` |
| path | `风格提示词/A-G_代码样片/B3_粒子聚形.md` | `风格提示词/O_奥斯卡98部/O63_与狼共舞.md` |
| sha256 | `2a784814e01c2ca003b6c5c2ddb1cffb84b0f57f45e6416543b95eecaaf66af1` | `a9ad027c6b13ce25a58b8b9f23d09fddb8b4ef067f8677bcba7e2e8a5c44e4fe` |
| bytes | 5627 | 3120 |
| lines | 73 | 36 |
| library_version | `4a96742d3643538227c849a593380f25b66f001f613ed2915dd20f3dfd216f5a` | 同左 |
| dependency_candidates | `[]` | `[]` |
| dependency_audit_complete | `false`（脚本只做字面路径候选，未做全文人工核） | 同左 |

两份原文已逐字复制到 `outputs/first-demo/card/style/B3.md`、`outputs/first-demo/card/style/O63.md`，仅在文件头加出处说明，正文未改。

## 4. 这份证据能证明什么、不能证明什么

**能证明**：

- DSH 确实发现并注入了项目级 `fy-code-animation` Skill，`SKILL.md` 与目录名、frontmatter 一致；
- 341 条正式提示词的库存在、索引与库一致、`doctor` 判定 `ready`；
- B3、O63 是通过 Skill 自带的 `style_library.py` 读到的完整原文，不是只看名称或摘要；
- 两份原文的 SHA256 与索引记录一致。

**不能证明**：

- 不能证明 B3/O63 融合后的画面一定好看，或粒子/水彩在 1080p 的最终质感；
- 不能证明本机已有 Remotion、字体、音频素材；
- 不能证明设计数值 6.2 mm / 23° / 71% 是真实测量；
- 不能证明作者已接受画风、音乐或落点；
- 不能替代 still / final 阶段的观看、聆听与采用记录。

## 5. 环境旁证（不影响上述结论）

本会话的 `pwsh` 工具在启动时失败：

```text
SetNamedSecurityInfoW failed (Win32 5): grantWrite(D:\CodingData\Github\AICartoonMaking\MotionAtlas_341)
```

这是 DSH 在 Windows 上为工作区设置写权限时被文件系统拒绝，属于**会话环境问题**，不是 Skill 加载失败。本次改用 `read` / `write` 文件工具与 `ctx_execute`（MCP 沙箱）完成只读检查、Python 脚本与哈希计算；没有修改任何 ACL，也没有降低安全设置。详见 `STATUS.md` 的“环境问题”一节。
