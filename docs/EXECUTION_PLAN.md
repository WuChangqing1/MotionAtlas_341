# 单 Prompt 成片实现计划

目标：选风格、写想法、复制一次 Prompt；DSH 自主完成分镜至 MP4，不要求用户补齐制作参数。

- [x] 统一 web/js/task-contract.js：task.json 和短 Prompt 共用字段；final 默认、自动角色、规格与声音策略。
- [x] 改造 app.js/index.html：主按钮直接复制成片 Prompt，高级参数可选，输入状态同步；按最新要求移除 ZIP 入口及打包运行代码。
- [x] tools/animate.py + animation/：单任务入口、doctor/原文 SHA 校验、纯时间场景、ffmpeg、manifest 和媒体 QA。
- [x] 两个示例任务：A1/A2、L42/V6；验证错误任务、SHA 篡改、阶段、真实 20 秒出片和重复渲染静帧 hash。
- [x] 浏览器检查实际复制/搜索/收藏/已选；保持 341 数据与旧视频 hash；记录机器/静帧/连续观看边界。
- [x] 仅提交本次源码与相关既有 V2 页面改动，保留其他用户改动；推送并原子切换新 release，无 Nginx 修改。

实施判断：内置渲染器只支持明示的 A1/A2、L42/V6 语法；其余风格由 DSH 实读原文后实现独立 renderer，不假称 341 风格已有通用自动渲染器。
验收重点：旧草稿迁移、表单同步、长文案/竖屏、缺失风格、SHA 篡改、错误规格、输出目录已有文件、ffmpeg 失败。
