# 执行 QA · 2026-11-18（Asia/Shanghai）

## 真实命令与退出码

| 命令 / 检查 | 结果 |
|---|---|
| node --check web/js/app.js、task-contract.js | exit 0 |
| node --test tests/task-contract.test.cjs | 4/4，exit 0 |
| python -m unittest discover -s tests -p test_pipeline.py | 6/6，exit 0 |
| python scripts/verify.py | 全部 341 原文 SHA / 193 图 SHA / 数据一致，exit 0 |
| python tools/animate.py --task examples/a1-a2.task.json --out outputs/pipeline-20261118/a1-a2-final | exit 0 |
| python tools/animate.py --task examples/a1-a2.task.json --out outputs/pipeline-20261118/a1-a2-final-repeat | exit 0 |
| python tools/animate.py --task examples/l42-v6.task.json --out outputs/pipeline-20261118/l42-v6-final | exit 0 |
| 篡改 A1 SHA 的 task | exit 2，failure.stage=styles，具体指出 A1 SHA256 不一致 |
| 空 task.json | exit 2，failure.stage=task，指出缺少 brief |
| still 任务 | exit 0，输出 3 张 PNG，不输出 MP4/音频 |
| 3 秒 512×288 无音乐 final | exit 0，H.264，无音频流 |
| 真实浏览器复制结果中的 JSON | 已解析并交给 Python 契约/SHA 校验通过 |

所有本次产物在 `outputs/pipeline-20261118/`（生成物不提交 Git）。CLI 失败详细输出在 cli_checks.json。

## ffprobe / 媒体

- A1/A2：20.000000s，1920×1080，30/1fps，600 个实际解码帧，H.264 + AAC。
  MP4 SHA256 `838784c1e38b931e0296f9c15d7f4f7353f60257ce07ff79f10bdd8be35322a8`；1232204 bytes。
- L42/V6：20.000000s，1920×1080，30/1fps，600 个实际解码帧，H.264 + AAC。
  MP4 SHA256 `e06e21384b6400f39a579e2b7ccbed5f9356113af475f42e4fca7834829f28f2`；980351 bytes。

两个示例均完整解码 exit 0；blackdetect 使用 d=0.15:pix_th=0.02:pic_th=0.98，未发现非预期黑场。音频为真实 WAV→AAC，本机极简氛围床，未生成四案音乐，不声称达到 -14LUFS 商业混音规范。

## 确定性

同一 A1/A2 任务完整渲染两次，三张**编码后** PNG SHA256 完全一致：

- `stills/encoded_1_4.000s.png`：`5b6ea94392ca61605e0cdda27ca14e767672c1c67846bee1f196fff8cc72253c`。
- `stills/encoded_2_10.000s.png`：`1c09401db1a69cdb40149779884abade55703d37fa9105d115e7ec39c7f5c66d`。
- `stills/encoded_3_17.000s.png`：`b81f3c080d7bea5514eea432429062b72cb5de71c50f322bf8af2c3e632ab9a4`。

入口还执行非顺序 seek（中→0→末→中）实际像素比较。两个相同时间点的像素不可读/渲染失败不会算一致。

## 观察层级

- 机器：上列 ffprobe、全帧解码、blackdetect、任务/SHA/阶段测试通过。
- 实际静帧：已打开 A1/A2 的 4/10/17 秒编码后静帧，正文可读、未裁切，正文阅读区不再有落字干扰；A1 画面边缘落字属于刻意出入画。另已打开 L42/V6 的 17 秒帧，正文未裁切，主体仍保持对应点轮廓。
- 连续视频/聆听：**未完整观看或聆听 20 秒，不宣称人工视听验收通过。**
- 作者采用：尚未确认。
- DSH：没有在本次会话另启动 DSH 进行模型生成；验证了真实浏览器复制出的任务、Python 消费、示例媒体链。其他风格的内容质量不能由这些测试推定。

## 网站真实操作

浏览器已实际操作：A2 搜索、选择、收藏、收藏视图、已选视图、复制按钮与剪贴板读取。确认复制含完整 JSON、原文路径、SHA 和 final 授权；成功时不打开配置弹窗；ZIP 按钮已从 DOM 移除。截图在 workbench-desktop.jpg/workbench-mobile.jpg。测试 1440×1000、390×844、820×1180，document scrollWidth 不超过视口；修复了旧 V2 的双重左侧留白和侧栏横向滚动。未做真机软键盘或完整 200% 字体专项验收。

## 审查修复与范围

一次独立代码复核发现的显式 renderer 优先级、隐藏 Canvas 属性依赖、旁白/音效静默遗漏、无效输出选择、默认禁止角色均已修复；新增回归测试先失败后通过。保留原 Skill、341 风格、193 图和旧 MP4。历史输出的既有未提交删除与旧部署文档改动不属于本次提交。

## 发布

发布状态以 docs/DEPLOYMENT_ONE_PROMPT.md 的最终记录为准。
