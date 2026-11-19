"""Real audio, H.264 encoding and decoded-media verification."""
import hashlib
import json
import math
import re
import shutil
import struct
import subprocess
import wave
from fractions import Fraction
from pathlib import Path


def digest(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda:f.read(1024*1024), b''):h.update(block)
    return h.hexdigest()


def run(command, **kwargs):
    return subprocess.run(command,check=True,capture_output=True,text=True,encoding='utf-8',errors='replace',**kwargs)


def require_tools():
    for name in ('ffmpeg','ffprobe'):
        if not shutil.which(name):raise ValueError(f'缺少 {name}：请使用本机现有工具并配置 PATH，未自动安装')


def validate_audio(task):
    audio=task['audio']
    if audio.get('narration') not in (None,'','不需要旁白','由 DSH 判断'):
        raise ValueError('此入口尚未实现真实旁白；请让 DSH 接入本机可用语音文件/适配并检查，不能用氛围床冒充旁白')
    if audio.get('sfx') not in (None,'','无音效'):
        raise ValueError('此入口尚未实现按镜头音效；请让 DSH 接入真实音效生成/混音后再执行，不能静默忽略')


def synth_audio(path, duration):
    """One deliberately simple ambient bed, not four music auditions."""
    sr=44100
    with wave.open(str(path),'wb') as wav:
        wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(sr)
        for start in range(0,round(sr*duration),sr):
            data=bytearray()
            for i in range(start,min(start+sr,round(sr*duration))):
                t=i/sr; env=min(1,t/1.2,(duration-t)/1.5)
                v=env*(.025*math.sin(2*math.pi*110*t)+.013*math.sin(2*math.pi*164.81*t)+.01*math.sin(2*math.pi*220*t))
                data.extend(struct.pack('<h',round(v*32767)))
            wav.writeframes(data)


def encode(renderer, task, mp4, audio, out):
    command=['ffmpeg','-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24',
             '-s',f"{task['width']}x{task['height']}",'-r',str(task['fps']),'-i','pipe:0']
    if audio:command+=['-i',str(audio)]
    command+=['-map','0:v:0','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',
              '-frames:v',str(round(task['fps']*task['duration_seconds']))]
    if audio:command+=['-map','1:a:0','-c:a','aac','-b:a','128k']
    command+=['-movflags','+faststart',str(mp4)]
    (out/'encode_command.json').write_text(json.dumps(command,ensure_ascii=False,indent=2),'utf-8')
    with (out/'ffmpeg.log').open('w',encoding='utf-8') as log:
        process=subprocess.Popen(command,stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=log)
        try:
            for frame in range(round(task['fps']*task['duration_seconds'])):
                process.stdin.write(renderer.render(frame/task['fps']).convert('RGB').tobytes())
                if frame%150==0:print(f'render {frame}/{round(task["fps"]*task["duration_seconds"])}',flush=True)
            process.stdin.close()
            code=process.wait(timeout=120)
            if code:raise RuntimeError(f'ffmpeg exit {code}；查看 {out/"ffmpeg.log"}')
        except BaseException:
            if process.poll() is None:process.kill()
            process.wait()
            raise
    return command


def inspect(mp4,task,out):
    probe=json.loads(run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(mp4)]).stdout)
    video=next((s for s in probe['streams'] if s['codec_type']=='video'),None)
    if not video:raise ValueError('MP4 中没有视频流')
    expected=round(task['fps']*task['duration_seconds'])
    checks={'codec':video['codec_name']=='h264','width':video['width']==task['width'],
            'height':video['height']==task['height'],'fps':Fraction(video['avg_frame_rate'])==task['fps'],
            'frames':int(video.get('nb_read_frames',0))==expected,
            'duration':abs(float(video['duration'])-task['duration_seconds'])<=1/task['fps']}
    audios=[s for s in probe['streams'] if s['codec_type']=='audio']
    checks['audio']=(not audios if task['audio']['mode']=='none' else bool(audios) and audios[0]['codec_name']=='aac' and abs(float(audios[0]['duration'])-task['duration_seconds'])<.1)
    # Fully decode every video frame, not merely inspect metadata.
    run(['ffmpeg','-v','error','-i',str(mp4),'-map','0:v:0','-f','null','-'])
    black=run(['ffmpeg','-hide_banner','-i',str(mp4),'-vf','blackdetect=d=0.15:pix_th=0.02:pic_th=0.98','-an','-f','null','-']).stderr
    (out/'blackdetect.log').write_text(black,'utf-8')
    intervals=re.findall(r'black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)',black)
    checks['unexpected_black']=not intervals
    if not all(checks.values()):
        (out/'failed_media_checks.json').write_text(json.dumps({'checks':checks,'ffprobe':probe,'black_intervals':intervals},indent=2),'utf-8')
        raise ValueError('媒体检查失败：'+', '.join(k for k,v in checks.items() if not v))
    stills=[]
    for i,t in enumerate(task['still_times']):
        frame=min(expected-1,round(t*task['fps'])); actual=frame/task['fps']
        path=out/'stills'/f'encoded_{i+1}_{actual:.3f}s.png'
        run(['ffmpeg','-y','-v','error','-i',str(mp4),'-ss',str(actual),'-frames:v','1',str(path)])
        if not path.is_file():raise ValueError(f'无法提取编码后静帧：{actual}')
        stills.append({'path':path.relative_to(out).as_posix(),'time_seconds':actual,'sha256':digest(path),'bytes':path.stat().st_size})
    return probe,checks,stills
