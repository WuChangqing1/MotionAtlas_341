"""A1 falling/accumulating words + A2 type/delete/return cursor grammar."""
import math
import random
from PIL import ImageDraw
from .drawing import Canvas, clamp, scene_at

STYLE_IDS = {'A1', 'A2'}
GRAMMAR = 'A1: 深色纵向渐变、多字号文字下落与底部累积、暖色地面光点；A2: 衬线字逐字输入、删除、重输、暖色光标。以闭式时间替代原文的累计 dt。'


class Renderer:
    def __init__(self, task):
        self.task = task; self.c = Canvas(task, serif=True)
        rng = random.Random(task['seed'])
        self.drops = [(rng.random(),rng.random(),rng.uniform(.07,.20),rng.choice([22,28,34,42,56])) for _ in range(26)]
        self.pile_sizes = [rng.choice([18,22,26]) for _ in range(60)]

    def render(self, t):
        c=self.c; w,h=c.w,c.h
        image=c.bg.copy(); d=ImageDraw.Draw(image,'RGBA')
        s=scene_at(self.task,t); text=s['text']; p=clamp((t-s['start'])/(s['end']-s['start']))
        words=s.get('rain_words') or [text[i:i+3] for i in range(0,min(len(text),24),3)]
        if 'A1' in self.task['style_ids']:
            for i,(x,offset,speed,size) in enumerate(self.drops):
                y=((offset+speed*t)*h)%(h*1.2)-h*.1
                # Leave the central reading window quiet.
                if .23*h<y<.72*h:
                    continue  # The entire reading window stays free of background words.
                alpha=130
                d.text((x*w,y),words[i%len(words)],font=c.font(int(size*c.scale)),fill=(214,224,242,alpha))
            count=min(60,int(t/self.task['duration_seconds']*60))
            for i in range(count):
                x=(.025+(i%12)*.079)*w; y=h*.97-(i//12)*h*.024
                d.text((x,y),words[i%len(words)],font=c.font(int(self.pile_sizes[i]*c.scale)),fill=(150,164,190,90))
            pulse=.55+.35*(1 if math.sin(t*5)>0 else .2)
            d.ellipse((w/2-5,h*.97-5,w/2+5,h*.97+5),fill=(241,178,92,int(255*pulse)))
        # A2 deletes a suffix then restores the full, unchanged source statement.
        n=len(text); deleted=max(1,n//4)
        if p<.24: reveal=round(n*clamp(p/.24))
        elif p<.4: reveal=n
        elif p<.49: reveal=n-round(deleted*(p-.4)/.09)
        elif p<.55: reveal=n-deleted
        elif p<.68: reveal=n-deleted+round(deleted*(p-.55)/.13)
        else: reveal=n
        if 'A2' not in self.task['style_ids']: reveal=n
        d.rounded_rectangle((w*.07,h*.27,w*.93,h*.70),radius=16,fill=(5,6,8,215))
        (cx,cy),size=c.text(d,text,h*.5,reveal=reveal)
        if 'A2' in self.task['style_ids'] and (int(t*1.8)%2==0 or p<.24):
            d.rectangle((cx,cy,cx+max(2,size*.07),cy+size*1.1),fill=(241,178,92,240))
        return image
