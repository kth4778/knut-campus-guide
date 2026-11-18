"""교통대 충주캠퍼스 건물 정보를 공개된 곳에서 모은다 (앱은 건드리지 않음).

사용: python3 scripts/collect_buildings.py

모으는 것
1) 학교 공식 캠퍼스지도의 「건물별 층 안내」 (층 → 부서·시설)
   https://www.ut.ac.kr/prog/campusMap/kor/sub01_07_02/list.do?campus_code=dorm1
   상세검색이 부르는 주소(POST search.do, building_code)를 건물마다 한 번씩, 1.5초 간격으로 부른다
2) OpenStreetMap 의 건물 외곽선·층수(building:levels)·높이(height)  — Overpass API, ODbL 라이선스(출처 표기 필요)

결과 (data-sources/buildings/)
- official-floors.json : 공식 건물 37곳 × 층별 부서·시설 (원본 그대로)
- osm-buildings.geojson: 캠퍼스 둘레 건물 외곽선 전부 (원본 태그 그대로)
- buildings.json       : 건물 코드(E8 등)로 둘을 합친 것 + 층수 비교
"""
import json
import re
import subprocess
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data-sources' / 'buildings'
UA = {'User-Agent': 'knut-campus-guide (school project; github.com/kth4778/knut-campus-guide)'}
CAMPUS_MAP = 'https://www.ut.ac.kr/prog/campusMap/kor/sub01_07_02/list.do?campus_code=dorm1'
SEARCH = 'https://www.ut.ac.kr/prog/campusMap/kor/sub01_07_02/search.do'
OVERPASS = 'https://overpass-api.de/api/interpreter'
BBOX = (36.960, 127.862, 36.978, 127.882)  # 캠퍼스와 바로 앞 대학로까지


def get(url, data=None):
    body = urllib.parse.urlencode(data).encode() if data else None
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=body, headers=UA), timeout=60) as response:
            return response.read().decode('utf-8')
    except urllib.error.URLError as error:
        # macOS 기본 Python(LibreSSL)은 일부 서버와 암호화 연결을 못 맺는다 → curl 로 다시 시도
        if 'SSL' not in str(error):
            raise
        cmd = ['curl', '-s', '--max-time', '90', '-A', UA['User-Agent'], url] + (['--data', body.decode()] if body else [])
        return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout


def official():
    page = get(CAMPUS_MAP)
    buildings = re.findall(r'<option[^>]*value="([EW][\d-]+)"[^>]*>\s*[EW][\d-]+\s+([^<]+?)\s*</option>', page)
    result = []
    for code, name in buildings:
        rows = json.loads(get(SEARCH, {'campus_code': 'dorm1', 'building_code': code}))
        floors = [{'floor': r['layer'], 'what': [w.strip() for w in re.split(r'[,，]', r['dept_name'] or '') if w.strip()]} for r in rows]
        result.append({'code': code, 'name': rows[0]['building_name'] if rows else name, 'floors': floors})
        print(f'  {code} {name}: {len(floors)}개 층')
        time.sleep(1.5)
    return result


def osm():
    s, w, n, e = BBOX
    query = f'[out:json][timeout:90];(way["building"]({s},{w},{n},{e});relation["building"]({s},{w},{n},{e}););out geom tags;'
    data = json.loads(get(OVERPASS, {'data': query}))
    features = []
    for el in data['elements']:
        if el['type'] == 'way' and el.get('geometry'):
            ring = [[p['lon'], p['lat']] for p in el['geometry']]
            geometry = {'type': 'Polygon', 'coordinates': [ring]}
        elif el['type'] == 'relation':
            outers = [[[p['lon'], p['lat']] for p in m['geometry']] for m in el.get('members', []) if m.get('role') == 'outer' and m.get('geometry')]
            if not outers:
                continue
            geometry = {'type': 'MultiPolygon', 'coordinates': [[ring] for ring in outers]}
        else:
            continue
        features.append({'type': 'Feature', 'id': f"{el['type']}/{el['id']}", 'properties': el.get('tags', {}), 'geometry': geometry})
    return {'type': 'FeatureCollection',
            'attribution': '© OpenStreetMap contributors (ODbL) — https://www.openstreetmap.org/copyright',
            'features': features}


def centroid(geometry):
    ring = geometry['coordinates'][0] if geometry['type'] == 'Polygon' else geometry['coordinates'][0][0]
    xs, ys = [p[0] for p in ring[:-1]], [p[1] for p in ring[:-1]]
    return [round(sum(ys) / len(ys), 7), round(sum(xs) / len(xs), 7)]


def merge(official_list, geo):
    by_code = {}
    for f in geo['features']:
        m = re.search(r'\(([EW][\d-]+)\)', f['properties'].get('name', ''))
        if m:
            by_code.setdefault(m.group(1), f)
    merged = []
    for b in official_list:
        f = by_code.get(b['code'])
        props = f['properties'] if f else {}
        top = max([int(x['floor']) for x in b['floors'] if str(x['floor']).lstrip('-').isdigit()] or [0])
        merged.append({
            'code': b['code'], 'name': b['name'],
            'floors': b['floors'],
            'osm': {'id': f['id'], 'name': props.get('name'), 'levels': props.get('building:levels'), 'height': props.get('height'),
                    'center': centroid(f['geometry'])} if f else None,
            'topFloorOfficial': top or None,
            'levelsMismatch': bool(f and props.get('building:levels') and top and int(props['building:levels']) != top),
        })
    return merged


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    print('1) 학교 공식 층별 안내')
    saved = OUT / 'official-floors.json'
    if saved.exists() and json.loads(saved.read_text(encoding='utf-8')).get('collected') == time.strftime('%Y-%m-%d'):
        floors = json.loads(saved.read_text(encoding='utf-8'))['buildings']  # 오늘 이미 받았으면 학교 서버에 다시 묻지 않는다
        print(f'  오늘 받은 것 그대로 사용 ({len(floors)}곳)')
    else:
        floors = official()
    (OUT / 'official-floors.json').write_text(json.dumps({'source': CAMPUS_MAP, 'collected': time.strftime('%Y-%m-%d'), 'buildings': floors}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print('2) OpenStreetMap 건물')
    geo = osm()
    (OUT / 'osm-buildings.geojson').write_text(json.dumps(geo, ensure_ascii=False) + '\n', encoding='utf-8')
    print(f'  건물 {len(geo["features"])}개')
    merged = merge(floors, geo)
    (OUT / 'buildings.json').write_text(json.dumps({'sources': [CAMPUS_MAP, geo['attribution']], 'collected': time.strftime('%Y-%m-%d'), 'buildings': merged}, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'3) 합침: 공식 {len(merged)}곳 중 OSM 외곽선 있음 {sum(1 for b in merged if b["osm"])}곳, 층수 다름 {sum(1 for b in merged if b["levelsMismatch"])}곳')


if __name__ == '__main__':
    main()
