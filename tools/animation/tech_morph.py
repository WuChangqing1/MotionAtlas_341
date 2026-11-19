"""L42 generated UI disorder -> decisive action -> ordered grid; V6 persistent topology."""
import math
import random
from PIL import ImageDraw
from .drawing import Canvas, clamp, ease, scene_at

STYLE_IDS = {'L42', 'V6'}
GRAMMAR = 'L42: 48px 细网格、三级暗面、单一亮色、原创界面由混乱归位、光扫显影；V6: 同一闭合轮廓保留点序，圆形中介连接方形，连续形变叠加旋转与 12% 挤压拉伸，无贴图替换。'


class Renderer:
    def __init__(self,task):
        self.task=task; self.c=Canvas(task)
        rng=random.Random(task['seed'])
        self.scatter=[(rng.uniform(.15,.85),rng.uniform(.52,.88)) for _ in range(12)]

    def render(self,t):
        c=self.c; w,h=c.w,c.h; dur=self.task['duration_seconds']; u=t/dur
        im=c.bg.copy(); d=ImageDraw.Draw(im,'RGBA'); accent=(183,243,74)
        if 'L42' in self.task['style_ids']:
            step=max(16,round(48*c.scale))
            for x in range(0,w,step):d.line((x,0,x,h),fill=(255,255,255,15 if x%(step*4)==0 else 8))
            for y in range(0,h,step):d.line((0,y,w,y),fill=(255,255,255,8))
            for i,(sx,sy) in enumerate(self.scatter):
                p=ease((u-.18-i*.006)/.26)
                tx=.32+(i%4)*.12;ty=.63+(i//4)*.085
                x=(sx+(tx-sx)*p)*w; y=(sy+(ty-sy)*p)*h
                ww=min(w*.095,h*.20);hh=h*.06
                light=.08+.92*ease((t-(x/w)*.65)/.55)
                surface=tuple(round(v*light) for v in (24+5*(i%3),29+5*(i%3),39+5*(i%3)))
                d.rounded_rectangle((x-ww/2,y-hh/2,x+ww/2,y+hh/2),radius=max(3,int(8*c.scale)),fill=(*surface,235),outline=(255,255,255,round(35*light)))
                d.line((x-ww*.32,y-hh*.15,x+ww*.23,y-hh*.15),fill=(185,192,205,round(120*light)),width=1)
                d.line((x-ww*.32,y+hh*.18,x+ww*.06,y+hh*.18),fill=(125,138,157,round(100*light)),width=1)
            # A single accent cursor is the decisive action, never borrowed UI/branding.
            cx=(.18+.64*ease((u-.08)/.35))*w;cy=h*.58
            if u<.49:d.polygon([(cx,cy),(cx,cy+20*c.scale),(cx+13*c.scale,cy+13*c.scale)],fill=accent)
        s=scene_at(self.task,t)
        c.text(d,s['text'],h*.23,max_size=72,height=.25)
        if 'V6' in self.task['style_ids']:
            # Circle intermediate, 3-frame cushions, then a compact morph pulse.
            phase=clamp((t-.1)/max(.1,dur-.2))*4
            cycle=min(3,int(phase)); local=phase-cycle
            p=ease(clamp((local-.1)/.8)) if cycle%2==0 else 1-ease(clamp((local-.1)/.8))
            pulse=math.sin(math.pi*p)
            rotation=.12*pulse*(1 if cycle%2==0 else -1)
            r=min(w*.15,h*.17);cx=w*.5;cy=h*.5
            points=[]
            for i in range(128):
                a=-math.pi/2+i*2*math.pi/128
                circle=r
                square=r*.8/max(abs(math.cos(a)),abs(math.sin(a)))
                rr=circle+(square-circle)*p
                xx=math.cos(a)*rr*(1+.12*pulse);yy=math.sin(a)*rr*(1-.12*pulse)
                points.append((cx+xx*math.cos(rotation)-yy*math.sin(rotation),cy+xx*math.sin(rotation)+yy*math.cos(rotation)))
            d.polygon(points,fill=(183,243,74,20))
            d.line(points+[points[0]],fill=accent,width=max(2,int(3*c.scale)))
        return im
