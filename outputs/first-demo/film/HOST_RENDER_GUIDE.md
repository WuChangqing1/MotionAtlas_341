# MA341-DEMO-001 · Picture-lock 宿主渲染指南

> **必须在普通 Windows PowerShell（Medium integrity）中运行。**
> 不要在 DSH 的 `workspace-write` / Low 沙箱里运行；Chrome 在 Low 下会因命名管道/缓存访问失败。
> 本阶段只做无声画锁：不生成音乐、不加口播。

## 0. 先归档 FAIL 证据（不要覆盖）

第一次 FINAL FAIL 的 450 帧、manifest、MP4、contact sheet、still-compare 和 encode-report 都必须保留。先把它们移入独立归档目录，再重渲：

```powershell
cd "D:\CodingData\Github\AICartoonMaking\MotionAtlas_341\outputs\first-demo\film"
$archive = "FAIL_P1_EVIDENCE_20261106"
New-Item -ItemType Directory -Force -Path $archive | Out-Null
foreach ($name in @('frames','frame-manifest.json','MA341-DEMO-001-picture-lock.mp4','contact-sheet.html','still-compare.html','encode-report.json')) {
  if (Test-Path -LiteralPath $name) { Move-Item -LiteralPath $name -Destination (Join-Path $archive $name) }
}
```

归档后 `frames/` 必须为空/不存在；`capture-frames.cjs` 现在会拒绝在未归档的旧帧目录上直接重渲。旧 MP4 仍在归档目录，不要删除。

## 0.1 先确认

```powershell
cd "D:\CodingData\Github\AICartoonMaking\MotionAtlas_341\outputs\first-demo\film"
Get-FileHash .\film.html, .\timeline.js -Algorithm SHA256
node --version
```

当前源码基线：

- `film.html` SHA256：`6a367ff4f8180f2cd0f05fea0a0478e94c1bb465d40dc46ed1ed09afb987206c`
- `timeline.js` SHA256：`2a07279233b0c899b7ae8ef417b42494563e7322ae663f3b84032605358b4485`

## 0.2 粒子专项冒烟（不碰正式 frames）

已有 `particle-smoke/`、`particle-smoke-p1fix2/`、`particle-smoke-p1fix3/` 是历史证据。新一轮必须用 `p1fix4` 版本隔离：

```powershell
cd "D:\CodingData\Github\AICartoonMaking\MotionAtlas_341\outputs\first-demo\film"
node .\capture-frames.cjs --smoke-particles --tag=p1fix4
```

输出：

- `film\particle-smoke-p1fix4\frame_XXXXXX.png`（34 帧）
- `film\particle-smoke-p1fix4\review.html`
- `film\particle-smoke-p1fix4-manifest.json`

## 0.3 粒子贡献诊断

```powershell
node .\capture-frames.cjs --diagnose-particles --tag=p1fix4
```

输出：

- `film\particle-diagnostics-p1fix4\S02_XXXXXX_A/B/C.png`
- `film\particle-diagnostics-p1fix4\S06_XXXXXX_A/B/C.png`
- `film\particle-diagnostics-p1fix4-manifest.json`
- `film\particle-diagnostics-p1fix4\review.html`

A = 正常正式 Canvas；B = 只关闭目标粒子层；C = A/B 像素差（仅诊断）。ROI 由当前相机投影确定。该模式不写 `frames/`。

脚本会把这两个 SHA 写进 manifest；源码一变，`--resume` 会拒绝混用旧帧。

脚本会把这两个 SHA 写进 manifest；源码一变，`--resume` 会拒绝混用旧帧。

## 1. 冒烟测试（先跑小样）

```powershell
node .\capture-frames.cjs --smoke
```

输出：

- `film\smoke\frame_000000.png` 等 12 张代表帧
- `film\smoke-manifest.json`

要求：

- 12 张全部 1920×1080；
- 每张渲染两次，SHA 与首帧一致；
- 无 pageerror、无 missing font。

> 冒烟通过只代表浏览器/Canvas 管线正常，不代表连续动作已通过审片。

## 2. 正式 450 帧

```powershell
node .\capture-frames.cjs
```

输出：

- `film\frames\frame_000000.png` … `frame_000449.png`
- `film\frame-manifest.json`（含 `sha256`、`sha256_repeat`、`bytes_repeat`、source/timeline SHA、18 个抽样帧）

要求：

- 450 帧、1920×1080、30fps；
- 18 个抽样帧两次重渲 SHA 全等；
- manifest `complete:true`。

若中途失败：

```powershell
node .\capture-frames.cjs --resume
```

`--resume` 会核对 `film.html` / `timeline.js` SHA；源码改过就拒绝续渲，必须删掉 `frames\` 与 `frame-manifest.json` 后重来。**禁止把旧版本帧混进新版本。**

## 3. 编码 MP4（无音频）

```powershell
powershell -ExecutionPolicy Bypass -File .\encode-film.ps1
```

输出：

- `film\MA341-DEMO-001-picture-lock.mp4`
- `film\encode-report.json`

脚本会先用 ffprobe 检查 h264 / 1920×1080 / yuv420p / 30fps / 450 帧 / 15 秒 / 无音轨；任一不符直接失败。编码命令成功不等于验收成功。

## 4. 接触表与 STILL 对比页

```powershell
node .\build-contact-sheet.cjs
node .\build-still-compare.cjs
```

输出：

- `film\contact-sheet.html`：每 15 帧、镜头边界两侧、24 事件邻帧
- `film\still-compare.html`：六张已验收 STILL 与同时间点 film 帧并排

用浏览器打开这两个 HTML，实际检查：

- 闪屏、跳位、图层突然消失；
- 机械臂动作、齿轮、印章是否连续；
- 字幕位置/出现时间；S04 无裁切票；S05 标题不压票；S06/S07 纠正文字不压票；“未完成”不出圆章；S07 主句可读；
- B3 粒子/扫描无跳变；O63 纸面与色调统一；
- 最终主句停留足够阅读；
- 不存在空白帧或非预期完全重复帧。

**接触表不能替代连续播放。** 如果无法在 DSH 中观看，必须在宿主浏览器中人工验收并记录。

## 5. 当前不允许

- 不在 DSH Low 中启动 Chrome/Playwright。
- 不安装 Remotion。
- 不生成音乐/音效/口播。
- 不修改服务器、不部署、不推送 GitHub。
- 不在 450 帧和 MP4 通过实际验收前宣称 FINAL 完成。
