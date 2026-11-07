# 四案音乐方案 · 《完成之后》

- 项目 / 任务：MotionAtlas_341 · MA341-DEMO-001
- 阶段：card
- 画风：O63 装配日志 × B3 粒子核验层（统一融合）
- 预计总长：15.0 秒（450 帧 @30fps）
- 口播区间：无口播（当前默认；见 DECISIONS D005）
- 本次是否已授权生成：**否**。以下全是方案，未生成、未试听、未测量。
- 声音身份：无克隆声线；不涉及人声。音乐只承担结构、空气与节奏，音效承担材质与接触。

## 全片结构

| 段落 | 要表达的变化 | 画面事件 / 阅读窗 | 预计秒区间 | 能量 / 密度 / 留白 | 声音层分工 |
|---|---|---|---|---|---|
| S01 | 任务与约束建立 | 铅笔→水彩；任务票落稳 1.65 | 0.0–2.0 | 低 / 低 / 留纸声 | 音乐引入；铅笔、水彩、单音 |
| S02 | 执行开始，动作干净 | 入画、夹取、抬起 | 2.0–4.4 | 中 / 中 / 无 | 伺服节奏进入；clack 接住夹取 |
| S03 | 假完成成立 | 座落 5.50；“完成”章 5.95 | 4.4–6.4 | 中高 / 中 / 章后 0.3s | 假终止 + 印章 + 音乐盒 ding |
| S04 | 目检发现异常 | 全静止 6.4–6.65；缝/虚影 7.55；间隙 8.20 | 6.4–8.4 | 低 / 低 / 全片最大抽空 | 音乐只剩一条持续音；纸/卡尺 |
| S05 | VLM 证据与判决 | 扫描 8.6–10.4；三证据；溶解 10.95；判决 11.15 | 8.4–11.5 | 最高 / 高 / 判决前 0.2s | 扫描 tone、tick、gong；中频让位账本 |
| S06 | 纠正指令 | 弧线 11.75；幽灵锁定 12.70；机械臂 13.20 | 11.5–13.6 | 中 / 中 / 无 | 低脉冲回归；墨水/click/伺服 |
| S07 | 落点：未完成 | 主句 13.65；下划线 14.3；副句 14.4 | 13.6–15.0 | 低 / 低 / 1.15s 读窗 | 开放五度；翻纸；尾音 |

**音乐结构一句话**：先给一个“太顺”的假终止，再把音乐抽空，让 VLM 的扫描成为唯一推进；判决后不用胜利终止，只用低脉冲把“下一步”托住。

## 四案差异

| 维度 | A 纸页室内乐 | B 伺服与木鱼 | C 玻璃与呼吸 | D 野外录音与口弦 |
|---|---|---|---|---|
| 编制 / 音色 | 毛毡钢琴、大提琴、音乐盒、纸刷 | 预制钢琴、木鱼、干合成器、贝斯 | 玻璃琴、弓奏颤音琴、呼吸、颗粒 tick | 纸/风/房间、框鼓、口弦、低音单簧管 |
| 速度 / 拍号 / 时间 | 76 BPM，4/4，稳定 | 92 BPM，3+3+2，机械切分 | 自由时间约 60 BPM，无脉冲到扫描 | 84 BPM，6/8，呼吸感 |
| 动机 | 下行小三度 | 三音机械细胞 | 长悬置单音 | 口弦脉冲 + 单簧管短句 |
| 能量曲线 / 快段 | 中段渐密，扫描用 tick 推 | 扫描用 16 分琶音，最高 | 扫描前最空，扫描时颗粒最密 | 扫描用手鼓滚奏，中高 |
| 与口播关系 | 无口播；中频给纸面文字让位 | 无口播；切分不抢账本 | 无口播；高频 tick 控制密度 | 无口播；低频不盖 thud |
| 结尾 | 开放五度，动机未解决 | 单次低频，干收 | 空气 + 高泛音，悬置 | 翻纸 + 开放 drone |

四案在编制、节奏结构、动机、能量曲线、结尾方式上均有实质差异，不是同一提示词换 seed。

## 单案卡 A：纸页室内乐

- **方案 id / 名字**：A · 纸页室内乐（Paper Chamber）
- **表达意图**：让观众先相信这是一次顺利的装配；假终止越温暖，后面的抽空越冷。
- **为什么适合本文**：纸、铅笔、水彩的世界需要室内乐的呼吸；毛毡钢琴和纸刷把“手作记录”与“机械执行”放在同一空间。
- **取舍**：不用打击乐推高潮，S05 的紧张靠 tick 和低音持续，不靠鼓。
- **编配 / 主声部**：毛毡钢琴（主）、大提琴（中低）、音乐盒（高，少量）、纸刷/纸摩擦（氛围）。
- **节奏**：76 BPM，4/4；S02 起用八分音符的“步行”低音，S03 在 5.95 给一个完整的 IV–I 假终止；S04 抽到只剩大提琴长音；S05 用纸刷 + 钢琴高音 tick；S06 低音脉冲回归；S07 开放五度。
- **动机**：下行小三度（D–B♭–G），在 S01 出现，S03 假终止时转成大三度（D–F♯–A），S07 回到小三度但不解决。
- **口播让位**：无口播；S01/S05 账本阅读时把钢琴中频压薄，保留纸刷与低音。
- **结尾**：不解决；钢琴停在 D，大提琴停在 A，开放五度，尾音 0.8s。

| 预计时间意图 | 编配 / 密度变化 | 画面事件 id | 不能牺牲的阅读窗 | 可允许浮动的事件 |
|---|---|---|---|---|
| 0–2.0 | 钢琴单音 + 纸刷，极稀疏 | E01/E02 | 任务票 1.65 后 0.35s | E01 可与水彩同步 ±0.1 |
| 2.0–4.4 | 低音步行 + 大提琴进入 | E03/E04/E05 | 无 | E03/E05 ±0.08 |
| 4.4–6.4 | 渐密，5.95 假终止 + 音乐盒 | E06/E07 | 章后 0.35s | E06 ±0.05，E07 固定 |
| 6.4–8.4 | 抽空，只剩大提琴长音 + 卡尺 | E09/E10/E11 | 间隙 0.4s | E10 ±0.1 |
| 8.4–11.5 | 纸刷 tick 渐密，11.15 低 gong | E12–E17 | 判决 0.35s | E13–E15 可吸附扫描 ±0.04 |
| 11.5–13.6 | 低音脉冲 + 钢琴碎片 | E19/E20/E21 | 纠正 0.55s | E20 ±0.05 |
| 13.6–15.0 | 开放五度，尾音 | E22/E23/E24 | 主句 1.15s | E22 固定，E24 ±0.1 |

完整英文 caption：

> Instrumental, warm and precise chamber-folk score for a 15-second hand-drawn robot-assembly journal. Felt piano, muted cello, small music box, brushed paper percussion and a soft room tone; 76 BPM in 4/4, D minor. A descending minor-third motif on piano opens over paper texture, gains a quiet cello counterline as the arm moves, and arrives at a deliberately too-early warm cadence when the done stamp lands. The middle thins to a single sustained cello and music-box harmonics for the inspection, then a dry ticking pulse and low pizzicato build through the VLM scan. At the failed verdict the pulse stops on a low muted gong; a slow low-register pulse returns for the correction and ends on an open fifth with the piano opening motif unresolved. Leave the midrange clear for short on-screen Chinese text. Avoid triumph, dense percussion, bright synth leads and a clean major cadence.

SPEC 草稿：

```json
{"caption":"Instrumental, warm and precise chamber-folk score for a 15-second hand-drawn robot-assembly journal. Felt piano, muted cello, small music box, brushed paper percussion and a soft room tone; 76 BPM in 4/4, D minor. A descending minor-third motif on piano opens over paper texture, gains a quiet cello counterline as the arm moves, and arrives at a deliberately too-early warm cadence when the done stamp lands. The middle thins to a single sustained cello and music-box harmonics for the inspection, then a dry ticking pulse and low pizzicato build through the VLM scan. At the failed verdict the pulse stops on a low muted gong; a slow low-register pulse returns for the correction and ends on an open fifth with the piano opening motif unresolved. Leave the midrange clear for short on-screen Chinese text. Avoid triumph, dense percussion, bright synth leads and a clean major cadence.","duration":15,"bpm":76,"keyscale":"D minor","timesignature":"4","seeds":[11],"thinking":true,"steps":8,"shift":3.0,"offload":false}
```

- 输出目录（未来）：`outputs/first-demo/audio/A/`
- 无法精确控制：段落秒点、逐拍同步、分轨、实际时长/速度；模型可能改写 caption；生成 BPM 不等于实测 BPM。
- 生成状态：未生成。

## 单案卡 B：伺服与木鱼

- **方案 id / 名字**：B · 伺服与木鱼（Servo & Woodblock）
- **表达意图**：把“机器的顺利”做成节奏陷阱：越顺，越像对；判决时一刀切断。
- **为什么适合本文**：机械臂的动作本身就是节奏源；3+3+2 让“完成”听起来有点不自然，但观众当时不会察觉。
- **取舍**：不用大鼓；低音只做支撑，避免变成工业预告片。
- **编配 / 主声部**：预制钢琴（主）、木鱼（节拍）、干合成器脉冲（伺服感）、贝斯（低）。
- **节奏**：92 BPM，3+3+2；S02 进入，S03 假终止用“少一拍”的剪切；S04 抽到伺服 hum + 一个失谐钢琴音；S05 16 分琶音 + 棘轮 tick；11.15 磁带停；S06 低 sub 脉冲 + 木鱼单击；S07 单次低频收。
- **动机**：三音机械细胞（E–G–B），在 S02 重复，S03 转成 E–G♯–B，S07 回到 E–G–B 但不解决。
- **口播让位**：无口播；S05 账本阅读时抽掉 2–4kHz 的合成器层。
- **结尾**：单次低频 thud，干收，无尾音。

| 预计时间意图 | 编配 / 密度变化 | 画面事件 id | 不能牺牲的阅读窗 | 可允许浮动的事件 |
|---|---|---|---|---|
| 0–2.0 | 预制钢琴单音 + 房间 | E01/E02 | 任务票 0.35s | E01 ±0.1 |
| 2.0–4.4 | 木鱼 + 伺服脉冲进入 | E03/E04/E05 | 无 | E03/E05 ±0.08 |
| 4.4–6.4 | 3+3+2 渐密，5.95 剪切式假终止 | E06/E07 | 章后 0.35s | E06 ±0.05 |
| 6.4–8.4 | 抽到 hum + 失谐音 | E09/E10/E11 | 间隙 0.4s | E10 ±0.1 |
| 8.4–11.5 | 16 分琶音 + tick，11.15 磁带停 | E12–E17 | 判决 0.35s | E13–E15 ±0.04 |
| 11.5–13.6 | sub 脉冲 + 木鱼单击 | E19/E20/E21 | 纠正 0.55s | E20 ±0.05 |
| 13.6–15.0 | 单次低频，干收 | E22/E23/E24 | 主句 1.15s | E24 ±0.1 |

完整英文 caption：

> Instrumental, mechanical but human workshop score for a 15-second robot-assembly film. Prepared piano, woodblock, dry analog synth pulses, servo-like low hum and upright bass; 92 BPM, felt as 3+3+2 in 4/4, E minor. A three-note mechanical cell on prepared piano starts with the arm and repeats with small variations; the groove locks when the gear is grasped and resolves on a clipped major chord at the false done stamp. The inspection drops to servo hum and a single detuned piano note. The VLM scan adds a fast 16th-note arpeggio and ratchet ticks, peaks, then cuts to tape-stop silence at the failed seal; a low sub pulse and one woodblock return for the correction, ending on a single low thud with no resolution. Leave room for short Chinese annotations. Avoid four-on-the-floor, big cinematic drums and cheerful chiptune leads.

SPEC 草稿：

```json
{"caption":"Instrumental, mechanical but human workshop score for a 15-second robot-assembly film. Prepared piano, woodblock, dry analog synth pulses, servo-like low hum and upright bass; 92 BPM, felt as 3+3+2 in 4/4, E minor. A three-note mechanical cell on prepared piano starts with the arm and repeats with small variations; the groove locks when the gear is grasped and resolves on a clipped major chord at the false done stamp. The inspection drops to servo hum and a single detuned piano note. The VLM scan adds a fast 16th-note arpeggio and ratchet ticks, peaks, then cuts to tape-stop silence at the failed seal; a low sub pulse and one woodblock return for the correction, ending on a single low thud with no resolution. Leave room for short Chinese annotations. Avoid four-on-the-floor, big cinematic drums and cheerful chiptune leads.","duration":15,"bpm":92,"keyscale":"E minor","timesignature":"4","seeds":[23],"thinking":true,"steps":8,"shift":3.0,"offload":false}
```

- 输出目录（未来）：`outputs/first-demo/audio/B/`
- 无法精确控制：3+3+2 只是 caption 意图，工具不保证实际分组；磁带停/剪切点不可精确到秒。
- 生成状态：未生成。

## 单案卡 C：玻璃与呼吸

- **方案 id / 名字**：C · 玻璃与呼吸（Glass & Breath）
- **表达意图**：把“检查”做成一次屏息；没有节拍可躲，观众只能看证据。
- **为什么适合本文**：纸面、水彩、VLM 的“看见”都适合玻璃泛音；空得越久，判决越重。
- **取舍**：扫描前几乎无节奏，可能让前 8 秒显得“静”；用纸声和呼吸维持生命感。
- **编配 / 主声部**：玻璃琴（主）、弓奏颤音琴（中）、呼吸/纸摩擦（氛围）、颗粒 tick（扫描）。
- **节奏**：自由时间约 60 BPM；S01–S03 只有长音和呼吸，S03 用一个音乐盒泛音标记假完成；S04 接近静音；S05 颗粒 tick 从 8.6 起加速、升高；11.15 一记低 gong + 静音；S06 心跳般低脉冲 + 玻璃三度上行；S07 空气 + 高泛音。
- **动机**：长悬置 A，S05 被 tick 切成碎片，S06 以 C–E 三度试探，S07 回到 A 但不解决。
- **口播让位**：无口播；全片保持中频空，给纸上文字留气口。
- **结尾**：空气、纸、未解决的高泛音；尾音 1.0s。

| 预计时间意图 | 编配 / 密度变化 | 画面事件 id | 不能牺牲的阅读窗 | 可允许浮动的事件 |
|---|---|---|---|---|
| 0–2.0 | 玻璃长音 + 呼吸 + 纸 | E01/E02 | 任务票 0.35s | E01 ±0.15 |
| 2.0–4.4 | 颤音琴长音进入，无脉冲 | E03/E04/E05 | 无 | E03/E05 ±0.1 |
| 4.4–6.4 | 音乐盒泛音标记假完成 | E06/E07 | 章后 0.35s | E07 固定 |
| 6.4–8.4 | 近静音，纸/呼吸 | E09/E10/E11 | 间隙 0.4s | E10 ±0.1 |
| 8.4–11.5 | 颗粒 tick 加速，11.15 gong + 静音 | E12–E17 | 判决 0.35s | E13–E15 ±0.04 |
| 11.5–13.6 | 心跳低脉冲 + 玻璃三度 | E19/E20/E21 | 纠正 0.55s | E20 ±0.05 |
| 13.6–15.0 | 空气 + 高泛音 | E22/E23/E24 | 主句 1.15s | E24 ±0.1 |

完整英文 caption：

> Instrumental, airy and uneasy glass-and-breath score for a 15-second hand-drawn assembly journal. Glass harmonica, bowed vibraphone, breath, paper friction and granular ticks; free time around 60 BPM, A minor. A long suspended glass tone and a slow bowed vibraphone fifth open the page; the arm motion is accompanied only by breath and faint servo texture, with no pulse. A single music-box harmonic marks the false done stamp, then the score thins to near silence for the inspection. The VLM scan introduces dry granular ticking that accelerates and rises in pitch, then stops dead at the failed seal with one low gong. For the correction, a quiet heartbeat-like low pulse and a rising glass third return; the ending is air, paper and an unresolved high harmonic. Avoid melody, percussion before the scan, and sentimental strings.

SPEC 草稿：

```json
{"caption":"Instrumental, airy and uneasy glass-and-breath score for a 15-second hand-drawn assembly journal. Glass harmonica, bowed vibraphone, breath, paper friction and granular ticks; free time around 60 BPM, A minor. A long suspended glass tone and a slow bowed vibraphone fifth open the page; the arm motion is accompanied only by breath and faint servo texture, with no pulse. A single music-box harmonic marks the false done stamp, then the score thins to near silence for the inspection. The VLM scan introduces dry granular ticking that accelerates and rises in pitch, then stops dead at the failed seal with one low gong. For the correction, a quiet heartbeat-like low pulse and a rising glass third return; the ending is air, paper and an unresolved high harmonic. Avoid melody, percussion before the scan, and sentimental strings.","duration":15,"bpm":60,"keyscale":"A minor","timesignature":"4","seeds":[37],"thinking":true,"steps":8,"shift":3.0,"offload":false}
```

- 输出目录（未来）：`outputs/first-demo/audio/C/`
- 无法精确控制：自由时间不被工具真正支持，60 BPM 只是提示；玻璃琴音色可能被 LM 替换。
- 生成状态：未生成。

## 单案卡 D：野外录音与口弦

- **方案 id / 名字**：D · 野外录音与口弦（Field & Jaw Harp）
- **表达意图**：把“装配日志”做成真的野外笔记：有风、有纸、有人的呼吸，但机器仍然精确。
- **为什么适合本文**：O63 的“野外日记”血统；口弦的脉冲像心跳，也像伺服；框鼓给接触以重量。
- **取舍**：野外录音可能带来环境噪声，需控制密度；不用大弦乐，避免变成自然纪录片。
- **编配 / 主声部**：纸/风/房间（氛围）、框鼓（接触/节奏）、口弦（脉冲/动机）、低音单簧管（中低）。
- **节奏**：84 BPM，6/8；S02 框鼓轻进入；S03 假完成用框鼓单击 + 单簧管短句；S04 抽到纸/风；S05 手鼓滚奏 + 口弦颤音；11.15 低框鼓 + 静音；S06 口弦脉冲 + 单簧管；S07 翻纸 + 开放 drone。
- **动机**：口弦的 3 拍脉冲（强—弱—弱），S02 与机械臂同步，S05 被打散，S06 回到 3 拍但不解决。
- **口播让位**：无口播；S05 滚奏控制在中高频，给账本留低中频。
- **结尾**：翻纸 + 开放 drone，尾音 0.9s。

| 预计时间意图 | 编配 / 密度变化 | 画面事件 id | 不能牺牲的阅读窗 | 可允许浮动的事件 |
|---|---|---|---|---|
| 0–2.0 | 纸/风/房间 + 口弦单次 | E01/E02 | 任务票 0.35s | E01 ±0.12 |
| 2.0–4.4 | 框鼓轻进入 + 单簧管 | E03/E04/E05 | 无 | E03/E05 ±0.08 |
| 4.4–6.4 | 框鼓单击 + 单簧管短句 | E06/E07 | 章后 0.35s | E06 ±0.05 |
| 6.4–8.4 | 抽到纸/风，单簧管 ghost note | E09/E10/E11 | 间隙 0.4s | E10 ±0.1 |
| 8.4–11.5 | 手鼓滚奏 + 口弦颤音 | E12–E17 | 判决 0.35s | E13–E15 ±0.04 |
| 11.5–13.6 | 口弦脉冲 + 单簧管 | E19/E20/E21 | 纠正 0.55s | E20 ±0.05 |
| 13.6–15.0 | 翻纸 + 开放 drone | E22/E23/E24 | 主句 1.15s | E24 ±0.1 |

完整英文 caption：

> Instrumental, organic field-recording score for a 15-second hand-drawn robot-assembly film. Close-recorded paper, pencil, room air, frame drum, jaw harp and bass clarinet; 84 BPM in 6/8, G minor. A jaw-harp pulse and paper rustle establish the journal; a bass clarinet line and light frame-drum pattern enter with the robot arm, and a soft frame-drum accent marks the false done stamp. The inspection strips back to room air, pencil scratch and a single clarinet ghost note. The VLM scan builds a hand-drum roll and jaw-harp tremolo, then drops to a low frame-drum hit and silence at the failed seal. The correction returns with a slow jaw-harp pulse and clarinet; the film ends on a page turn and an open, unresolved drone. Avoid orchestral swells, whoosh transitions and triumphant major endings.

SPEC 草稿：

```json
{"caption":"Instrumental, organic field-recording score for a 15-second hand-drawn robot-assembly film. Close-recorded paper, pencil, room air, frame drum, jaw harp and bass clarinet; 84 BPM in 6/8, G minor. A jaw-harp pulse and paper rustle establish the journal; a bass clarinet line and light frame-drum pattern enter with the robot arm, and a soft frame-drum accent marks the false done stamp. The inspection strips back to room air, pencil scratch and a single clarinet ghost note. The VLM scan builds a hand-drum roll and jaw-harp tremolo, then drops to a low frame-drum hit and silence at the failed seal. The correction returns with a slow jaw-harp pulse and clarinet; the film ends on a page turn and an open, unresolved drone. Avoid orchestral swells, whoosh transitions and triumphant major endings.","duration":15,"bpm":84,"keyscale":"G minor","timesignature":"6","seeds":[41],"thinking":true,"steps":8,"shift":3.0,"offload":false}
```

- 输出目录（未来）：`outputs/first-demo/audio/D/`
- 无法精确控制：6/8 只是提示，工具默认拍号字段可能是“4”；环境录音不在生成器内，需要后期铺底。
- 生成状态：未生成。

## 音效表

| 事件 id | 对象 / 材质 / 力度 | 文件与许可 | 接触秒 / 基准 | peakOffset 秒与证据 | 播放开始秒 | gain / 轮换 / 密度 |
|---|---|---|---|---|---|---|
| SFX01 | 铅笔划纸，干、轻 | 待录制/待选，作者提供或自制 | 0.10–0.50 | 待测 | 待测 | -18dB 起，单次 |
| SFX02 | 水彩刷纸，软、湿 | 待选 | 0.60 | 待测 | 待测 | 低，单次 |
| SFX03 | 伺服 whir，连续，中 | 合成或待选 | 2.00–3.00 | 待测 | 2.00 | 随速度升调 |
| SFX04 | 夹爪 clack，干、短 | 待选 | 3.10 | 待测 | 3.10−peak | 单次 |
| SFX05 | 齿轮离架，金属轻响 | 待选 | 3.20 | 待测 | 3.20−peak | 单次 |
| SFX06 | 座落 thud，有重量 | 待选 | 5.50 | 待测 | 5.50−peak | 单次，低频 |
| SFX07 | 印章 press，木+纸 | 待选 | 5.95 | 待测 | 5.95−peak | 单次 |
| SFX08 | 纸纤维轻响 | 待选 | 6.30 | 待测 | 6.30−peak | 单次，轻 |
| SFX09 | 卡尺 tick，金属细 | 待选 | 7.20 | 待测 | 7.20−peak | 2 次，轮换 |
| SFX10 | 粒子 shimmer，低 | 合成/待选 | 7.55 | 待测 | 7.55 | 低，不盖字 |
| SFX11 | 扫描 tone，上滑 | 合成 | 8.60–10.60 | 待测 | 8.60 | 低，连续 |
| SFX12 | 证据 tick | 待选 | 9.05 / 9.45 / 9.85 | 待测 | 对应−peak | 3 次，轮换 |
| SFX13 | 假章溶解 shimmer | 合成 | 10.95 | 待测 | 10.95 | 单次，0.4s |
| SFX14 | 判决 gong，低频、闷 | 待选 | 11.15 | 待测 | 11.15−peak | 单次，长尾 |
| SFX15 | 墨水划纸，弧线 | 待选 | 11.75–12.30 | 待测 | 11.75 | 连续，随弧长 |
| SFX16 | 幽灵锁定 click | 待选 | 12.70 | 待测 | 12.70−peak | 单次 |
| SFX17 | 伺服短启 | 合成/待选 | 13.00–13.20 | 待测 | 13.00 | 短 |
| SFX18 | 翻纸 | 待选 | 14.40 | 待测 | 14.40−peak | 单次 |

- 所有 peakOffset 必须用实际文件测量；文件起点不等于感知峰值。上表“待测”不是 0。
- 密度控制：S05 每秒不超过 4 个音效；同刻事件聚类，避免机关枪。
- 接触事件（E04、E06、E07、E17、E20）默认不浮动；扫描 tick 可随实际线条位置微调 ±0.04s。
- 音乐与音效都未生成；没有 `source_sha256`。

## 试听与选定记录

- 比较画面 / 播放范围：暂无（未生成）。
- 响度匹配办法：未来先统一响度再比较，不用“更响”当更好。
- 作者选择日期、原话与具体文件：未选。
- 文件 hash / 采样率 / 声道 / 采样数 / 实际时长：无。
- 生成配置与实际 thinking_used：未生成。
- 实测乐句 / 强拍 / 词锚：无。
- 需要改动与失效事件：一旦选定音轨，S05 的 E13–E15、S07 的 E22–E23 需按实际拍点复核；口播若加入，全部文字读窗重排。
- 编码后响度 / 真峰值 / 同步检查：未执行。
