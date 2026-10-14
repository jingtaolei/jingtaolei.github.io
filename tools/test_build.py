"""Publication hygiene and cache-compatibility regression checks."""
from datetime import date
import json
from pathlib import Path
import tempfile
import unittest
from prepare_assets import prepare
from build_site import build, protected_assets, archive_unused

class Publishing(unittest.TestCase):
    def test_single_active_collection_pipeline(self):
        source = Path(__file__).resolve().parents[1]
        for name in ('index.html', 'privacy.html'):
            self.assertNotIn('beacon.min.js', (source / name).read_text())
        self.assertIn("sendAnonymousEvent('page_view'", (source / 'script.js').read_text())
        self.assertIn('jingtao-collection.pages.dev/event', (source / 'analytics-config.js').read_text())

    def test_retention_and_clean_output(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / 'site'
            (root / 'tools').mkdir(parents=True)
            (root / 'design-notes').mkdir()
            (root / 'design-notes/reference.jpg').write_bytes(b'large unused reference')
            (root / 'favicon.ico').write_bytes(b'icon')
            page = '<head><link href="style.css"></head><a href="#research">Research</a>'
            for name in ('index.html', 'privacy.html', 'analytics-check.html'):
                (root / name).write_text(page)
            (root / 'style.css').write_text('body { color: green; }')
            first, a = prepare(root)
            (root / 'style.css').write_text('body { color: olive; }')
            second, b = prepare(root)
            (root / 'style.css').write_text('body { color: teal; }')
            prepare(root)
            # Local rebuilds do not count as published releases; only these records protect old assets.
            history = {'releases': [
                {'release': second, 'retain_until': '2000-01-01', 'assets': b},
                {'release': first, 'retain_until': '2030-01-01', 'assets': a}]}
            record = root / 'tools/published-releases.json'
            record.write_text(json.dumps(history))
            protected = protected_assets(root, date(2026,10,14))
            self.assertIn(a['style.css'], protected)
            self.assertIn(b['style.css'], protected)
            build(root, today=date(2026,10,14))
            build(root, check=True, today=date(2026,10,14))
            self.assertFalse((root / 'dist/design-notes').exists())
            self.assertFalse((root / 'dist/style.css').exists())
            self.assertTrue((root / 'dist'/a['style.css']).exists())
            # A prior release may retire after its grace period; the newest live release cannot.
            history['releases'][1]['retain_until'] = '2000-01-01'
            record.write_text(json.dumps(history))
            self.assertNotIn(a['style.css'], protected_assets(root))
            self.assertIn(b['style.css'], protected_assets(root))
            moved = archive_unused(root)
            self.assertEqual(len(json.loads(record.read_text())['releases']), 1)
            self.assertIn(Path(a['style.css']).name, moved)
            self.assertTrue((root.parent/'website-archive/unused-fingerprints'/Path(a['style.css']).name).exists())
            self.assertFalse((root/a['style.css']).exists())
            build(root)
            (root / 'dist/unexpected.txt').write_text('not part of the release')
            with self.assertRaises(ValueError):
                build(root, check=True)
            # Broken cached-release dependencies must fail, not silently drop the file.
            (root/b['style.css']).unlink()
            with self.assertRaises(ValueError):
                protected_assets(root)

if __name__ == '__main__':
    unittest.main()
