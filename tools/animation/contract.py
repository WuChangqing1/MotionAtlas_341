"""Task schema shared with web/js/task-contract.js; validate before rendering."""
import hashlib
import json
import math
import re
from pathlib import Path


def load_task(source):
    task = json.loads(Path(source).read_text('utf-8-sig')) if not isinstance(source, dict) else dict(source)
    if not isinstance(task.get('brief'), str) or not task['brief'].strip():
        raise ValueError('brief 缺失：请填写一句动画想法')
    required = ['schema_version', 'task_id', 'phase', 'duration_seconds', 'width', 'height', 'fps', 'styles', 'style_ids', 'audio']
    missing = [k for k in required if k not in task]
    if missing:
        raise ValueError('task.json 缺少字段：' + ', '.join(missing) + '；请从新版网页重新导出')
    if task['schema_version'] != 1:
        raise ValueError('schema_version 必须为 1；请从新版网页重新导出')
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,100}', str(task['task_id'])):
        raise ValueError('task_id 仅允许字母、数字、横线和下划线')
    if task['phase'] not in ('card', 'still', 'audition', 'final'):
        raise ValueError('phase 需为 card/still/audition/final')
    for k in ('width', 'height'):
        v = task[k]
        if type(v) is not int or not 256 <= v <= 3840 or v % 2:
            raise ValueError(f'{k} 需为 256–3840 内的偶数')
    if task['fps'] not in (24, 25, 30, 60):
        raise ValueError('fps 需为 24/25/30/60')
    duration = task['duration_seconds']
    if type(duration) not in (int, float) or not math.isfinite(duration) or not 3 <= duration <= 300:
        raise ValueError('duration_seconds 需为 3–300 秒')
    if abs(duration * task['fps'] - round(duration * task['fps'])) > 1e-6:
        raise ValueError('duration_seconds × fps 必须为整数帧')
    if not isinstance(task['styles'], list) or not task['styles']:
        raise ValueError('styles 不能为空：请从网站选择完整风格')
    ids = [s.get('id') for s in task['styles'] if isinstance(s, dict)]
    if len(ids) != len(task['styles']) or ids != task['style_ids'] or len(ids) != len(set(ids)):
        raise ValueError('style_ids 与 styles 需按顺序一致，且不能重复')
    if not isinstance(task['audio'], dict) or task['audio'].get('mode') not in ('none', 'ambient'):
        raise ValueError('audio.mode 需为 none 或 ambient')
    if task['phase'] == 'final' and task.get('authorization', {}).get('final_render') is not True:
        raise ValueError('final 任务缺少 authorization.final_render=true；请使用成片 Prompt 导出')
    task.setdefault('seed', 341)
    if type(task['seed']) is not int:
        raise ValueError('seed 必须是整数')
    scenes = task.get('scenes')
    if scenes is not None:
        if not isinstance(scenes, list) or not scenes:
            raise ValueError('scenes 需为非空数组，或省略后直接使用 brief')
        end = 0
        for i, scene in enumerate(scenes):
            if not isinstance(scene, dict) or not isinstance(scene.get('text'), str) or not scene['text'].strip():
                raise ValueError(f'scenes[{i}].text 需为真实文案')
            a, b = scene.get('start'), scene.get('end')
            if type(a) not in (int, float) or type(b) not in (int, float) or not (a == end and a < b <= duration):
                raise ValueError(f'scenes[{i}] 需用秒连续覆盖全片，start 应为 {end}')
            end = b
        if end != duration:
            raise ValueError('scenes 最后一个 end 必须等于 duration_seconds')
    times = task.get('still_times', [duration * p for p in (.2, .5, .85)])
    if not isinstance(times, list) or not times or any(type(t) not in (int, float) or not 0 <= t < duration for t in times):
        raise ValueError('still_times 需为片内秒数数组（0 ≤ t < duration_seconds）')
    task['still_times'] = times
    return task


def verify_styles(task, library, project):
    library = Path(library).resolve()
    sources = []
    for style in task['styles']:
        sid, rel, expected = style.get('id'), style.get('path'), style.get('sha256')
        if not isinstance(sid, str) or not re.fullmatch(r'[A-Z]+\d+', sid):
            raise ValueError('风格 id 无效')
        if not isinstance(rel, str) or not rel.startswith('style-library/'):
            raise ValueError(f'{sid} path 需以 style-library/ 开头')
        path = (library / rel.removeprefix('style-library/')).resolve()
        if not path.is_relative_to(library / '风格提示词') or not path.name.startswith(sid + '_') or path.suffix != '.md':
            raise ValueError(f'{sid} path 与风格编号不符或越出风格库')
        if not path.is_file():
            raise ValueError(f'{sid} 原文不存在：{path}')
        raw = path.read_bytes()
        sha = hashlib.sha256(raw).hexdigest()
        if not isinstance(expected, str) or sha != expected.lower():
            raise ValueError(f'{sid} SHA256 不一致：期望 {expected}，实际 {sha}；请核对原文或重新导出')
        markdown = raw.decode('utf-8-sig')
        if len(markdown.strip()) < 50:
            raise ValueError(f'{sid} 完整原文缺失；不能生成替代风格')
        sources.append({'id': sid, 'path': rel, 'sha256': sha, 'bytes': len(raw), 'markdown': markdown})
    return sources
