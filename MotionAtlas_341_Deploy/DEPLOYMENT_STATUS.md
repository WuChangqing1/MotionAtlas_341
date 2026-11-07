# DEPLOYMENT STATUS · Motion Atlas 341 Workbench

- **状态：WORKBENCH DEPLOYED / QA PENDING**
- 公开地址：<https://ccqspace.site/animation/>
- 成功案例：<https://ccqspace.site/animation/showcase/>
- 发布版本：`20261107T1250Z-workbench`
- 总首页卡片：`motion-atlas-341` → `/animation/`，已渲染；`/opt/exercises/instance/products.yaml`，未重启 exercises.service。
- 发布目录：`/var/www/motion-atlas-341/releases/20261107T1250Z-workbench`
- 旧 release：`/var/www/motion-atlas-341/releases/20261107T042005Z-ab039c173f6f`
- 341 风格 / 193 静帧 / 8 条不完整原文标记。
- 示例 ZIP：`web/downloads/MotionAtlas-Task-MA341-EXAMPLE-B3-O63.zip`；公网 SHA256 `698d34122b83c15b449b6ec94e4987603fb4b1c8c4ded28b7bc75d71c56aa1cc`。
- 旧视频 SHA256：`ab039c173f6f9c972da44d468af21265d36376418ef5027d449cbb1b11adebd6`。
- Nginx 路由未改；`nginx -t` 通过；18093 仅 loopback。
- 未完成：真实浏览器交互、浏览器内 ZIP 下载、桌面/手机布局（本机无 Playwright Chromium，系统 Chrome 被沙箱拒绝 spawn）。
- 报告：`docs/DEPLOYMENT_REPORT.md`、`docs/QA_REPORT.md`、`docs/ROLLBACK.md`。
