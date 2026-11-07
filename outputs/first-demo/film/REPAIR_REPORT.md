# FILM 返修报告（P1 修复）

- **状态：SOURCE REPAIR READY / HOST RERENDER PENDING**
- 项目：MotionAtlas_341 · MA341-DEMO-001
- 阶段：final · 无声画锁返修
- 日期：2026-11-06（Asia/Shanghai）
- 结论：已修复三个 P1 的源码根因，并扩展测试到 **36,041 checks PASS**；尚未在 Chrome 中重渲，不能宣称 FINAL PASS。

## 1. 保护原始失败证据

修改前源码已备份：

- 目录：`film/_backup_pre_p1fix_20261106_2250/`
- 备份 SHA：
  - `film.html` `e6826c13b15d9ac1000e8f87d81c83866ac553318c1edf94ee44ffc5ff54b04a`
  - `timeline.js` `b4edd73021b1ffd6a25c3f9fca6d1c8f759cb924869fc9f10c1225f9fc042cd5`
  - `capture-frames.cjs` `56823d09b9e840be495fd0e94f54c88c48a4a10f79a23ff7ca5c76223b027ea8`

旧 450 帧、旧 `frame-manifest.json`、旧 MP4、旧 contact/still-compare **均未清理、未覆盖**。宿主重新渲染前必须按 `HOST_RENDER_GUIDE.md` 第 0 节把旧产物移入 `FAIL_P1_EVIDENCE_20261106/`。

## 2. 三个 P1 的根因

### P1-1 · S05 相机与 UI 裁切

根因：

- `CAM_KEYS` 在 8.4s 仍为 S04 close-up `(860,840,1.40)`，直到 11.5s 才回到 1.0；
- ticket 从 8.4s 渐显、panel 从 8.5s 出现，但相机在 8.6–10.4s 仍太近；
- UI 是世界坐标，没有做投影后的可视安全区检查。

修复：

- 增加 **8.7s `(960,620,1.18)`**、**9.0s `(960,600,1.05)`** 两个宽景 keyframe；
- `ticketAlpha` 的 S05 渐显改为 **8.95–9.20s**；
- `panelAlpha` 改为 **8.90–9.05s**，保证 9.05s 首行证据出现时承载面板已经存在；
- `scanAt` 仍从 8.6s 开始，8.6–8.9s 只出现扫描线/粒子，不出现被裁面板；
- 新增测试：把 ticket `(240,120)-(860,440)`、panel `(1330,200)-(1650,540)` 逐帧投影到屏幕，检查 258–345 帧完整落在可视区。

### P1-2 · S04 冻结时序错误

根因：

- 6.4–6.65s 没有任何全局冻结机制；相机、ticket fade、done stamp、gap 都在继续变化；
- 7.8–8.4s camera 被设为同一个 1.40，且 S04 没有粒子层，导致 7.9–8.2s 整帧没有时间变化，形成 10 帧完全重复；
- S04 的 done stamp 在 6.4–6.8s 还在变化，gap 在 6.3–6.9s 还在增长，无法在 6.4s 进入全静止。

修复：

- 新增 `FREEZE = {start:6.4,end:6.65,at:6.4}` 与 `effectiveTime(t)`；`stateAt(t)` 在 6.4≤t<6.65 统一使用 6.4s 的视觉状态，`frozen:true`；相机、工件、票、章、gap、粒子、header、closing 等全部随之冻结；
- `CAM_KEYS` 增加 6.65s，与 6.4s 相同的 `(1000,620,1.0)`，6.65s 后平滑恢复；
- ticket 在 **6.15–6.35s** 完成隐藏；
- done stamp 在 **6.3–6.4s** 落到 0.58，6.4s 后保持；
- gap 在 **6.25–6.4s** 到 1，6.4s 后保持；
- arm 在 6.4s 已 alpha=0；
- S04 header 改为 **6.65–6.9s** 淡入，避免 6.65s 边界跳变；
- 7.8s camera 改为 `(870,830,1.35)`，8.4s 到 `(860,840,1.40)`，恢复真实慢推；
- S04 加回 1400 点 spec 粒子，避免 7.9–8.2s 再次成为死帧。

> 6.4–6.65s 现在是有意的 8 帧全静止（frame 192–199）；7.9–8.2s 不再有 10 帧完全重复。

### P1-3 · B3 粒子层缺失

根因：`film.html` 的 `renderAt()` 只画了 S05 扫描/接触/溶解、S06 dashed 幽灵轮廓和 S07 下划线；没有调用 S01/S02/S03/S04/S06 的粒子层。S06 的 `drawGhostGear()` 只是虚线，不是 1800 点。

修复：

- 在 `timeline.js` 增加统一 `PARTICLE_BUDGET` 与 `particleLayersAt(t)`，作为预算/区间真源；
- `film.html` 增加：
  - S01 500 点目标环；
  - S02 300 点运动拖尾（`particleTrail`，按 `gearAt(t-age)` 采样）；
  - S03 400 点目标环 + 80 点接触粒子；
  - S04 1400 点规格/核验粒子；
  - S05 扫描从 900 提高到 **2600**；接触 1800、溶解 900 保留；
  - S06 1800 点幽灵齿轮 + 600 点纠正路径（`particleArc`），与 dashed 轮廓叠加；路径 alpha 跟随 `ghostGearAlpha`，避免 12.3s 突然出现；
  - S07 600 点下划线保留并增强。
- 所有粒子使用固定 seed；S04 粒子在 freeze 窗口内随 `stateAt(6.4)` 静态。
- 未重复绘制同一层；预算与区间由 `test-timeline.cjs` 检查。

## 3. P2 处理

| P2 | 处理 |
|---|---|
| S04 卡尺压“完成”章 | 右卡尺 `1030→1000`，与印章左边界 1040 留出 40px |
| S07 机械臂靠近 `+23°` | 13.2s/15s hover 位改为 elbow `(1380,330)`、wrist `(1290,405)`、tip `(1240,455)`，右上移 |
| S07 下划线偏淡 | 基线 alpha .30/线宽 1.5；粒子 1.8–3.6px、alpha .55–.95、sizeScale 1.3 |
| S05 暗场层次 | 保持 0.62，不压暗到影响票据/面板；面板与章在暗场后绘制 |

## 4. 文件与版本

| 文件 | 修改前 SHA | 修改后 SHA | 字节 |
|---|---|---|---|
| `film/film.html` | `e6826c13…` | `6a367ff4f8180f2cd0f05fea0a0478e94c1bb465d40dc46ed1ed09afb987206c` | 55,641 |
| `film/timeline.js` | `b4edd730…` | `2a07279233b0c899b7ae8ef417b42494563e7322ae663f3b84032605358b4485` | 14,076 |
| `film/capture-frames.cjs` | `56823d09…` | `da6b20c7c1b19790fc9cb4d9f374c78a218f0500aa140fd7c6824e01a97da6bd` | 22,661 |
| `film/test-timeline.cjs` | `31b46889…` | `870663710484e1b730cf2a419a2f8794b5ec31b4a0fd99de0b17f4280df8b979` | 20,196 |
| `film/test-runtime.cjs` | `aadb5963…` | `c75f9ae3f9016976e1360c367061d0cc518f0eec2df2169a7a74ca2695979308` | 4,608 |

旧 MP4 SHA（失败证据，未覆盖）：`435d5cfbf584e7c78f349340b91b0f5f8c38cade989d59240c293ae651852db9`。

## 5. 实际测试记录

执行于 DSH（未启动 Chrome）：

| 命令 | 结果 |
|---|---|
| `node --check`（film 内联脚本） | **exit 0** |
| `node --check timeline.js` | **exit 0** |
| `node --check capture-frames.cjs` | **exit 0** |
| `node test-timeline.cjs` | **PASS 36,053 checks** |
| `node test-runtime.cjs` | **PASS 25 seeks**；freeze state equal；budget OK |
| `node capture-frames.cjs --smoke-particles --dry-run` | **exit 0；guardBypassed=true；25 帧计划** |
| PowerShell Parser（encode-film.ps1，未改） | 之前已通过；本轮未改 |

新增覆盖：

- 192–199 的冻结视觉状态完全一致，6.65s 边界无跳变；
- 7.9–8.2 相机与视觉状态不同，帧 200 冻结解除；
- S05 258–345 帧的票据/面板屏幕安全区；
- S01–S07 粒子预算与启用区间；
- 6 张 STILL 时间点状态；
- 450 帧无 NaN/Infinity/无效缩放；
- 事件边界、相机 keyframe 排序。

## 6. 宿主冒烟验证点（重渲后）

必须实际查看：

1. frame **192–199**（6.4–6.65s）：应有 8 帧完全一致的冻结；这是有意冻结。
2. frame **237–246**（7.9–8.2s）：不得再出现 10 帧完全相同；应看到 7.8→8.4 的慢推和 S04 粒子。
3. S05：**258、267、270、276、285、294、303、312、330、336**；票据与 VLM 面板不得裁切，VLM 标题不压票。
4. S01/S02/S03/S04/S06：frame **54、90、120、180、234、381**；粒子层应可见，且不是重复绘制的过曝。
5. S07：frame **438、449**；手臂不抢 `+23°` 标注，主句与下划线可读。
6. P2：frame **234** 卡尺与“完成”章不再相交。

## 7. 宿主重渲命令

先归档，见 `HOST_RENDER_GUIDE.md` 第 0 节。归档后：

```powershell
cd "D:\CodingData\Github\AICartoonMaking\MotionAtlas_341\outputs\first-demo\film"

node .\capture-frames.cjs --smoke
node .\capture-frames.cjs
powershell -ExecutionPolicy Bypass -File .\encode-film.ps1
node .\build-contact-sheet.cjs
node .\build-still-compare.cjs
```

`capture-frames.cjs` 现在会拒绝在未归档旧 `frames/` 上直接重渲；`--resume` 在源码 SHA 变化时也会拒绝旧帧。

## 8. 未验证风险

- **未在真实 Chrome 中重渲**：以上均为静态/Canvas mock 测试，不是像素验收。
- S05 8.4→8.7→9.0 的快速拉远可能感觉偏快，需要看真实帧后再决定是否改为 8.8/9.1。
- 新增 2600 扫描 + 1800 接触 + 900 溶解 + S06 2400 粒子可能增加宿主导出耗时；需观察。
- 6.4–6.65s 的 8 帧全静止是有意设计；若作者觉得过长，可缩短到 6.4–6.6，但必须保持“全元素冻结”。
- 旧 MP4/旧帧仍是 FAIL 证据；未经宿主重渲，不能声称 FINAL PASS。

## 9. 第二次 FINAL 实看结果（2026-11-06 23:10）

新版 450 帧/MP4 已由宿主生成（MP4 `727348a0…`，manifest source `a8db9c…`）。

- **P1-1 S05 裁切：PASS**。frame 258/267/270/276/285/294/303/312/330/336 中票据与面板均完整；9.2s 后无裁切/碰撞。
- **P1-2 S04 冻结：PASS**。唯一重复组为 192–199（8 帧，有意）；237–246 不再重复；7.8–8.4 慢推连续。
- **P1-3 B3 可见性：FAIL**。frame 54/90/120/180/381 实际像素中，S01/S02/S03/S06 粒子仍不可辨认；S06 仍主要读作虚线幽灵；S04/S05/S07 粒子可见。
- 因此第二次 FINAL 仍判 **FAIL（P1-3 残留）**，不能进入作者人工验收通过；最小修复建议见 `FINAL_REPORT.md` 第 4 节。
- 本次未修改 450 帧、MP4、源码或接触表；未启动 Chrome。

## 10. P1-3 可见性源码补丁（2026-11-06 23:20）

已实际修改源码（不是只写报告）：

- `film.html`：`particleRing` 增加尺寸/alpha 参数；S01 半径 178、S03 半径 176；S02 `particleTrail` 改为运动方向拖尾并移到机械臂之后；新增 `ghostGearPoints`，S06 74% 点落在 118–142 外环带；S06 路径点尺寸/alpha 提高。
- `timeline.js`：S02 粒子启用区间改为 2.8–4.4。
- `capture-frames.cjs`：新增 `--smoke-particles`（独立 `particle-smoke/`、`particle-smoke-manifest.json`、`review.html`、25 帧全双渲）与 `--dry-run`；参数在正式 frames/ 防覆盖检查之前识别。
- 未改 S04 冻结、S05 安全区、S07 排版、S04/S05/S07 粒子参数。

新 SHA：

- `film.html` `8b5f4357e499aaec4fdccc65a2d5240535d331067eb5084416cfe08c3d760e0e`
- `timeline.js` `a55b3d8c74dfa98eec1d56cfe28dc4851d2c55d47aaafa7d616397bfb5f291af`
- `capture-frames.cjs` `f6e2cd5946c547bfe0a3d31bd9ccf2f16f36ef98a8b1985783d824076d67725d`
- `test-timeline.cjs` `6b398db4a79179901a9123a692b301fa6709be005614c496785ad453fc84526c`

测试：`test-timeline` 36,053 checks PASS；`test-runtime` 25 seeks PASS；`--smoke-particles --dry-run` 在现有 450 帧存在时返回 `guardBypassed:true` 且计划 25 帧。

**仍未在 Chrome 中生成粒子专项像素；状态为 SOURCE REPAIR READY / HOST PARTICLE QA PENDING。**

## 11. 第三轮粒子专项实看结果（2026-11-07 00:20）

宿主已生成 25/25 粒子专项 PNG（manifest `fbb6887f…`，source `8b5f4357…`）。

- 25/25 帧 1920×1080、可解码、SHA/bytes 与 manifest 一致；
- 25/25 双重渲染 SHA 一致；唯一重复组 `[192,195,199]` 是 S04 冻结；
- S01 PASS：30/54 外侧点环清楚；
- S02 **PARTIAL**：75/90 未运动无拖尾正常，105/120 点太少、方向/密度不足；
- S03 PASS：150/165/180/189 点环/接触点可见；
- S04 PASS：冻结/解冻/核验粒子无回归；
- S05 PASS：270/300 面板无裁切，270 正文短暂为空（P2）；
- S06 **PARTIAL**：1800 点外环可见，但白色虚线仍是主要幽灵形状，未形成齿形粒子轮廓；600 路径偏弱；
- S07 PASS：438/449 主句、印章、机械臂避让正常。

判定 **PARTICLE SMOKE QA FAIL / FULL RENDER NOT APPROVED**；不执行 450 帧重渲。完整证据见 `PARTICLE_SMOKE_QA.md`。

## 12. S02/S06 最小返修（2026-11-07 00:30）

针对上一次粒子专项的 S02/S06 PARTIAL：

- **S02 `particleTrail`**
  - 用 `gearAt(t)` 与历史点求速度、切线、法线；
  - `speed<0.35` 不绘制假拖尾；
  - `u=pow(r,1.7)` 形成头密尾疏；
  - `back=8+28u`、横向 16–50 形成长度/宽度渐变；
  - `nearArm` 跳过机械臂 52px 内；
  - 300 点，2.0–4.4px，alpha .35–.90。
- **S06 `ghostGearPoints`**
  - 12 个齿扇区：62% 齿顶 124–144、20% 齿根 100–118、18% 齿侧 112–142；
  - 1800 点，2.0–4.0px，alpha .45–.85；
  - 虚线 alpha 降至 .42/.55，仅辅助；
  - 600 路径点 2.4–4.4px / .50–.85。
- **诊断**
  - `window.__particleDiagCapture(t,target)`：A 正常、B 只关目标粒子、C 像素差；ROI 由相机投影；
  - `--diagnose-particles` 输出 16 个 A/B/C 帧；
  - `--smoke-particles --tag=p1fix2` 输出 34 帧，版本隔离，保留旧 `particle-smoke/`。

新 SHA 与测试见 `FINAL_REPORT.md`。状态 **SOURCE REPAIR READY / PARTICLE SMOKE RE-RENDER PENDING**；尚未在 Chrome 重渲。

## 13. 第四轮 p1fix2 实看结果（2026-11-07 00:40）

p1fix2 34 帧已由宿主生成（source `8175af…`）：

- 34/34 PNG 1920×1080、可解码、SHA/bytes 与 manifest 一致；
- 34/34 双重渲染 SHA 一致；唯一重复组 `[192,195,199]` 为 S04 冻结；
- **S02 正常画面 PASS**：105/114/120 有明显向右后方点带，头密尾疏，方向可读；
- **S06 FAIL**：375/381/384/390/396/399 仍是均匀外环/光晕，12 齿顶、齿谷不可辨；虚线仍承担主要齿形；
- S01/S03/S04/S05/S07 无回归；
- **`particle-diagnostics/` 为空，A/B/C 0/48，manifest 不存在**。

判定 **PARTICLE SMOKE QA FAIL / FULL RENDER NOT APPROVED**。最小修复：S06 将 80–85% 点集中到 12 个齿顶帽（sector ±0.20step，半径 130–144），留出 sector 边界空白；先跑 `--diagnose-particles` 再跑 `--smoke-particles --tag=p1fix3`。不执行 450 帧全量重渲。

## 14. P1FIX3 S06/诊断返修（2026-11-07 00:45）

- S06 根因：p1fix2 的 20% 齿根 + 18% 齿侧填满 sector，角度密度连续，形成均匀圆环。
- 新 `ghostGearPoints`（已移入 `timeline.js`，film 调用 `TL.ghostGearPoints`）：
  - 84% 齿帽：中心 ±0.20step，半径 130–144；
  - 10% 齿根：中心 ±0.275step，100–112；
  - 6% 齿侧：±0.38–0.48step，112–132；
  - 谷区低密度；1800 点固定 seed。
- `page.evaluate` 从 3 个参数改为单对象：
  ```js
  page.evaluate(({t,target}) => window.__particleDiagCapture(t,target), {t, target})
  ```
- 诊断校验 A/B/C PNG、帧号、48 文件、active diff；入场零差异不误判。
- 版本隔离：`particle-diagnostics-p1fix3/`、`particle-smoke-p1fix3/`。
- 测试：`test-timeline` **36,079 checks PASS**；`test-runtime` 25 seeks PASS；两个 dry-run `guardBypassed:true`。

新 SHA 见 `FINAL_REPORT.md`。状态 **SOURCE REPAIR READY / P1FIX3 HOST QA PENDING**；未在 Chrome 重渲，不是 PASS。

## 15. p1fix3 实看结果（2026-11-07 00:50）

p1fix3 已在宿主生成：

- `particle-smoke-p1fix3/` 34/34 PNG，34/34 双重 SHA，32 唯一帧；`[192,195,199]` 冻结。
- `particle-diagnostics-p1fix3/` 16 组 / 48 PNG；complete；active S02 2439 / S06 6068。
- 所有图像 1920×1080、SHA 匹配；两个 review 引用无缺失。

判定：

- **S02 PASS**：96–126 拖尾可见，90/132 入场/退场 0 diff 合理；无回归。
- **S06 FAIL**：正常 A 图中 12 个粒子簇贴在实体齿轮齿顶/轮缘，缺少径向齿侧；C 图可见 12 cap，但 A 图未形成独立十二齿幽灵轮廓。齿帽 130–144 与实体齿重叠、目标 0° 与实体 -23° 最近齿仅约 7°，是空间重叠根因。
- S01/S03/S04/S05/S07 无回归。
- 无新增 P0/P1；P2 为 S05 #270 正文短暂为空、S07 下划线偏淡。

最小修复：S06 齿帽外移到 **150–166**，加 12 组径向齿侧 128→160，保留 1800 点、固定 seed、600 路径，不增加 alpha；重跑 p1fix4 诊断与专项。**不批准 450 帧全量重渲。**

## 16. P1FIX4 空间分离返修（2026-11-07 10:00）

p1fix3 S06 失败根因：实体齿轮 R=138、中心 (955,645)，幽灵中心 (940,660)、目标 0°；齿帽 130–144 与实体齿重叠，且最近齿仅差约 7°。

p1fix4：

- 齿顶：55%，中心 ±0.20step，**166–172**；
- 齿侧：35%，每齿固定 ±0.32step，**156–168**，形成左右径向连接；
- 齿根：10%，中心 ±0.36step，152–160；
- 1800 点、固定 seed、2.2–4.2px、alpha .50–.85；谷区留白；
- 虚线扩到 126/172，alpha .38，仅辅助；
- 600 路径 176→178；
- 新增“目标轮廓 · 示意外扩”说明，声明不是实际尺寸变化。

屏幕测试（12.7s）：实体外圆屏半径 131.3px；幽灵齿帽屏半径约 158–164px；齿帽最小间距 **6.56px**；**1747/1800（97.1%）** 粒子在实体外圆之外；12 齿每齿 68–96 点、左右齿侧 >10 点；最右粒子 x=1102.2，A 座文本起点 1110。

测试：`test-timeline` **36,089 checks PASS**、runtime 25 seeks PASS；p1fix4 dry-run 全部 `guardBypassed:true`。

状态 **SOURCE REPAIR READY / P1FIX4 HOST QA PENDING**；未在 Chrome 重渲，不是 PASS。

## 17. p1fix4 视觉 PASS（2026-11-07 10:15）

p1fix4 已由宿主真实渲染：

- `particle-smoke-p1fix4/`：34/34 PNG，34/34 双重 SHA，32 唯一帧，`[192,195,199]` 冻结。
- `particle-diagnostics-p1fix4/`：16 组 / 48 PNG；complete；active S06 6372。
- 所有图像 1920×1080、SHA 匹配；review 引用无缺失。
- source `6a367ff4…` / timeline `2a072792…`，与 manifest 一致。

视觉结论：

- **S06 PASS**：正常 1920×1080 A 图中，幽灵粒子外圈与实体齿轮有明显间隙；12 个齿帽可数，左右有径向齿侧，齿谷留白；600 路径独立；标签“目标轮廓 · 示意外扩”可读且未碰撞 `A 座`、`+23°`、`6.2 mm`；仍保留“未完成/待执行”，未暗示完成。
- **S02 PASS**：96–126 拖尾保持；90/132 为入场/退场 0 diff。
- S01/S03/S04/S05/S07 无回归；S04 冻结、S05 面板、S07 主句均正常。
- 无新增 P0/P1；P2 为 S05 #270 正文短暂为空、S07 下划线偏淡、S06 外扩说明字号较小。

判定 **PARTICLE SMOKE VISUAL QA PASS / FULL RENDER APPROVED**。仅批准重新生成 450 帧及 MP4；不代表 FINAL 自动验收。未执行生产重渲。

## 18. 正式 450 帧 FINAL AUTO QA（2026-11-07 10:15）

宿主已完成正式重渲与编码，自动验收结果：

- 正式 `frames/`：**450/450 PNG**，1920×1080，全部可解码；
- 450/450 字节数 + SHA256 与 `frame-manifest.json` 匹配；
- 18/18 重复样本一致；
- 192–199 八帧同 SHA，冻结正确；
- 237–246 十帧 SHA 全不同，慢推正常；
- 正式 105/381 与 p1fix4 专项同 SHA，无混帧；
- `frame-manifest.json` `a0e0d002…`；
- 最终 MP4 `ab039c173f6f9c972da44d468af21265d36376418ef5027d449cbb1b11adebd6`，7,612,522 B；
- ffprobe：H.264 High、yuv420p、1920×1080、30fps、450 帧、15.000s、无音轨；
- ffmpeg 解码 exit 0；
- contact-sheet 336 引用、still-compare 12 引用，均 missing=0；
- 旧 FAIL 归档 3 套，各 450 PNG + 1 MP4。

七场景关键帧实看：S01/S02/S03/S04/S05/S06/S07 全部 PASS；无新增 P0/P1。P2：S05 #270 空体、#285 部分填充；S07 下划线偏淡；S06 外扩说明字号偏小。

判定 **FINAL AUTO QA PASS / HUMAN ACCEPTANCE PENDING**。作者人工完整播放尚未发生；未修改成片、未重渲、未加音乐、未部署、未推 GitHub。
