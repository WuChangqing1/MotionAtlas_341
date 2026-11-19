#!/usr/bin/env python3
"""Install a verified static delta into a fresh release, preserving the old release."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tarfile
import urllib.request

BASE=Path('/var/www/motion-atlas-341')
ALLOWED={'index.html','js/app.js','js/task-contract.js','css/v2.css','release.json'}
VIDEO='showcase/MA341-DEMO-001-picture-lock.mp4'
VIDEO_SHA='ab039c173f6f9c972da44d468af21265d36376418ef5027d449cbb1b11adebd6'

def sha(raw):return hashlib.sha256(raw).hexdigest()
def services():
    cmd=['systemctl','show','exercises.service','pd-rehab-backend.service','foodcircle-api.service','--property=Id,MainPID,ActiveState']
    return subprocess.check_output(cmd,text=True)
def switch(target,name):
    temp=BASE/('current.next.'+name)
    temp.symlink_to(target,target_is_directory=True)
    os.replace(temp,BASE/'current')

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--bundle',required=True,type=Path)
    ap.add_argument('--sha256',required=True)
    ap.add_argument('--expected-current',required=True)
    args=ap.parse_args()
    if sha(args.bundle.read_bytes())!=args.sha256:raise ValueError('上传包 SHA256 不一致')
    old=(BASE/'current').resolve()
    if str(old)!=args.expected_current or old.parent!=BASE/'releases':raise ValueError('current 已漂移或越出 releases，停止')
    before=services()
    if sha((old/VIDEO).read_bytes())!=VIDEO_SHA:raise ValueError('旧验收视频 SHA 已漂移，停止')
    with tarfile.open(args.bundle,'r:gz') as archive:
        members={m.name:m for m in archive.getmembers()}
        if len(members)!=len(archive.getmembers()):raise ValueError('发布包包含重复文件')
        manifest=json.load(archive.extractfile('delta-manifest.json'))
        rid=manifest['release_id']
        if not re.fullmatch(r'[A-Za-z0-9-]+',rid):raise ValueError('release_id 无效')
        if set(manifest['files'])!=ALLOWED or set(members)!=ALLOWED|{'delta-manifest.json'}:raise ValueError('包内容超出精确发布范围')
        if sha((old/'js/data.js').read_bytes())!=manifest['data_sha256']:raise ValueError('341 数据源与生产不一致，停止')
        payload={}
        for name,expected in manifest['files'].items():
            if not members[name].isfile():raise ValueError('发布包只允许普通文件')
            raw=archive.extractfile(name).read()
            if sha(raw)!=expected:raise ValueError('文件 SHA256 不一致：'+name)
            payload[name]=raw
    new=BASE/'releases'/rid
    if new.exists():raise ValueError('新 release 已存在，拒绝覆盖')
    shutil.copytree(old,new,symlinks=False)
    for name,raw in payload.items():(new/name).write_bytes(raw)
    (new/'delta-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n','utf-8')
    (new/'rollback.json').write_text(json.dumps({'previous':str(old),'current':str(new),'services_before':before},indent=2),'utf-8')
    if sha((new/VIDEO).read_bytes())!=VIDEO_SHA:raise ValueError('新 release 视频保护校验失败')
    switch(new,rid)
    try:
        for name,expected in manifest['files'].items():
            raw=urllib.request.urlopen('http://127.0.0.1:18093/'+name,timeout=15).read()
            if sha(raw)!=expected:raise ValueError('线上静态内容不符：'+name)
        if services()!=before:raise ValueError('其他项目服务状态或 PID 发生变化，需调查')
    except BaseException:
        switch(old,rid+'-rollback')
        raise
    print(json.dumps({'release':str(new),'previous':str(old),'git_sha':manifest['git_sha'],'video_sha256':VIDEO_SHA,'services_unchanged':True,'nginx_changed':False},indent=2))

if __name__=='__main__':main()
