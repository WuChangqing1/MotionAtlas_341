"""Common background, safe typography and time-only drawing context."""
import math
import os
from functools import lru_cache
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


def clamp(p):
    return max(0., min(1., p))


def ease(p):
    return .5 - .5 * math.cos(math.pi * clamp(p))


class Canvas:
    def __init__(self, task, serif=False):
        self.task = task
        self.w, self.h = task['width'], task['height']
        self.scale = min(self.w / 1920, self.h / 1080)
        self.font_path = self.find_font(serif)
        # A1 dark gradient, L42 upper light lift. Neither uses static substitute images.
        self.bg = Image.new('RGB', (self.w, self.h))
        d = ImageDraw.Draw(self.bg)
        for y in range(self.h):
            p = y / self.h
            d.line((0, y, self.w, y), fill=(int(11 - 6*p), int(14 - 8*p), int(21 - 13*p)))
        self._draw = ImageDraw.Draw(self.bg)

    @staticmethod
    def find_font(serif):
        candidates = [os.environ.get('MOTION_ATLAS_FONT', ''),
                      'C:/Windows/Fonts/NotoSerifSC-VF.ttf' if serif else 'C:/Windows/Fonts/NotoSansSC-VF.ttf',
                      '/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc' if serif else '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
                      'C:/Windows/Fonts/msyh.ttc']
        for path in candidates:
            if path and Path(path).is_file():
                return str(Path(path).resolve())
        raise ValueError('缺少中文字体：请设置 MOTION_ATLAS_FONT 指向本机可用中文字体；未自动安装')

    @lru_cache(maxsize=64)
    def font(self, size):
        font = ImageFont.truetype(self.font_path, max(12, int(size)))
        try:
            axes = font.get_variation_axes()
            font.set_variation_by_axes([500 if a['name'] == b'Weight' else a['default'] for a in axes])
        except OSError:
            pass  # Static fonts have no variation axes.
        return font

    def wrap(self, text, font, width):
        lines = []; current = ''
        for ch in text:
            if ch == '\n':
                lines.append(current); current = ''; continue
            if current and self._draw.textlength(current+ch, font=font) > width:
                lines.append(current); current = ch
            else:
                current += ch
        lines.append(current)
        return lines

    def layout(self, text, max_size=84, width=.78, height=.4):
        for size in range(max(13, int(max_size*self.scale)), 11, -2):
            font = self.font(size)
            lines = self.wrap(text, font, self.w*width)
            line_h = sum(font.getmetrics()) + size*.2
            if len(lines)*line_h <= self.h*height:
                return font, lines, line_h
        raise ValueError('文案超出可读安全区：请让 DSH 增加 scenes 分段或延长时长，不截断原文')

    def text(self, draw, text, y, color=(236,232,223), max_size=84, width=.78, height=.4, reveal=None):
        font, lines, line_h = self.layout(text, max_size, width, height)
        y0 = y - len(lines)*line_h/2
        remaining = len(text) if reveal is None else reveal
        last = (self.w*.11, y)
        for i, line in enumerate(lines):
            visible = line[:max(0, remaining)]
            x = (self.w-draw.textlength(line, font=font))/2
            yy = y0+i*line_h
            draw.text((x,yy),visible,font=font,fill=color,anchor='lt')
            if visible:
                last = (x+draw.textlength(visible,font=font)+font.size*.12, yy)
            remaining -= len(line)
        return last, font.size


def scene_at(task, t):
    scenes = task.get('scenes') or [{'start':0,'end':task['duration_seconds'],'text':task['brief']}]
    return next((s for s in scenes if s['start'] <= t < s['end']), scenes[-1])
