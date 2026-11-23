"""builds assets/readme/card.svg: gk's roles and live github stats. re-run it to refresh the numbers"""
import json
import os
import urllib.request

USER = 'gkson-lab'
TOKEN = os.environ.get('GITHUB_TOKEN', '')


def api(path):
    req = urllib.request.Request('https://api.github.com' + path, headers={'Accept': 'application/vnd.github+json', 'User-Agent': 'gk-card'})
    if TOKEN:
        req.add_header('Authorization', 'Bearer ' + TOKEN)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def count(kind, q):
    return api('/search/%s?per_page=1&q=%s' % (kind, urllib.request.quote(q)))['total_count']


repos = api('/search/repositories?per_page=100&q=' + urllib.request.quote('user:' + USER + ' fork:true'))['items']
try:
    followers = api('/users/' + USER)['followers']
except Exception:
    followers = 0
stats = [
    ('commits', count('commits', 'author:' + USER)),
    ('prs', count('issues', 'author:%s is:pr' % USER)),
    ('merged', count('issues', 'author:%s is:pr is:merged' % USER)),
    ('issues', count('issues', 'author:%s is:issue' % USER)),
    ('repos', len(repos)),
    ('stars', sum(r['stargazers_count'] for r in repos)),
    ('followers', followers),
]
roles = ['founder &amp; project lead · gk-labs', 'oreon developer']

W, H = 720, 210
cells = ''
cw = (W - 64) / len(stats)
for i, (label, value) in enumerate(stats):
    x = 32 + i * cw + cw / 2
    cells += ('<text x="%.0f" y="150" class="v">%s</text>'
              '<text x="%.0f" y="174" class="l">%s</text>') % (x, value, x, label)
role_text = ''.join('<text x="32" y="%d" class="r">%s</text>' % (88 + i * 26, r) for i, r in enumerate(roles))

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="gk: {', '.join(roles)}; {', '.join(f'{v} {k}' for k, v in stats)}">
<defs>
<linearGradient id="chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#9aa0aa"/><stop offset=".55" stop-color="#6e727b"/><stop offset="1" stop-color="#f1f2f4"/></linearGradient>
<linearGradient id="oil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd23d"/><stop offset=".3" stop-color="#ff4a3d"/><stop offset=".6" stop-color="#3d6bff"/><stop offset="1" stop-color="#19e0b0"/></linearGradient>
</defs>
<style>
text{{font-family:'Iowan Old Style',Georgia,serif}}
.t{{font-size:40px;fill:url(#chrome)}}
.o{{font-size:40px;fill:url(#oil)}}
.r{{font:15px ui-sans-serif,system-ui,sans-serif;fill:#c9ccd3}}
.v{{font-size:26px;fill:url(#chrome);text-anchor:middle}}
.l{{font:12px ui-sans-serif,system-ui,sans-serif;fill:#8d929c;text-anchor:middle}}
</style>
<rect width="{W}" height="{H}" rx="14" fill="#0b0b0d"/>
<rect x=".5" y=".5" width="{W-1}" height="{H-1}" rx="14" fill="none" stroke="#2a2a30"/>
<text x="31" y="54" class="o" opacity=".8">gk</text>
<text x="32" y="52" class="t">gk</text>
{role_text}
<rect x="32" y="118" width="{W-64}" height="1" fill="url(#oil)" opacity=".55"/>
{cells}
</svg>'''
os.makedirs('assets/readme', exist_ok=True)
open('assets/readme/card.svg', 'w').write(svg)
print(stats)
