# DEPLOYMENT REPORT · Motion Atlas 341 Workbench

- 日期：2026-11-07 12:40–12:51（Asia/Shanghai）
- 状态：**WORKBENCH DEPLOYED / QA PENDING**
- 公开 URL：<https://ccqspace.site/animation/>
- 旧作品：<https://ccqspace.site/animation/showcase/>
- 发布版本：`20261107T1250Z-workbench`
- 发布目录：`/var/www/motion-atlas-341/releases/20261107T1250Z-workbench`
- 架构：现有 Nginx `127.0.0.1:18093` + 现有 `/animation/` 路由；未新增端口。

## 变更
- 根页面从视频播放页改为 341 风格创作工作台。
- 原视频页迁移为 `showcase/`，MP4 SHA256 `ab039c173f6f9c972da44d468af21265d36376418ef5027d449cbb1b11adebd6` 未改变。
- 旧 release 保留：`20261107T042005Z-ab039c173f6f`。
- Nginx 配置未改；`nginx -t` successful，reload exit 0。

## 公网验收
- 工作台 `/animation/` 200；`js/data.js`、`js/app.js`、`js/zip.js`、CSS、B3 图片、skill bundle、示例 ZIP、release.json、deploy-manifest 均 200。
- `showcase/` 200；showcase MP4 200；Range 206；MP4 SHA 与旧版一致。
- 主站 `https://ccqspace.site/` GET 200。
- 总首页卡片已加入 `/opt/exercises/instance/products.yaml`：`motion-atlas-341` → `/animation/`，卡片名、描述、标签与链接已实际渲染；未重启 `exercises.service`（加载器按请求读取）。
- `/animation` 无斜杠 301。
- 示例 ZIP 公网 SHA256：`698d34122b83c15b449b6ec94e4987603fb4b1c8c4ded28b7bc75d71c56aa1cc`。

## 回滚
```bash
sudo ln -sfn /var/www/motion-atlas-341/releases/20261107T042005Z-ab039c173f6f /var/www/motion-atlas-341/current.tmp
sudo mv -Tf /var/www/motion-atlas-341/current.tmp /var/www/motion-atlas-341/current
sudo nginx -t && sudo systemctl reload nginx
```
旧视频仍完整保留在旧 release 和 `showcase/`。

## 未完成
浏览器实际交互（搜索/选择/任务表单/下载 ZIP/桌面手机布局）未在本会话完成：本机 Playwright Chromium 不存在；系统 Chrome 由沙箱拒绝 spawn（EPERM）。已做数据、DOM ID、JS 语法、ZIP 文件结构与公网静态资源检查；浏览器交互需人工复核。
