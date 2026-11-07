# EXPORT PACKAGE SPEC

## ZIP 入口
- `PROMPT_FOR_DSH.md`：以 `/fy-code-animation` 开头，包含 Skill 加载、风格库自检、模块、制作需求、角色组合、阶段、验收、边界。
- `RUN_WITH_DSH.md`：Windows 11 解压、PowerShell 命令、Skill 安装/加载、build/doctor/get、把 Prompt 交给 DSH、阶段授权、结果检查、故障排查。
- `README.md`
- `task.json` / `selected-styles.json` / `manifest.json`
- `styles/selected/<ID>.md`：真实原文，不截断。
- `references/<ID>.<ext>`：选中风格参考图（如存在）。
- `skill/SKILL_USAGE.md`、`skill/INSTALLATION.md`
- `LICENSES/`：风格库许可、Skill 许可、第三方 MIT 许可。

## 轻量模式
依赖本地完整 `fy-code-animation` 与 341 风格库；包内有选中原文、任务资料、调用说明、许可。适合已在 MotionAtlas_341 工作区的用户。

## 完整离线模式
额外包含：
- `style-library/风格提示词/` 全部 341 个 Markdown；
- `skill/fy-code-animation/` 完整 Skill（145 个文本文件；不含 __pycache__）；
- 选中风格参考图；
- 许可和 manifest。
用户把 `skill/fy-code-animation` 复制到目标 `.dsh/skills/`，即可按包内路径准备环境。

## 完整性
每个文件记录 bytes + SHA256；`manifest.json` 列文件清单。ZIP 使用 UTF-8 filename flag、CRC32、central directory；示例 B3+O63 ZIP 已通过 Python zipfile/testzip 与 manifest SHA 逐项校验。
