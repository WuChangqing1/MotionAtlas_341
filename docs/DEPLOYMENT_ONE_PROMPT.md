# 单 Prompt 流程发布记录 · 2026-11-19（Asia/Shanghai）

状态：**已推送 main，已部署，公网静态内容比对通过；线上点击验收部分受工具超时限制。**

- 生产地址：https://ccqspace.site/animation/
- GitHub：https://github.com/WuChangqing1/MotionAtlas_341
- 已部署源码提交：`0f5f6f0266711b2d2aaf75f35dee30567203b425`，推送后通过 git ls-remote 核对 main 一致。
- 当前 release：`/var/www/motion-atlas-341/releases/20261119-one-prompt-v3-0f5f6f026671`。
- 保留旧 release：`/var/www/motion-atlas-341/releases/20261108T1030Z-simple-prompt`，未覆盖。
- 上传包 SHA256：`bb9155811b1eed9d84802bfdfbedda8d340f5ad280b8b7f23428ddb76f8af822`；安装前核对包及逐文件 SHA、预期 current、341 data.js SHA 和受保护 MP4 SHA。
- 发布只更新 index.html、js/app.js、js/task-contract.js、css/v2.css、release.json；复制旧 release 后写入新目录，原子切换 current。版本化资源查询参数防止旧缓存误用。
- 不修改 Nginx、端口、数据库或服务配置，不重载/重启任何服务。
- 发布前后 exercises、pd-rehab-backend、foodcircle-api 的 active 状态与 MainPID 完全一致。
- 原《完成之后》MP4 SHA256：`ab039c173f6f9c972da44d468af21265d36376418ef5027d449cbb1b11adebd6`；新旧 release 都已验证；公网 Range 返回 206/1024 bytes。
- 总首页仍存在 /animation/ 入口，未新增重复入口或改动其他卡片。

## 实际线上验证

安装脚本 exit 0；现有 127.0.0.1:18093 静态服务读取的五个更新文件与发布清单逐字节一致。另从外部 HTTPS 下载六个文件，全部 status=200 且字节 SHA 与本地已提交文件相同：

| 文件 | 公网 SHA256 |
|---|---|
| index.html | 4b01d4fed6470462436b91133406b60e37baf79ee5983c48ffee9e01f06e0f24 |
| js/app.js | 9a718358bda95b19d5348db8ca87b1c127a54708ab20b74ea847e438dbf2056d |
| js/task-contract.js | e5a0b596c781461d47eac778b5112e1af739f3bb12ca3a658153defb3633867f |
| css/v2.css | 42a0464088ef8b1895cca1e772abab9a2a0b1e7f3c7a978b36fb1eaa850a13ed |
| release.json | 768708c9e47fdd4a4a4832e746422bca9109871117fe9973c8d77eb42df60c1a |
| js/data.js | 707017c81c208c05135585bd81ae27e6d3d2f4f863078c859b2ec1bd03af4d8c |

浏览器实际打开了公网新页面并读取完整页面状态，确认新版主按钮、341 条风格与无 ZIP 入口。公网搜索 A2 已产生结果，但后续选择/复制操作连续工具超时，不能声称线上复制端到端通过。已在本地相同部署代码完成真实选择、复制、剪贴板 JSON 提取与 Python 契约/SHA 校验；本地截图存于 outputs/pipeline-20261118/workbench-desktop.jpg、workbench-mobile.jpg。HTTP/哈希不替代交互验收。

## 精确回滚

服务器 current 是静态目录符号链接，无需重载 Nginx：

```bash
sudo ln -s /var/www/motion-atlas-341/releases/20261108T1030Z-simple-prompt /var/www/motion-atlas-341/current.rollback-one-prompt
sudo mv -Tf /var/www/motion-atlas-341/current.rollback-one-prompt /var/www/motion-atlas-341/current
```

回滚前检查 current 是否仍为本记录的新 release，避免回退后续其他发布。新 release 内 delta-manifest.json 关联源码 SHA，rollback.json 记录原路径及服务状态。源代码变更无数据库迁移。

## 交付边界

- 网站：选择风格 → 一句话 → 复制 Prompt → 在本地 DSH 粘贴发送。不下载 ZIP，不手改任务参数。
- 内置执行器目前覆盖 A1/A2、L42/V6，其余风格由 DSH 实读原文后编写独立适配。
- 已实际生成两个 20 秒视频，媒体规格、解码、黑场、确定性与关键帧证据见 EXECUTION_QA.md。
- 未在此会话另启动 DSH 模型制作会话；未完整观看/聆听 20 秒；作者尚未采用。真机软键盘及完整 200% 字体专项未验收。
- 工作区原有历史输出删除、旧部署文档修改和其他未跟踪历史材料均未纳入本次提交，未替用户清理或恢复。
