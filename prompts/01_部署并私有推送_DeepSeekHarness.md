# DeepSeek Harness 主执行 Prompt：上线 Motion Atlas、添加首页入口、推送 Private GitHub

你是负责本项目交付的高级全栈工程师兼 DevOps 工程师。请直接执行当前任务范围内的审计、部署、测试与私有仓库管理，不要停留在建议清单。严格依据当前项目文件、实际环境与运行结果工作，不得虚构成功。

## 任务背景

我已获得 `MotionAtlas_341` 完整项目压缩包（解压后的当前工程目录）。其中：
- `web/` 是已经完成的静态 UI，支持 341 种风格搜索、筛选、193 张原始静帧、收藏、多选、原文复制和 DSH 任务生成。
- `style-library/` 是实际的 341 原始 Markdown 风格库；`web/js/data.js` 含用于离线搜索的原文镜像。
- `.dsh/skills/fy-code-animation/` 是完整 Skill，符合 DSH 项目级技能文件布局。
- `docs/` 包含 Skill 接入、自检、动画制作全流程、上线回滚规范。
- `nginx/` 有 Nginx 配置参考，只能结合实际配置使用。

目标服务器：通过本机现有 `ssh fengz` 可登录（Ubuntu Linux 环境）；域名 `ccqspace.site` 已有可正常访问的 HTTPS 首页，并承载其他项目；已为新项目准备了 **18093** 端口。

**我授权你在充分检查与备份后：** 为新项目配置 18093 静态服务，在当前首页新增一个不破坏旧入口的项目卡片，把此项目创建或推送到我已有 GitHub 账号下的 **Private 仓库**。不要把其他项目的权限、域名或端口改变掉。

## 一、必须先做的本地审计

1. 确认当前工作目录是 `MotionAtlas_341` 项目根目录，实际检查 `web/index.html`、`web/js/data.js`、`style-library/风格提示词` 与 `.dsh/skills/fy-code-animation/SKILL.md` 存在。
2. 检查代码结构、HTML/CSS/JS 是否存在明显运行错误。运行 `python scripts/verify.py`，检查 341 条 ID、10 类数量、193 张原始静帧与所有文件映射。检查 8 条原始空提示词是否做了显式提示。对于发现的问题直接修复并记录 diff；**不要把空风格擅自改成虚构的原始提示词**。
3. 审查 `.gitignore`；不得提交 `.env`、SSH 私钥、访问令牌、服务器密码、临时用户数据、`node_modules`、生成缓存或其他项目源码。
4. 检查本机 DSH 是否正确识别项目级 `fy-code-animation` Skill；运行 Python 风格库索引、`doctor.py` 和 Skill 单元测试（Python 与 Node）。DSH 无 Skill 提供者时先明确说明原因并按现有 DSH 配置修复，禁止未经证实宣称已安装成功。
5. 检查字体与移动端布局、筛选、收藏、选中列表、复制与下载、原文 SHA 显示是否合理。网页不应该对公网暴露执行命令的 API，不需要后端数据库。

## 二、先审计服务器再部署（不得覆盖已有项目）

1. 通过 `ssh fengz` 连接；仅依赖已有 SSH 配置，不询问或记录密码。执行服务器的基础审计：内核/系统、Nginx 位置与版本、监听端口、HTTPS 域名 server 块、首页项目目录与首页技术栈、已有反向代理 location、可用磁盘、文件权限。
2. 重点确认 **18093 端口的真实占用状态**。如果已经被使用，先查明进程及对应业务；**绝不杀进程或覆盖服务**，若冲突未解决则停在部署安全边界并给出可行替代方案。
3. 备份所有将修改的配置、首页相关源码或数据项和现有新项目路径。记录备份位置；在任何变更前输出简短的「原服务影响评估」。不能基于猜测覆盖 `/etc/nginx/sites-available/default` 或其他项目根目录。
4. 建议部署完整工程到 `/srv/motion-atlas/`，Nginx **只提供 `web/` 静态内容**。新建单独 18093 Nginx server/location 服务，按实际 Nginx 组织结构选择配置落点。图片、HTML、CSS、JS 必须在同一 web root 下；不允许公开暴露 `style-library/`、`.dsh/`、私人作品目录或服务器其他文件。
5. 当前首页 `https://ccqspace.site/` 必须保持原样和所有现有链接可用。查看其实际项目入口组件/配置，在合适位置增加「代码动画风格工作台」入口，介绍文案「探索 341 种视觉风格，查看原始静帧，快速生成代码动画制作任务」，跳转 `https://ccqspace.site/animation/`。**这是新增入口，不是替换首页。**
6. 把现有 HTTPS `ccqspace.site` 的 server 块里加 `/animation/` 反代到 `http://127.0.0.1:18093/`；在实际配置下正确处理前缀和相对路径。若已有相应路径，先检查避免冲突。不要额外发行或替换主域名 TLS 证书。
7. `sudo nginx -t` 成功才允许 reload；如失败，恢复刚才的相关配置备份并报告原因，不影响原服务。不要为了部署重启整个服务器。需要额外 Linux 包时先确认确有必要，并尽量复用已安装的 Nginx、Git、Python。

## 三、严格验收线上可用性

- 从服务器本地检查：`curl -fsSI http://127.0.0.1:18093/`。
- 从对外域名检查：`curl -fsSI https://ccqspace.site/animation/`。
- 检查页面的 `css/app.css`、`js/app.js`、`js/data.js`、`assets/stills/B3.jpg` 等实际存在的资源返回成功，不应出现路径前缀导致的 404。
- 打开网页功能检查：全量 341 条、10 类数量、193 张静帧、搜索 `B3` 与 `O63`、有图筛选、选择多个风格、复制原始 Markdown、生成任务卡、Markdown 下载、手机视口适配、明暗模式。
- 确保 `https://ccqspace.site/` 首页仍可访问，现有项目入口没丢失，新卡片可以跳转。
- 把测试方法、实际 HTTP 状态、页面操作结果和实际截图路径写进 `DEPLOY_REPORT.md`。没有实际测试的项目明确写「未验证」，不能写通过。

## 四、GitHub 仅创建/推送 Private 仓库

1. 检查 `git`、`gh`、当前目录 Git 状态及 `gh auth status`；使用**我当前授权的 GitHub 账号**。不新建公开仓库，不展示 GitHub Token，不改动其他仓库。
2. 默认仓库名 `motion-atlas-341`；若同名已经存在，先辨明仓库归属、权限和内容，避免覆盖。如果当前目录已有 Git 仓库/远端，先审核现状，禁止 `git push --force`。
3. 如果需要创建新仓库，使用 `gh repo create <当前账号>/motion-atlas-341 --private ...` 或等价的 GitHub 私有仓库创建方式。**创建时显式设置 private**，绝不可为了成功改成 public。
4. 保留用户拥有的原始许可、第三方 LICENSE 文件、README 和代码；提交带说明的 initial commit。不要在 GitHub Actions 里暴露 SSH 密钥或部署密钥。默认手工部署即可，除非已有安全持续部署方案。
5. 推送后执行 `gh repo view --json visibility,nameWithOwner,url`，必须核对 `visibility` 为 `PRIVATE`；记录仓库 URL、当前分支和最新 commit SHA。没拿到 GitHub 授权就明确报告 GitHub 部分未完成，不得虚构 URL。
6. 如果完整原始提示词公开显示在我的网站，要在 README 里提醒：GitHub 私有只保护源码仓库，不代表网站中的原文也私有；遵守免费分享及非商业化限制。

## 五、最终交付与执行规则

- 使用 `docs/上线与回滚.md` 与 `nginx/` 两个文件作参考，但必须对照当前服务器做差异化处理。
- 只修改当前任务相关的文件，尽量小的 diff，保留旧首页和旧 Nginx 配置。每一步先备份后更改。
- 不要把插件/Skill“安装成功”和“模型已真实调用”混为一谈。仅本地自检通过时明确写「Skill 本地检查通过」；必须用 DSH 会话调用结果才能宣称实际成功加载。
- 如果你发现部署需要权限或身份验证，明确给出卡点和最小人工授权动作，不要伪造结果；可以继续完成其他不受影响的步骤。
- 任何测试失败先尝试在当前项目范围内定位修复，重大影响无法控制则回滚。

完成后按以下格式汇报：

1. **本地审计**：341 / 193 / Skill doctor / 测试结果；
2. **服务器修改**：部署位置、18093 监听状态、Nginx 修改文件、备份位置；
3. **线上地址**：主站入口、新页面 URL、HTTP 状态、移动端与功能测试；
4. **GitHub**：仓库 URL、PRIVATE 验证、分支、提交 SHA；
5. **风险与回滚**：对旧项目影响、已检查项目、如何恢复；
6. **未完成事项**：如果有，写出明确原因与下一步命令。
