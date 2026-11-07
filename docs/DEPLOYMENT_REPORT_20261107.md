# DEPLOYMENT REPORT · MA341-DEMO-001《完成之后》

- 日期：2026-11-07（Asia/Shanghai）
- 执行时间：约 12:18–12:27
- 最终状态：**DEPLOYED / PUBLIC SMOKE PASS**
- 公开地址：<https://ccqspace.site/animation/>
- 内部服务：<http://127.0.0.1:18093/>
- 发布版本：`p1fix4-picture-lock`
- 发布目录：`/var/www/motion-atlas-341/releases/20261107T042005Z-ab039c173f6f`

## 1. 本地与服务端环境

| 项 | 值 |
|---|---|
| 本地 | Windows 11，PowerShell 5.1，OpenSSH |
| 项目 | `D:\CodingData\Github\AICartoonMaking\MotionAtlas_341` |
| 部署包 | `MotionAtlas_341_Deploy` |
| SSH 别名 | `fengz` |
| 服务器用户 | `ubuntu` |
| HOME | `/home/ubuntu` |
| 系统 | Ubuntu 22.04.5 LTS |
| Nginx | 1.18.0 (Ubuntu)，active |
| sudo | `sudo -n true` 可用（未记录密码） |
| 磁盘 | `/` 40G，已用 22G，可用 17G |
| 18093 | 部署前空闲 |

## 2. 发布文件与 SHA

| 文件 | SHA256 / 值 |
|---|---|
| MP4 | `ab039c173f6f9c972da44d468af21265d36376418ef5027d449cbb1b11adebd6` |
| film.html | `6a367ff4f8180f2cd0f05fea0a0478e94c1bb465d40dc46ed1ed09afb987206c` |
| timeline.js | `2a07279233b0c899b7ae8ef417b42494563e7322ae663f3b84032605358b4485` |
| 视频大小 | 7,612,522 B |
| 页面 | `index.html` |
| poster | `poster.jpg`（108,932 B） |
| 元数据 | `release.json` |

本地上传前、服务器安装前、服务器端复制后均核对了 MP4 SHA；公网重新下载的 MP4 也得到同一 SHA。

## 3. 部署包最小修复

部署前实际检查了 `deploy.ps1`、`server-install.sh`、`nginx-route.conf`、`site/index.html`。发现并最小修复：

1. `server-install.sh` 的失败回滚原本只覆盖 `internal.conf` 与 `current`，**未覆盖 snippet**。已增加 `SNIPPET_BACKUP`，失败时同时恢复 `motion-atlas-341-route.conf`；成功时清理临时备份。
2. `deploy.ps1` 的 `release.json` 中文标题在 PowerShell 5.1 下出现乱码（`瀹屾垚涔嬪悗`）。已改用 Unicode 码点拼接 `完成之后`。当前已部署的 `release.json` 也已修正。

部署包文件 SHA：

- `deploy.ps1` `348f6a6c258b366f1c6d80902465b99a7f750789fdc0a046d5bd7732b1fd1bdd`
- `server-install.sh` `45eb5b52f68dbd782e8ec714dbb5f0dc89281311d554f9ffa630611c0c5f53d7`
- `nginx-route.conf` `f707bbe686ace80f2fa88dad09273b6ecc13e75561b085b719d902fed5d7cf18`
- `site/index.html` `4d6b84433bf3bda71d416aef27f18a9995cd55ff8188c6c2245d6033d6fa6bd1`

未修改正式 MP4、450 帧、film.html 或 timeline.js。

## 4. 已执行命令与结果

| 命令/操作 | 结果 |
|---|---|
| 本地 SHA256 校验 | PASS |
| `ssh fengz` 只读环境检查 | exit 0 |
| 备份 Nginx 配置/状态 | PASS |
| `deploy.ps1`（上传 + sudo 安装） | exit 0 |
| 服务端 MP4 SHA 校验 | PASS |
| 创建 release / 切换 current | PASS |
| `nginx -t`（安装后） | successful |
| `systemctl reload nginx` | exit 0 |
| 内部 `curl` 页面/视频 | 200 / 200 |
| 内部 Range | 206，video/mp4，100 B |
| 插入 HTTPS include | 成功 |
| `nginx -t`（路由后） | successful |
| `systemctl reload nginx` | exit 0 |
| 公网页面 | 200 |
| 公网视频 | 200 |
| 公网 Range | 206 |
| 公网 MP4 下载 SHA | 与发布版一致 |
| 公网 poster | 200 image/jpeg |
| 公网 release.json | 200 |
| 主站 `https://ccqspace.site/` GET | 200 |

## 5. 服务器安装结构

- release：`/var/www/motion-atlas-341/releases/20261107T042005Z-ab039c173f6f`
- current：`/var/www/motion-atlas-341/current` → 上述 release
- 内部 Nginx：`/etc/nginx/conf.d/motion-atlas-341-internal.conf`
  - 只监听 `127.0.0.1:18093`
  - `root /var/www/motion-atlas-341/current`
  - MP4 `video/mp4` + 7 天缓存
- 路由：`/etc/nginx/snippets/motion-atlas-341-route.conf`
  - `location = /animation` → 301 `/animation/`
  - `location ^~ /animation/` → `http://127.0.0.1:18093/`
  - 保留 Host / X-Real-IP / X-Forwarded-For / X-Forwarded-Proto
- HTTPS 实际配置：`/etc/nginx/conf.d/mysite.conf`
  - 首个 server 块，`server_name ccqspace.site www.ccqspace.site;`
  - 第 4 行插入 `include /etc/nginx/snippets/motion-atlas-341-route.conf;`
  - 只出现 1 次
  - 未改其他 location、根路径或证书

发布目录只有 `index.html`、MP4、`poster.jpg`、`release.json`，未部署 `frames/`、历史 FAIL 视频、部署日志或研究文件。

## 6. 备份

部署前：

`/root/motion-atlas-341-backups/20261107T041953Z/`

- `mysite.conf.before`
- `nginx-T-before.txt`
- `nginx-t-before.txt`
- `ss-before.txt`

修改 HTTPS include 前：

`/root/motion-atlas-341-backups/20261107T042123Z/`

- `mysite.conf.before-include`
- `route.conf.before-include`
- `internal.conf.before-include`

## 7. 内部与公网验收

### 内部

- `http://127.0.0.1:18093/` → 200 text/html
- MP4 → 200 video/mp4, 7,612,522 B
- Range `bytes=0-99` → 206, Content-Range `0-99/7612522`
- 18093 只监听 `127.0.0.1`，未公网监听

### 公网

- `https://ccqspace.site/animation/` → 200
- 页面标题：`完成之后 · Motion Atlas 341`
- 视频引用 1 次、poster 引用 1 次、`controls` 存在
- 无音轨提示 2 次
- 模拟演示数据声明存在
- `https://ccqspace.site/animation/MA341-DEMO-001-picture-lock.mp4` → 200 video/mp4
- Range → 206，Content-Range `0-99/7612522`
- 公网下载 SHA：`ab039c173f6f9c972da44d468af21265d36376418ef5027d449cbb1b11adebd6`
- `release.json` → 200，title `完成之后`
- `poster.jpg` → 200 image/jpeg
- `http://ccqspace.site/animation/` → 301 `https://ccqspace.site/animation/`
- 证书：CN=ccqspace.site，Let's Encrypt，有效期 2026-09-11 至 2026-12-10
- 主站 `https://ccqspace.site/` GET → 200，未被影响

## 8. 桌面/手机与浏览器交互

已完成：

- 公网 HTML 200；
- 页面内联 CSS 完整，无外部 CSS 404；
- viewport meta 与 `@media(max-width:700px)` 存在；
- `<video controls playsinline>` 与 MP4 source 存在；
- poster、release、视频路径均 200。

**未完成，需人工复核：**

- 实际桌面浏览器视觉布局；
- 实际手机视口布局；
- 点击播放/暂停、拖动进度；
- 浏览器实际播放 15 秒画面。

原因：本机 Windows Schannel 对公网 HTTPS 的 `curl` 出现 `SEC_E_NO_CREDENTIALS`，无法在本会话内把本地浏览器交互作为已验证结果；服务器侧公网请求与证书已验证。不能把静态 HTML 检查推断为浏览器播放通过。

## 9. 安全检查

- 18093 仅 `127.0.0.1`；
- 未开放新公网端口；
- 发布文件 644、目录 755；
- 未暴露 SSH 私钥、环境变量、源码或日志；
- 未部署 450 帧、历史 FAIL 视频、后台平台；
- 主站及既有 Nginx 配置未被替换；
- 备份在 `/root` 下，不在公网发布目录；
- Nginx active；
- 旧配置可恢复。

## 10. 回滚

### 只撤销 HTTPS 路由

```bash
sudo cp /root/motion-atlas-341-backups/20261107T042123Z/mysite.conf.before-include /etc/nginx/conf.d/mysite.conf
sudo nginx -t && sudo systemctl reload nginx
```

或只删除 `mysite.conf` 第 4 行的 include。

### 回滚内部服务（首次部署，无旧 release）

```bash
sudo rm -f /var/www/motion-atlas-341/current
sudo cp /root/motion-atlas-341-backups/20261107T042123Z/internal.conf.before-include /etc/nginx/conf.d/motion-atlas-341-internal.conf
sudo cp /root/motion-atlas-341-backups/20261107T042123Z/route.conf.before-include /etc/nginx/snippets/motion-atlas-341-route.conf
sudo nginx -t && sudo systemctl reload nginx
```

若以后已有旧 release，只需把 `current` 指回旧 `/var/www/motion-atlas-341/releases/...`。

回滚后应再次执行 `nginx -t` 和公网主站检查。

## 11. 未解决问题

- 本机 Windows Schannel 对公网 HTTPS 的 curl 失败（`SEC_E_NO_CREDENTIALS`），因此桌面/手机浏览器实际视觉与播放交互未在本会话完成；需人工在普通浏览器复核。
- 当前无音轨，符合 picture-lock 交付预期；未添加音乐或口播。
- `release.json` 中文标题已修正；正式页面标题正常。
- 本次边界只发布动画页，因此未修改服务器总首页入口；未推送 GitHub。

## 12. 最终结论

**DEPLOYED / PUBLIC SMOKE PASS**

公开地址：

<https://ccqspace.site/animation/>

当前发布版本：

`p1fix4-picture-lock` / `ab039c17…`

浏览器桌面/手机视觉与播放交互：**待人工复核**，不作为自动验收已完成。
