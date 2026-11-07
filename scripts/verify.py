#!/usr/bin/env python3
"""Offline consistency audit of Motion Atlas assets and Skill library. Python stdlib only."""
from pathlib import Path
from collections import Counter
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / 'web'
SOURCE = ROOT / 'style-library'
DATA_JS = WEB / 'js' / 'data.js'
KNOWN = {'AG': 26, 'M': 40, 'K': 38, 'Z': 15, 'H': 12, 'L': 59, 'V': 15, 'X': 31, 'R': 7, 'O': 98}
EXPECTED_BLANK = {'M14', 'M15', 'M16', 'M17', 'M26', 'M35', 'M39', 'M40'}
errors = []


def check(cond, label):
    print(('PASS' if cond else 'FAIL') + ' ' + label)
    if not cond:
        errors.append(label)


def main():
    check(DATA_JS.exists(), 'web/js/data.js exists')
    if not DATA_JS.exists():
        return 2
    src = DATA_JS.read_text('utf-8')
    prefix = 'window.MOTION_ATLAS_DATA = '
    check(src.startswith(prefix) and src.rstrip().endswith(';'), 'JavaScript data envelope')
    try:
        rows = json.loads(src[len(prefix):].strip().removesuffix(';'))
    except Exception as exc:
        print('Cannot parse data:', exc)
        return 2
    ids = [r['id'] for r in rows]
    check(len(rows) == 341, 'all 341 records')
    check(len(set(ids)) == 341, 'all IDs unique')
    got = Counter(x['series'] for x in rows)
    check(dict(got) == KNOWN, '10 series and exact original counts')
    check(sum(bool(x['image']) for x in rows) == 193, '193 original stills mapped')
    check({x['id'] for x in rows if x['missingPrompt']} == EXPECTED_BLANK, '8 original empty prompts preserved/flagged')
    check(len(list((SOURCE/'风格提示词').rglob('*.md'))) == 341, 'original 341 Markdown files present')
    check(len(list((WEB/'assets/stills').glob('*'))) == 193, '193 still images copied')
    check((ROOT/'.dsh/skills/fy-code-animation/SKILL.md').is_file(), 'full Skill installed in project')
    check((SOURCE/'许可与来源.md').is_file() and (SOURCE/'第三方许可').is_dir(), 'original style licenses and attributions')
    check((ROOT/'.dsh/skills/fy-code-animation/LICENSE.md').is_file(), 'Skill license retained')
    for index, row in enumerate(rows, 1):
        path = SOURCE / row['path']
        if not path.is_file():
            errors.append(f'{row["id"]} missing original Markdown')
            continue
        content = path.read_text(encoding='utf-8-sig')
        if content != row['markdown']:
            errors.append(f'{row["id"]} prompt content mismatch')
        if hashlib.sha256(path.read_bytes()).hexdigest() != row['sha256']:
            errors.append(f'{row["id"]} SHA mismatch')
        if row['image']:
            image = WEB/row['image']
            original = path.with_suffix(image.suffix)
            if not image.is_file() or not original.is_file() or hashlib.sha256(image.read_bytes()).digest() != hashlib.sha256(original.read_bytes()).digest():
                errors.append(f'{row["id"]} still missing or modified')
        if not re.fullmatch(r'[A-Z]+\d+', row['id']):
            errors.append(f'{row["id"]} malformed ID')
    print(('PASS' if not errors else 'FAIL') + ' 341 full texts, 341 hashes and 193 image hashes')
    html = (WEB/'index.html').read_text(encoding='utf-8')
    for name in ('css/app.css','js/data.js','js/app.js','favicon.svg'):
        check((WEB/name).is_file() and name in html, f'web resource {name}')
    for name in ('prompts/01_部署并私有推送_DeepSeekHarness.md','prompts/02_通用动画制作_DeepSeekHarness.md','docs/Skill接入与效果验证.md','docs/从网页到最终成片_完整流程.md','docs/上线与回滚.md'):
        check((ROOT/name).is_file(), f'guide {name}')
    print('\nOVERALL:', 'PASS' if not errors else f'FAIL ({len(errors)} checks)')
    if errors:
        for detail in errors[:30]:
            print(' -', detail)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
