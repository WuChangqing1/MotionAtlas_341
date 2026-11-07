#!/usr/bin/env bash
set -Eeuo pipefail
VER='20261107T1250Z-workbench'
BASE='/var/www/motion-atlas-341'
STAGE="/home/ubuntu/motion-atlas-workbench-$VER"
REL="$BASE/releases/$VER"
OLD="$(readlink -f "$BASE/current")"
echo "OLD=$OLD"
[[ -d "$STAGE/web" ]] || { echo "missing staging $STAGE/web" >&2; exit 1; }
[[ -d "$OLD" ]] || { echo "missing old release $OLD" >&2; exit 1; }
sudo -n mkdir -p "$REL/showcase"
sudo -n cp -a "$STAGE/web/." "$REL/"
sudo -n cp -a "$OLD/MA341-DEMO-001-picture-lock.mp4" "$REL/showcase/"
sudo -n cp -a "$OLD/poster.jpg" "$REL/showcase/"
sudo -n chmod 755 "$REL" "$REL/showcase"
sudo -n find "$REL" -type d -exec chmod 755 {} +
sudo -n find "$REL" -type f -exec chmod 644 {} +
sudo -n python3 - "$REL" <<'PY'
import hashlib, json, os, sys
root=sys.argv[1]
files=[]
for dirpath, dirs, names in os.walk(root):
    for name in sorted(names):
        p=os.path.join(dirpath,name)
        rel=os.path.relpath(p,root).replace(os.sep,'/')
        if rel=='deploy-manifest.json': continue
        h=hashlib.sha256(open(p,'rb').read()).hexdigest()
        files.append({'path':rel,'bytes':os.path.getsize(p),'sha256':h})
out={'project':'MA341-DEMO-001','version':'workbench-1.0','release':os.path.basename(root),'file_count':len(files),'files':files}
with open(os.path.join(root,'deploy-manifest.json'),'w',encoding='utf-8') as f:
    json.dump(out,f,ensure_ascii=False,indent=2)
PY
sudo -n chmod 644 "$REL/deploy-manifest.json"
sudo -n ln -sfn "$REL" "$BASE/current.tmp"
sudo -n mv -Tf "$BASE/current.tmp" "$BASE/current"
echo "NEW=$(readlink -f "$BASE/current")"
sudo -n nginx -t
sudo -n systemctl reload nginx
echo "VIDEO_SHA=$(sha256sum "$REL/showcase/MA341-DEMO-001-picture-lock.mp4" | awk '{print $1}')"
echo "INDEX_SHA=$(sha256sum "$REL/index.html" | awk '{print $1}')"
