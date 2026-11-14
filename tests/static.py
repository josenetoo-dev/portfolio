"""Check references, document metadata and SVG integrity without dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse, unquote
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
class Document(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids = []; self.links = []; self.images = []; self.h1 = 0; self.lang = None; self.metas = {}
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs: self.ids.append(attrs['id'])
        if tag == 'html': self.lang = attrs.get('lang')
        if tag == 'h1': self.h1 += 1
        if tag == 'meta': self.metas[attrs.get('name', attrs.get('property'))] = attrs.get('content')
        if tag == 'img':
            self.images.append(attrs)
            assert attrs.get('alt'), 'Image needs descriptive alternative text'
            assert attrs.get('width') and attrs.get('height'), 'Image dimensions missing'
        for field in ('href', 'src'):
            if attrs.get(field): self.links.append(attrs[field])
        if tag == 'a' and attrs.get('target') == '_blank':
            assert {'noopener','noreferrer'} <= set(attrs.get('rel', '').split()), 'Unsafe external target'

doc = Document(); doc.feed(ROOT.joinpath('index.html').read_text())
assert doc.lang == 'pt-BR' and doc.h1 == 1
assert len(doc.ids) == len(set(doc.ids)), 'Duplicate IDs'
for link in doc.links:
    parts = urlparse(link)
    if parts.scheme: continue
    if parts.path: assert ROOT.joinpath(unquote(parts.path)).is_file(), f'Missing file: {link}'
    if parts.fragment: assert parts.fragment in doc.ids, f'Missing anchor: {link}'
assert doc.metas.get('description') and doc.metas.get('og:image')
for path in ROOT.glob('assets/**/*.svg'): ET.parse(path)
ET.parse(ROOT/'sitemap.xml')
json.loads(ROOT.joinpath('vercel.json').read_text())
assert not list(ROOT.glob('assets/fonts/*.woff2')), 'Unintended font artifact'
print(f'PASS: metadata, {len(doc.ids)} unique IDs, {len(doc.links)} references, {len(doc.images)} images, SVG/XML/JSON integrity')
