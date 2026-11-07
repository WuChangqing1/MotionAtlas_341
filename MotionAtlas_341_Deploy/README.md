# MA341-DEMO-001 《完成之后》部署包

此包用于把**已验收的 p1fix4 picture-lock MP4** 发布到服务器 `ssh fengz`，计划公开路径 `https://ccqspace.site/animation/`。

## 本次部署的边界

- 部署：15 秒无声 H.264 MP4、响应式播放页、视频海报（如本机有 ffmpeg）、公开的发布版本 JSON。
- 不部署：Motion Atlas 全功能生成平台、后台、音频、其他未验收内容。
- 保留：Windows 源码、历史失败帧、现有 nginx HTTPS 网站配置。
- 服务架构：Nginx 内网监听 `127.0.0.1:18093`，现有 `ccqspace.site` HTTPS server 的 `/animation/` 反向代理到内网服务。

## 第一步：Windows 11 上传并安装内部服务

确保本机已安装并配置 OpenSSH，且 `ssh fengz` 可以正常登录。服务器应已有 nginx、curl、sudo 权限，并且 `127.0.0.1:18093` 没有被别的程序占用。

在解压后的目录，运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\deploy.ps1
```

脚本会严格核对本地：
- `film.html` SHA256 `6a367ff4f8180f2cd0f05fea0a0478e94c1bb465d40dc46ed1ed09afb987206c`
- `timeline.js` SHA256 `2a07279233b0c899b7ae8ef417b42494563e7322ae663f3b84032605358b4485`
- MP4 SHA256 `ab039c173f6f9c972da44d468af21265d36376418ef5027d449cbb1b11adebd6`

若不一致，直接停止；不会自动改写 MP4 或重新渲染。

脚本会把视频和网页上传到服务器，并通过 sudo 调用 `server-install.sh`。安装过程会为每次发布创建单独 release 目录，创建/更新内部 Nginx 站点，运行 `nginx -t` 后才 reload，并进行本机 HTTP 健康检查。失败时脚本尽量回滚当前版本软链接和 nginx 内部配置。**不自动修改现有 HTTPS 站点配置。**

## 第二步：把 `/animation/` 挂到现有 HTTPS 站点（仅首次）

执行 `ssh fengz`。先查已有 nginx 站点配置：

```bash
sudo nginx -T 2>&1 | grep -n -E 'server_name|listen .*443|location .*animation'
```

找出**实际负责 `ccqspace.site` HTTPS 443** 的 `server { ... }`，备份对应配置文件后，在其内部加入这一行：

```nginx
include /etc/nginx/snippets/motion-atlas-341-route.conf;
```

此文件已由安装脚本部署，包含 `/animation` 重定向和 `/animation/` 反向代理；不要将 `nginx-route.conf` 内容直接放在 `http {}` 或 `conf.d/` 顶层。

验证并加载：

```bash
sudo nginx -t && sudo systemctl reload nginx
curl -I http://127.0.0.1:18093/
curl -I http://127.0.0.1:18093/MA341-DEMO-001-picture-lock.mp4
curl -I https://ccqspace.site/animation/
curl -I https://ccqspace.site/animation/MA341-DEMO-001-picture-lock.mp4
```

确认 HTTPS、视频请求状态码 200（或播放器发 Range 请求时的 206）、`Content-Type: video/mp4`，以及浏览器可以播放。

## 故障处理

- `ssh fengz` 不通：先检查 SSH 别名、服务器、密钥；脚本不会继续。
- `sudo` 失败：检查账号的 sudo 授权，不要关闭系统安全策略。
- `nginx -t` 报端口冲突：用 `sudo ss -ltnp | grep 18093` 查出已占用的服务，**不要强制停止其他服务**。
- 内网 18093 正常，HTTPS `/animation/` 404：检查 include 是否放进了正确的 `ccqspace.site` 443 `server`、有无更优先的 `location`，以及 nginx 是否 reload。
- HTTPS 502：检查 `curl -I http://127.0.0.1:18093/` 与 nginx error log。
- 更新/回滚：可通过 `/var/www/motion-atlas-341/releases/` 中的旧 release 恢复 `current` 软链接，运行 `sudo nginx -t && sudo systemctl reload nginx`；请先检查目标版本内容。

## 完成标准

内部端口和公开 URL 都通过，浏览器桌面/手机可播放，完整 15 秒视频信息、模拟数据说明和无音轨提示正确；项目状态可记为 `DEPLOYED / PUBLIC SMOKE PASS`。只有亲自完成外网检查后才能登记公开上线成功。
