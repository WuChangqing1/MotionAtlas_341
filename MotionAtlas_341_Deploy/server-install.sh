#!/usr/bin/env bash
# Install the already-approved Motion Atlas video/static site behind local-only nginx.
# Run via: sudo bash ~/motion-atlas-341-upload-<id>/server-install.sh ~/motion-atlas-341-upload-<id>
set -Eeuo pipefail
if [[ "${EUID}" -ne 0 ]]; then echo 'ERROR: please run this installer with sudo.' >&2; exit 1; fi
STAGED="${1:?Usage: server-install.sh /home/USER/staging-dir}"
VIDEO='MA341-DEMO-001-picture-lock.mp4'
EXPECTED='ab039c173f6f9c972da44d468af21265d36376418ef5027d449cbb1b11adebd6'
BASE='/var/www/motion-atlas-341'
CONF='/etc/nginx/conf.d/motion-atlas-341-internal.conf'
SNIPPET='/etc/nginx/snippets/motion-atlas-341-route.conf'
[[ -f "$STAGED/site/index.html" && -f "$STAGED/site/$VIDEO" ]] || { echo 'ERROR: incomplete staging area' >&2; exit 1; }
command -v nginx >/dev/null || { echo 'ERROR: nginx is not installed' >&2; exit 1; }
command -v curl >/dev/null || { echo 'ERROR: curl is required' >&2; exit 1; }
HASH="$(sha256sum "$STAGED/site/$VIDEO" | awk '{print $1}')"
[[ "$HASH" == "$EXPECTED" ]] || { echo "ERROR: video SHA mismatch: $HASH" >&2; exit 1; }
mkdir -p "$BASE/releases" /etc/nginx/snippets
RELEASE="$(date -u +%Y%m%dT%H%M%SZ)-${HASH:0:12}"
DEST="$BASE/releases/$RELEASE"
[[ ! -e "$DEST" ]] || { echo 'ERROR: release already exists' >&2; exit 1; }
mkdir -p "$DEST"
cp -a "$STAGED/site/." "$DEST/"
find "$DEST" -type d -exec chmod 755 '{}' +
find "$DEST" -type f -exec chmod 644 '{}' +
OLD_TARGET=""
if [[ -L "$BASE/current" ]]; then OLD_TARGET="$(readlink "$BASE/current")"; elif [[ -e "$BASE/current" ]]; then echo 'ERROR: current path exists and is not a symlink' >&2; exit 1; fi
CONF_BACKUP=""
if [[ -f "$CONF" ]]; then CONF_BACKUP="$(mktemp)"; cp "$CONF" "$CONF_BACKUP"; fi
SNIPPET_BACKUP=""
if [[ -f "$SNIPPET" ]]; then SNIPPET_BACKUP="$(mktemp)"; cp "$SNIPPET" "$SNIPPET_BACKUP"; fi
rollback() {
  echo 'ERROR: install failed; restoring prior nginx config and release pointer.' >&2
  if [[ -n "$CONF_BACKUP" ]]; then cp "$CONF_BACKUP" "$CONF"; else rm -f "$CONF"; fi
  if [[ -n "$SNIPPET_BACKUP" ]]; then cp "$SNIPPET_BACKUP" "$SNIPPET"; else rm -f "$SNIPPET"; fi
  if [[ -n "$OLD_TARGET" ]]; then ln -sfn "$OLD_TARGET" "$BASE/current.tmp"; mv -Tf "$BASE/current.tmp" "$BASE/current"; else rm -f "$BASE/current"; fi
  nginx -t >/dev/null 2>&1 && { systemctl reload nginx 2>/dev/null || nginx -s reload 2>/dev/null || true; }
}
trap rollback ERR
ln -sfn "$DEST" "$BASE/current.tmp"
mv -Tf "$BASE/current.tmp" "$BASE/current"
cat > "$CONF" <<'NGINX'
# Local-only backend; public TLS remains on the existing ccqspace.site server.
server {
    listen 127.0.0.1:18093;
    server_name localhost;
    root /var/www/motion-atlas-341/current;
    index index.html;
    add_header X-Content-Type-Options nosniff always;
    location / { try_files $uri $uri/ =404; }
    location ~* \.mp4$ {
        types { video/mp4 mp4; }
        add_header Cache-Control "public, max-age=604800";
    }
}
NGINX
cp "$STAGED/nginx-route.conf" "$SNIPPET"
chmod 644 "$CONF" "$SNIPPET"
nginx -t
systemctl reload nginx || nginx -s reload
curl -fsSI --max-time 8 'http://127.0.0.1:18093/' >/dev/null
curl -fsSI --max-time 8 "http://127.0.0.1:18093/$VIDEO" >/dev/null
trap - ERR
[[ -z "$CONF_BACKUP" ]] || rm -f "$CONF_BACKUP"
[[ -z "$SNIPPET_BACKUP" ]] || rm -f "$SNIPPET_BACKUP"
echo "PASS local deployment: http://127.0.0.1:18093/"
echo "Release: $DEST"
echo "Video SHA256: $HASH"
echo "Public routing NOT installed automatically. Include $SNIPPET inside the existing ccqspace.site HTTPS server block, then run nginx -t && systemctl reload nginx."
