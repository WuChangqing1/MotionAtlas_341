import copy
import json
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from animation.contract import load_task, verify_styles
import animate

class ContractTests(unittest.TestCase):
    def task(self):
        return json.loads((ROOT / 'examples/a1-a2.task.json').read_text('utf-8'))

    def test_valid_task_and_full_text(self):
        task = load_task(self.task())
        sources = verify_styles(task, ROOT / 'style-library', ROOT)
        self.assertEqual([s['id'] for s in sources], ['A1', 'A2'])
        self.assertTrue(all('## 风格提示词' in s['markdown'] for s in sources))

    def test_tampered_sha_identifies_style(self):
        task = self.task()
        task['styles'][1]['sha256'] = '0' * 64
        with self.assertRaisesRegex(ValueError, 'A2.*SHA256'):
            verify_styles(load_task(task), ROOT / 'style-library', ROOT)

    def test_incomplete_and_invalid_dimensions(self):
        with self.assertRaisesRegex(ValueError, 'brief'):
            load_task({})
        task = self.task(); task['width'] = 1919
        with self.assertRaisesRegex(ValueError, '偶数'):
            load_task(task)

    def test_card_creates_no_media_and_failure_records_stage(self):
        with tempfile.TemporaryDirectory() as td:
            base = Path(td); task = self.task(); task['phase'] = 'card'
            path = base / 'task.json'; path.write_text(json.dumps(task), 'utf-8')
            cmd = [sys.executable, str(ROOT/'tools/animate.py'), '--task', str(path), '--out', str(base/'card')]
            p = subprocess.run(cmd, capture_output=True)
            self.assertEqual(p.returncode, 0, p.stderr.decode(errors='replace'))
            self.assertFalse(list((base/'card').rglob('*.png')))
            task['styles'][0]['sha256'] = '0'*64
            path.write_text(json.dumps(task), 'utf-8')
            cmd[-1] = str(base/'bad')
            p = subprocess.run(cmd, capture_output=True)
            self.assertNotEqual(p.returncode, 0)
            failure = json.loads((base/'bad/failure.json').read_text('utf-8'))
            self.assertEqual(failure['stage'], 'styles')

    def test_explicit_renderer_takes_priority_and_needs_no_canvas_internal(self):
        task = self.task(); task['renderer'] = 'animation.custom_test'
        module = SimpleNamespace(STYLE_IDS={'A1','A2'},GRAMMAR='test',__name__='animation.custom_test',__file__=__file__)
        with patch.dict(sys.modules, {'animation.custom_test':module}):
            self.assertIs(animate.renderer_for(task),module)
            info = animate.renderer_info(module, SimpleNamespace())
            self.assertEqual(info['module'], 'animation.custom_test')

    def test_audio_requirements_are_not_silently_dropped(self):
        from animation.media import validate_audio
        task = self.task(); task['audio']['narration'] = '需要中文旁白'
        with self.assertRaisesRegex(ValueError, '旁白'):
            validate_audio(task)
        task['audio']['narration'] = '不需要旁白'; task['audio']['sfx'] = '按镜头设计音效'
        with self.assertRaisesRegex(ValueError, '音效'):
            validate_audio(task)

if __name__ == '__main__':
    unittest.main()
