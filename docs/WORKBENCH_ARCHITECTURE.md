# WORKBENCH ARCHITECTURE

## 静态站点
- `web/index.html`：341 风格工作台 + 任务配置 + Prompt 预览。
- `web/js/data.js`：341 条真实风格数据（ID/title/series/path/image/markdown/sha256）。
- `web/js/app.js`：搜索/筛选/收藏/角色/任务/Prompt/ZIP 导出。
- `web/js/zip.js`：无外部 CDN 的 store-only ZIP writer；UTF-8 文件名、CRC32、中央目录。
- `web/assets/stills/`：193 张真实参考图，lazy load。
- `web/assets/skill-bundle.json`：完整 Skill 文件（145 个文本文件，用于完整离线 ZIP）。
- `web/assets/licenses/`：风格库、Skill 与第三方许可。
- `web/downloads/`：真实示例 ZIP。
- `web/showcase/`：已验收《完成之后》视频页。

## 数据流
1. 浏览器加载 data.js，不请求服务器数据库。
2. 选择/收藏/角色/任务草稿只写 localStorage。
3. 生成 Prompt 纯客户端。
4. ZIP 纯客户端：文本 + selected images + optional full skill/341 markdown；不把用户文案上传服务器。
5. 公网静态服务器只提供文件，不提供执行 API。

## 部署
- 同一个 Nginx route `/animation/` → 127.0.0.1:18093。
- release 目录：`/var/www/motion-atlas-341/releases/<version>/`。
- `current` 原子切换；旧视频 release 保留。
- `showcase/` 内的 MP4/poster 从旧 release 复制，SHA 保持 `ab039c17…`。
