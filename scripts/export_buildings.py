"""모아 둔 건물 원자료(data-sources/buildings/buildings.json)를 앱이 읽는 작은 파일로 옮긴다.

사용: python3 scripts/export_buildings.py   (collect_buildings.py 를 다시 돌린 뒤에)
결과: dist/data/buildings.json
- names : 앱 장소의 location.building 과 맞춰 볼 이름들 (공식 이름을 / 로 나눈 것 + 앱에서 다르게 부르는 이름)
- levels: 지상 층수 (OSM). 없으면 null
- floors: {"3": ["교직원식당", ...]} — 「1~9」처럼 여러 층에 걸친 안내는 층마다 넣는다
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'data-sources' / 'buildings' / 'buildings.json'
OUT = ROOT / 'dist' / 'data' / 'buildings.json'

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
    out = []
    for b in src['buildings']:
        osm = b['osm'] or {}
        levels = osm.get('levels')
        out.append({
            'code': b['code'],
            'name': b['name'],
            'names': [n.strip() for n in b['name'].split('/')] + ALIASES.get(b['code'], []),
            'levels': int(levels) if levels and str(levels).isdigit() else None,
            'floors': floors_of(b['floors']),
        })
    OUT.write_text(json.dumps({'collected': src['collected'], 'buildings': out}, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(f'{OUT.relative_to(ROOT)}: 건물 {len(out)}곳')


if __name__ == '__main__':
    main()
