"""모아 둔 건물 원자료(data-sources/buildings/buildings.json)를 앱이 읽는 작은 파일로 옮긴다.

사용: python3 scripts/export_buildings.py   (collect_buildings.py 를 다시 돌린 뒤에)
결과: dist/data/buildings.json
- names : 앱 장소의 location.building 과 맞춰 볼 이름들 (공식 이름을 / 로 나눈 것 + 앱에서 다르게 부르는 이름)
- latlng: 건물 가운데 좌표 (OSM 외곽선의 가운데). 없으면 null — 앱 장소가 없는 건물도 이 자리에 핀을 올린다
- shape : 건물 바닥 모양(OSM 외곽선)을 가운데 기준 미터 좌표 [[동쪽, 북쪽], ...] 로. 건물 화면이 이 모양으로 층을 쌓는다. 없으면 null
- levels: 지상 층수 (OSM). 없으면 null
- floors: {"3": ["교직원식당", ...]} — 「1~9」처럼 여러 층에 걸친 안내는 층마다 넣는다
"""
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data-sources' / 'buildings' / 'buildings.json'
OUT = ROOT / 'dist' / 'data' / 'buildings.json'
GEO = ROOT / 'data-sources' / 'buildings' / 'osm-buildings.geojson'


def shape_of(feature):
    """외곽선(경도·위도) → 가운데를 0 으로 둔 미터 좌표. 반시계 방향으로 맞추고, 거의 일직선인 점은 뺀다"""
    if not feature:
        return None
    g = feature['geometry']
    ring = g['coordinates'][0] if g['type'] == 'Polygon' else max((p[0] for p in g['coordinates']), key=len)
    ring = ring[:-1] if ring[0] == ring[-1] else ring
    lon0 = sum(p[0] for p in ring) / len(ring)
    lat0 = sum(p[1] for p in ring) / len(ring)
    k = 111320 * math.cos(math.radians(lat0))
    pts = [((lon - lon0) * k, (lat - lat0) * 110540) for lon, lat in ring]
    area = sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(pts, pts[1:] + pts[:1]))
    if area < 0:
        pts.reverse()
    keep = []
    for i, b in enumerate(pts):
        a, c = pts[i - 1], pts[(i + 1) % len(pts)]
        cross = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
        if abs(cross) > 0.5 or math.dist(a, b) > 3:
            keep.append(b)
    return [[round(x, 1), round(y, 1)] for x, y in keep]

# 앱 장소 데이터가 공식 이름과 다르게 부르는 건물
ALIASES = {'E8-1': ['대학본부별관'], 'W13': ['예성중원관리동'], 'E7': ['경영항공관 · SPACE K']}


def floors_of(raw):
    floors = {}
    for row in raw:
        m = re.fullmatch(r'(-?\d+)(?:~(-?\d+))?', str(row['floor']).strip())
        if not m:
            continue
        low, high = int(m.group(1)), int(m.group(2) or m.group(1))
        for n in range(low, high + 1):
            floors.setdefault(str(n), []).extend(w for w in row['what'] if w not in floors.get(str(n), []))
    return floors


def main():
    src = json.loads(SRC.read_text(encoding='utf-8'))
    geo = {f['id']: f for f in json.loads(GEO.read_text(encoding='utf-8'))['features']}
    out = []
    for b in src['buildings']:
        osm = b['osm'] or {}
        levels = osm.get('levels')
        out.append({
            'code': b['code'],
            'name': b['name'],
            'names': [n.strip() for n in b['name'].split('/')] + ALIASES.get(b['code'], []),
            'latlng': osm.get('center'),
            'shape': shape_of(geo.get(osm.get('id'))),
            'levels': int(levels) if levels and str(levels).isdigit() else None,
            'floors': floors_of(b['floors']),
        })
    OUT.write_text(json.dumps({'collected': src['collected'], 'buildings': out}, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(f'{OUT.relative_to(ROOT)}: 건물 {len(out)}곳')


if __name__ == '__main__':
    main()
