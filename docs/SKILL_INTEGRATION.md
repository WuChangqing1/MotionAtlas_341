# SKILL INTEGRATION

## 实际位置
- 项目级 Skill：`.dsh/skills/fy-code-animation/SKILL.md`
- 341 风格库：`./style-library/`，含 `风格提示词/` 341 个 Markdown。

## 已实际执行
- `style_library.py doctor --root ./style-library`：**ready**，prompt_count=341，library/index 一致。
- `style_library.py get --root ./style-library --query B3`：返回 B3 完整原文与 SHA。
- `style_library.py build` 在当前 DSH 只读文件策略下无法写 `adapters/style-index.json`（Permission denied）；现有索引已通过 doctor 校验。正常可写环境应重新 build。

## Prompt 中的调用契约
- 第一行 `/fy-code-animation`，但明确说明它只是入口。
- 要求 DSH 通过 skill 工具加载 `fy-code-animation`，或手动读取 SKILL.md；不得只凭文字声称加载。
- 要求读取 `decisions.md`、`workflow.md`、`meaning.md`、`style.md`、`engineering.md`、`qa.md`。
- 要求先 build/doctor/get 进行实际自检；doctor 失败必须停止。
- 按 card/still/audition/final 严格阶段授权。

## 限制
公网页面不调用 Skill、不执行 DSH，只导出 Prompt/ZIP；实际加载发生在用户本地 DSH。
