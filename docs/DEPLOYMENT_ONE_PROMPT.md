# 单 Prompt 流程发布记录

状态：本地验证完成，等待 GitHub 推送及服务器切换；本记录将在实际验收后更新。

- 用户已明确授权推送并部署；最新交互只使用复制 Prompt，不使用 ZIP。
- 生产地址：https://ccqspace.site/animation/
- 发布前 current：`/var/www/motion-atlas-341/releases/20261108T1030Z-simple-prompt`。
- 保留视频 SHA256：`ab039c173f6f9c972da44d468af21265d36376418ef5027d449cbb1b11adebd6`，已重新核对。
- 仅更新 index.html、js/app.js、js/task-contract.js、css/v2.css、release.json；先复制旧 release 到新目录，再原子切换 current。
- 不修改 Nginx、端口或其他服务；旧 release 保留用于回滚。
- 真实媒体、错误任务、确定性、网站交互检查见 EXECUTION_QA.md。
