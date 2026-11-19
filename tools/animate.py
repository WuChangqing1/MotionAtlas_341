#!/usr/bin/env python3
"""One task, one output: python tools/animate.py --task task.json --out outputs/new/video"""
import argparse
import importlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys

from animation.contract import load_task, verify_styles

ROOT=Path(__file__).resolve().parents[1]
SKILL=ROOT/'.dsh/skills/fy-code-animation'


def write_json(path,value):
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n','utf-8')


def doctor(library,out):
    command=[sys.executable,str(SKILL/'scripts/doctor.py'),'--root',str(library)]
    if os.environ.get('MOTION_ATLAS_STYLE_INDEX'):
        command+=['--index',os.environ['MOTION_ATLAS_STYLE_INDEX']]
    p=subprocess.run(command,capture_output=True,text=True,encoding='utf-8',errors='replace')
    (out/'doctor.json').write_text(p.stdout or p.stderr,'utf-8')
    if p.returncode:
        raise ValueError('doctor 未通过；查看 doctor.json。索引过期时可将 style_library.py build --index 指向可写目录，再修复索引；未修改只读 Skill')
    report=json.loads(p.stdout)
    if not report.get('ready'):raise ValueError('doctor ready=false；停止制作')
    return report


def renderer_for(task):
    ids=set(task['style_ids'])
    # DSH can add a project-owned module without expanding a giant switch statement.
    custom=task.get('renderer')
    if custom is not None:
        if not isinstance(custom,str) or not custom.startswith('animation.') or not all(part.isidentifier() for part in custom.split('.')):
            raise ValueError('renderer 需为 animation.<模块名>')
        mod=importlib.import_module(custom)
        if ids <= set(mod.STYLE_IDS):return mod
        raise ValueError(f'{custom} 的 STYLE_IDS 不包含全部所选风格')
    for name in ('rain_type','tech_morph'):
        mod=importlib.import_module('animation.'+name)
        if ids <= mod.STYLE_IDS:return mod
    raise ValueError('所选风格暂无内置适配：'+', '.join(task['style_ids'])+'。请让 DSH 按完整原文实现 tools/animation/ 独立模块（STYLE_IDS/GRAMMAR/Renderer.render(t)），在 task.renderer 指定 animation.<模块名>；禁止套用无关风格。')


def renderer_info(mod,renderer):
    from animation.media import digest
    return {'module':mod.__name__,'grammar':mod.GRAMMAR,
            'font':getattr(getattr(renderer,'c',None),'font_path',None),
            'source_sha256':digest(Path(mod.__file__))}


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--task',required=True,type=Path)
    ap.add_argument('--out',required=True,type=Path)
    args=ap.parse_args()
    out=args.out.resolve(); stage='output'
    # Never overwrite history, even when a previous task failed.
    if out.exists() and any(out.iterdir()):
        print('ERROR [output] 输出目录非空；请使用新的输出目录，旧产物不会覆盖',file=sys.stderr)
        return 2
    out.mkdir(parents=True,exist_ok=True)
    try:
        stage='task'; task=load_task(args.task)
        write_json(out/'task.json',task)
        library=Path(os.environ.get('FY_STYLE_LIBRARY_ROOT',str(ROOT/'style-library'))).resolve()
        stage='doctor'; report=doctor(library,out)
        stage='styles'; sources=verify_styles(task,library,ROOT)
        (out/'sources').mkdir()
        for src in sources:(out/'sources'/f'{src["id"]}.md').write_text(src['markdown'],'utf-8')
        manifest={'schema_version':1,'task_id':task['task_id'],'phase':task['phase'],'task':task,
                  'source_styles':[{k:v for k,v in s.items() if k!='markdown'} for s in sources],
                  'doctor_ready':report['ready'],'machine_checks':{},'files':[],
                  'human_review':'未完整观看；静帧待实际打开检查','author_adoption':'待作者判断'}
        if task['phase']=='card':
            (out/'TASK_CARD.md').write_text(f'# {task.get("title",task["task_id"])}\n\n{task["brief"]}\n\n风格：'+', '.join(task['style_ids'])+'\n\n阶段 card，仅任务文本。观众/核心/分镜若未提供，属于建议/待确认；未生成媒体。','utf-8')
        else:
            stage='dependencies'
            from animation.media import require_tools,synth_audio,encode,inspect,digest,validate_audio
            require_tools()
            if task['phase'] in ('final','audition'):validate_audio(task)
            if task['phase']=='audition':
                if task['audio']['mode']!='ambient':raise ValueError('audition 需 audio.mode=ambient；无音频请改用 card')
                (out/'audio').mkdir();synth_audio(out/'audio/ambient.wav',task['duration_seconds'])
                manifest['audio_note']='真实本机合成的一条氛围床，未生成四案试听'
            else:
                stage='renderer';mod=renderer_for(task);renderer=mod.Renderer(task)
                manifest['renderer']=renderer_info(mod,renderer)
                # Render in non-linear order and compare actual pixels for the same seek.
                duration=task['duration_seconds'];sample=duration*.5
                first=renderer.render(sample).tobytes()
                renderer.render(0);renderer.render(duration-1/task['fps'])
                if first!=renderer.render(sample).tobytes():raise ValueError('render(t) 任意 seek 确定性检查失败')
                manifest['machine_checks']['seek_deterministic']=True
                (out/'stills').mkdir()
                if task['phase']=='still':
                    for i,t in enumerate(task['still_times']):renderer.render(t).save(out/'stills'/f'still_{i+1}_{t:.3f}s.png')
                else:
                    audio=None
                    if task['audio']['mode']=='ambient':
                        stage='audio';(out/'audio').mkdir();audio=out/'audio/ambient.wav';synth_audio(audio,duration)
                    manifest['audio_note']='一条本机合成极简氛围床；未生成四案音乐' if audio else '未生成音乐，使用无音乐成片'
                    (out/'video').mkdir();mp4=out/'video'/f'{task["task_id"]}.mp4'
                    stage='encode';encode(renderer,task,mp4,audio,out)
                    stage='media_qa';probe,checks,stills=inspect(mp4,task,out)
                    manifest.update(ffprobe=probe,encoded_stills=stills)
                    manifest['machine_checks'].update(checks)
                    manifest['video']={'path':mp4.relative_to(out).as_posix(),'sha256':digest(mp4),'bytes':mp4.stat().st_size}
        from animation.media import digest
        for path in sorted(out.rglob('*')):
            if path.is_file():manifest['files'].append({'path':path.relative_to(out).as_posix(),'sha256':digest(path),'bytes':path.stat().st_size})
        write_json(out/'render_manifest.json',manifest)
        (out/'QA_REPORT.md').write_text(f'# QA {task["task_id"]}\n\n阶段：{task["phase"]}；入口退出码：0\n\n机器检查：{json.dumps(manifest["machine_checks"],ensure_ascii=False)}\n\n{manifest.get("audio_note","未生成音频")}\n\n人工：未完整观看。静帧需实际打开后在交付报告记录，不能由脚本宣称通过。\n\n作者采用：待作者判断。\n\n命令：python tools/animate.py --task {args.task} --out {args.out}\n','utf-8')
        print('DONE',out/'render_manifest.json',flush=True)
        return 0
    except Exception as exc:
        write_json(out/'failure.json',{'stage':stage,'error':str(exc),'exit_code':2})
        (out/'QA_REPORT.md').write_text(f'# 执行失败\n\n阶段：{stage}\n\n{exc}\n\n退出码 2。未声称成片通过。请使用新的输出目录重试。\n','utf-8')
        print(f'ERROR [{stage}] {exc}',file=sys.stderr,flush=True)
        return 2


if __name__=='__main__':
    raise SystemExit(main())
