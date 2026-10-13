"""Regression checks for coherent old/new static releases, using temporary fixtures."""
import json
from pathlib import Path
import tempfile
import unittest
from prepare_assets import prepare

class Releases(unittest.TestCase):
    def test_static_releases(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'art').mkdir()
            (root / 'art/paint.jpg').write_bytes(b'first painting')
            (root / 'style.css').write_text("body { background: url('art/paint.jpg'); }")
            page = '<head><link href="style.css"></head><a href="#research">Research</a>'
            for name in ('index.html', 'privacy.html'):
                (root / name).write_text(page)
            first, assets = prepare(root)
            old_html = (root / 'index.html').read_bytes()
            old_css = root / assets['style.css']
            old_data = old_css.read_bytes()
            self.assertIn(Path(assets['art/paint.jpg']).name, old_data.decode())
            self.assertEqual(prepare(root, check=True)[0], first)
            self.assertEqual(prepare(root)[0], first)
            (root / 'art/paint.jpg').write_bytes(b'changed painting')
            with self.assertRaises(ValueError):
                prepare(root, check=True)
            second, newer = prepare(root)
            self.assertNotEqual(first, second)
            self.assertNotEqual(assets['style.css'], newer['style.css'])
            self.assertEqual(old_css.read_bytes(), old_data)
            self.assertTrue((root / assets['art/paint.jpg']).exists())
            self.assertIn(b'href="#research"', (root / 'index.html').read_bytes())
            self.assertEqual(prepare(root, check=True)[0], second)
            # An old HTML snapshot can still resolve its assets and be rebuilt from current sources.
            (root / 'index.html').write_bytes(old_html)
            self.assertEqual(prepare(root)[0], second)
            page = (root / 'index.html').read_text().replace('>Research<', '>Research projects<')
            (root / 'index.html').write_text(page)
            self.assertNotEqual(prepare(root)[0], second)

if __name__ == '__main__':
    unittest.main()
