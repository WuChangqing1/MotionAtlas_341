# Motion Atlas 341 — 宿主侧 Canvas 静帧导出工具

## 背景

适用于 `MA341-DEMO-001` 已有 `outputs/first-demo/renderer/still.html`，但 DSH `workspace-write` 的 Low 完整性沙箱中 Chrome/Chromium 进程启动失败的情况。

## 安装

1. 从 ZIP 解压 **压缩包内文件**到本地项目：

   `D:\CodingData\Github\AICartoonMaking\MotionAtlas_341\outputs\first-demo\renderer\host-tools\`

2. 用**普通 Windows PowerShell**（非 DSH 内的 pwsh，非管理员）运行：

   ```powershell
   cd "D:\CodingData\Github\AICartoonMaking\MotionAtlas_341\outputs\first-demo\renderer\host-tools"
   .\RUN-ON-HOST.ps1
   ```

3. 若 PowerShell 执行策略不允许运行 `.ps1`，可以在这个目录手工运行：

   ```powershell
   npm install --no-audit --no-fund --ignore-scripts
   node .\capture-stills.cjs
   ```

   不要求关闭系统执行策略。

本脚本使用现有系统 Chrome，启动失败则尝试 Edge；不下载 Playwright 自带 Chromium，也不修改 Windows ACL。Node 依赖 `playwright-core` 只安装在本工具目录。安装 npm 包需要可用的 npm registry。

## 输出

- `outputs/first-demo/stills/S01_01.80s.png` 等 6 张 PNG（真实浏览器 Canvas 导出）
- `outputs/first-demo/review.html`（六帧审片页面）
- `outputs/first-demo/render-manifest.json`（SHA256、大小、重复渲染一致性、错误等）

## 验证界限

- 必须读取 `still.html?t=...` 的时间点和 1920x1080 Canvas。没有 Canvas、尺寸不符或浏览器启动失败就退出，不伪造图像。
- 每帧重新加载同一个时间点两次并比较 PNG SHA256。若不一致，会导出真实图片供调试，同时以非零退出码提示。
- 若六帧完全一样会报疑似未支持 `?t` 的告警。
- 真实浏览器导出不代表动画视觉质量已经人工审查。
- 该工具以受信任的宿主用户权限运行；先审查 HTML/JS 代码，只运行你本人认可的本地工程。

## 兼容性提醒

`still.html` 需要已有 Canvas，且支持 `?t=秒数`。若它使用不同的初始化 API、多个 Canvas 层合成，或额外资源需要本地 HTTP 服务，脚本可能需要根据实际工程调整，不应假装导出成功。
