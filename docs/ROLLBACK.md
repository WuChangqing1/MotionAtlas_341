# ROLLBACK

## 回滚到旧视频页
```bash
OLD=/var/www/motion-atlas-341/releases/20261107T042005Z-ab039c173f6f
sudo ln -sfn "$OLD" /var/www/motion-atlas-341/current.tmp
sudo mv -Tf /var/www/motion-atlas-341/current.tmp /var/www/motion-atlas-341/current
sudo nginx -t && sudo systemctl reload nginx
```
旧 release 中保留视频播放页、MP4、poster、release.json。showcase 在新旧 release 都存在。

## 恢复新工作台
```bash
NEW=/var/www/motion-atlas-341/releases/20261107T1250Z-workbench
sudo ln -sfn "$NEW" /var/www/motion-atlas-341/current.tmp
sudo mv -Tf /var/www/motion-atlas-341/current.tmp /var/www/motion-atlas-341/current
sudo nginx -t && sudo systemctl reload nginx
```

## 验证
- 工作台：https://ccqspace.site/animation/
- 案例：https://ccqspace.site/animation/showcase/
- 视频 SHA：`ab039c173f6f9c972da44d468af21265d36376418ef5027d449cbb1b11adebd6`
- 主站：https://ccqspace.site/ 200
- 18093 只监听 127.0.0.1。
