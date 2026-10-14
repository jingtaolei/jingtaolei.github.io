#!/usr/bin/env python3
"""Prepare this static site for publishing; retain previous releases' assets."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
ASSET_TYPES = {'.css', '.js', '.jpg', '.jpeg', '.png', '.svg', '.ico', '.pdf', '.woff', '.woff2'}
ATTR = re.compile(r'\b(href|src)=(\"|\x27)(.*?)\2')
CSS_URL = re.compile(r'url\(\s*([\"\x27]?)(.*?)\1\s*\)')
RELEASE_META = re.compile(r'\s*<meta name="site-release" content="[a-f0-9]{12}"\s*/>')

def digest(data):
    return hashlib.sha256(data).hexdigest()[:12]

def write_atomic(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as tmp:
        tmp.write(data)
        name = tmp.name
    os.replace(name, path)


def prepare(root=ROOT, check=False):
    root = root.resolve()
    manifest_path = root / 'asset-manifest.json'
    previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    aliases = dict(previous.get('aliases', {}))
    current, output, visiting = {}, {}, set()

    def local_source(url, parent):
        parts = urlsplit(url)
        if parts.scheme or parts.netloc or not parts.path:
            return None
        candidate = (root / unquote(parts.path).lstrip('/')) if parts.path.startswith('/') else (parent / unquote(parts.path))
        candidate = candidate.resolve()
        if not candidate.is_relative_to(root):
            raise ValueError(f'Resource escapes site: {url}')
        rel = candidate.relative_to(root).as_posix()
        rel = aliases.get(rel, rel)
        if Path(rel).suffix.lower() not in ASSET_TYPES:
            return None
        if rel.startswith('assets/versioned/'):
            raise ValueError(f'Unknown generated resource: {rel}')
        return rel

    def asset(source):
        if source in current:
            return current[source]
        if source in visiting:
            raise ValueError(f'Circular CSS resource: {source}')
        visiting.add(source)
        path = root / source
        data = path.read_bytes()
        if path.suffix == '.css':
            def css_ref(match):
                src = local_source(match[2], path.parent)
                if src is None:
                    return match[0]
                target = asset(src)
                fragment = urlsplit(match[2]).fragment
                return f'url("{Path(target).name}{"#" + fragment if fragment else ""}")'
            data = CSS_URL.sub(css_ref, data.decode('utf-8')).encode('utf-8')
        target = f'assets/versioned/{path.stem}.{digest(data)}{path.suffix}'
        current[source] = target
        aliases[target] = source
        output[target] = data
        visiting.remove(source)
        return target

    pages = {}
    for name in ('index.html', 'privacy.html', 'analytics-check.html'):
        text = RELEASE_META.sub('', (root / name).read_text())
        def html_ref(match):
            source = local_source(match[3], root)
            if source is None:
                return match[0]
            fragment = urlsplit(match[3]).fragment
            return f'{match[1]}={match[2]}{asset(source)}{"#" + fragment if fragment else ""}{match[2]}'
        pages[name] = re.sub(r'\s*</head>', '\n</head>', ATTR.sub(html_ref, text))
    # Includes the entry pages themselves, so content-only edits also make a release.
    release = digest(json.dumps({'pages': pages, 'assets': current}, sort_keys=True).encode())
    for name, text in pages.items():
        output[name] = text.replace('</head>', f'  <meta name="site-release" content="{release}" />\n</head>').encode()
    output['site-version.json'] = (json.dumps({'id': release}) + '\n').encode()
    output['asset-manifest.json'] = (json.dumps({'release': release, 'assets': current, 'aliases': aliases}, indent=2, sort_keys=True) + '\n').encode()
    stale = [name for name, data in output.items() if not (root / name).exists() or (root / name).read_bytes() != data]
    if check:
        if stale:
            raise ValueError('Publish assets need preparation: ' + ', '.join(stale))
    else:
        # Write resources before entry pages. Old content-addressed resources are never pruned.
        for name, data in output.items():
            if name in stale:
                write_atomic(root / name, data)
    return release, current

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail if a source edit has not been prepared')
    args = parser.parse_args()
    try:
        release, assets = prepare(check=args.check)
        print(f'Release {release}: {len(assets)} resources {"verified" if args.check else "prepared"}.')
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        parser.exit(1, f'{exc}\n')
