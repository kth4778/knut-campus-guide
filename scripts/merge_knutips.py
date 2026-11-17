"""누팁스(KNUTIPS) 앱 데이터를 이 앱 데이터에 합친다.

사용: python3 scripts/merge_knutips.py <누팁스 knutips_app 폴더>

- dist/data/places.json : 지금 있는 321곳은 그대로 두고
    · 누팁스와 이름이 같은 곳에는 누팁스 분류(kCat)와 꿀팁 본문 메모(memos)를 붙인다
    · 누팁스에만 있는 장소·꿀팁은 새로 추가한다 (id는 누팁스 id 그대로: p…, t…)
- dist/data/partners.json : 교통대 제휴 매장 48곳 (새 파일)

여러 번 돌려도 결과가 같다(이미 추가한 누팁스 항목은 다시 만든다).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLACES_JSON = ROOT / 'dist/data/places.json'
PARTNERS_JSON = ROOT / 'dist/data/partners.json'

# 누팁스 분류 → 이 앱의 4개 분류
TO_OUR_CAT = {
    '식사': '맛집', '카페·디저트': '맛집', '술': '맛집',
    '휴식·산책': '숨은장소', '운동·놀거리': '숨은장소', '공부': '숨은장소',
    '생활편의': '생활꿀팁', '주거·생활관': '생활꿀팁', '교통': '생활꿀팁',
}
# 누팁스 거리권 → 이 앱의 지역 이름
TO_AREA = {'교내': '교내', '대학로(도보)': '대소원', '시내·차량': '충주 시내'}
# 지금 앱에만 있는 항목을 누팁스 계정에 넣을 때 쓰는 분류
FALLBACK_KCAT = {'맛집': '식사', '숨은장소': '휴식·산책'}
# 이름만 조금 다른 같은 곳 (누팁스 이름 → 이 앱 id). 좌표 거리·이름을 하나씩 보고 확인한 것만 적는다.
# 「중앙도서관 (W20)」↔「중앙도서관 3층 열람실」처럼 이름만 비슷하고 다른 곳은 넣지 않는다.
SAME_PLACE = {
    '리밍 교통대점': 'P019', '권짬뽕 충주교통대점': 'P008', '대학본부 학생식당': 'P089',
    '두꺼비네 (해장국)': 'P015', '친구분식 (대학로 친구분식)': 'P075', '24시전주명가콩나물국밥': 'P001',
    '대학본부 교직원식당': 'P004', '사천마라탕교통대점': 'P037', '새마을 삼겹살': 'P038', '성마루 국밥': 'P043',
    '신전떡볶이 충주교통대점': 'P050', '원조중원탑막국수': 'P061',
    '한국교통대학교 충주캠퍼스예성중원관리동 / W13 / 예성생활관식당': 'P133',
    '듀레베이커리': 'P016', '베이커리 이와정': 'P094', '카페플로르(FLORE)': 'P256', '컴포즈커피': 'P080',
    '교내 둘레길': 'P105', '도서관 2층 휴식장소': 'P149', '충주시 호암지 생태공원': 'P175',
    '한국교통대학교 국원 쉼터': 'P168', '국원노천극장': 'P167', '인문사회예술대학 · 인사대 (E14)': 'P166',
    '한국교통대학교 충주캠퍼스국원피트니스클럽': 'P201', '대운동장': 'P169', '교내 우체국': 'P271',
    '천 원의 아침밥': 'P251', '국가 근로': 'P199', '국가근로장학금 신청 (2026년 2학기 기준)': 'P199',
}


def read_window_value(path, name):
    """window.NAME = [...] 꼴의 js 파일에서 값만 꺼낸다."""
    text = Path(path).read_text(encoding='utf-8')
    start = text.index('=', text.index('window.' + name)) + 1
    return json.JSONDecoder().raw_decode(text[start:].lstrip())[0]


def known(value):
    return value not in (None, '', '확인안됨', '확인 안 됨', '해당 없음')


def memo_lines(memos):
    """꿀팁 본문 메모: 제출물마다 나뉜 줄을 한 줄 목록으로. 주소·링크 줄은 뺀다."""
    lines = []
    for block in memos or []:
        for line in block:
            line = line.strip().lstrip('-•·* ').strip()
            if len(line) <= 4 or line.startswith('http') or line.startswith('📍') or line.startswith('지도:'):
                continue
            if line not in lines:
                lines.append(line)
    return lines


def new_item(source, kcat, is_tip, memos):
    price = source['대표가격'] if isinstance(source['대표가격'], int) else None
    latlng = [source['lat'], source['lng']] if source.get('lat') else None
    reasons = memos[:] if is_tip else [x for x in (source['특징'] if source['특징'] not in ('식당', '카페', '술집', '학교시설', '공공시설', '상업시설') else None, source['주의사항']) if known(x)]
    return {
        'id': source['id'],
        'name': source['이름'],
        'category': '생활꿀팁' if is_tip else TO_OUR_CAT.get(kcat, '생활꿀팁'),
        'area': '장소 없음' if is_tip else TO_AREA.get(source['거리권'], '위치 확인 안 됨'),
        'address': source['위치'] if known(source['위치']) else '해당 없음',
        'latlng': latlng,
        'reasons': reasons,
        'menus': [],
        'hours': [{'raw': source['영업시간']}] if known(source['영업시간']) else [],
        'location': {'note': '', 'building': ''},
        'rec': source.get('추천수') or 0,
        'map': source['지도'] if str(source['지도']).startswith('https://') else '',
        'checked': source.get('확인한 날', ''),
        'minPrice': price, 'maxPrice': price,
        'kCat': kcat,
        'memos': memos,
        'warning': source['주의사항'] if known(source['주의사항']) else '',
        'source': 'knutips',
    }


def main(knutips_dir):
    knutips_dir = Path(knutips_dir)
    places = read_window_value(knutips_dir / 'data.js', 'PLACES')
    tips = read_window_value(knutips_dir / 'data.js', 'TIPS')
    memos = read_window_value(knutips_dir / 'tipmemos.js', 'TIP_MEMOS')
    partners = read_window_value(knutips_dir / 'partners.js', 'PARTNERS')

    ours = [x for x in json.loads(PLACES_JSON.read_text(encoding='utf-8')) if x.get('source') != 'knutips']
    by_name = {x['name']: x for x in ours}
    by_id = {x['id']: x for x in ours}

    added = matched = 0
    for source, is_tip in [(p, False) for p in places] + [(t, True) for t in tips]:
        kcat = source['분류']
        lines = memo_lines(memos.get(source['id']))
        mine = by_name.get(source['이름']) or by_id.get(SAME_PLACE.get(source['이름']))
        if mine:
            mine['kCat'] = kcat
            if lines:  # 같은 곳을 가리키는 누팁스 항목이 둘이면 메모를 합친다
                mine['memos'] = list(dict.fromkeys(mine.get('memos', []) + lines))
            matched += 1
        else:
            ours.append(new_item(source, kcat, is_tip, lines))
            added += 1

    for item in ours:  # 지금 앱에만 있던 항목도 계정에 들어가게
        if 'kCat' not in item:
            kcat = FALLBACK_KCAT.get(item['category'])
            if item['category'] == '생활꿀팁':
                kcat = '생활편의' if item.get('latlng') else '생활·주거 팁'
            if kcat:
                item['kCat'] = kcat

    PLACES_JSON.write_text(json.dumps(ours, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')

    out = []
    for i, p in enumerate(partners, 1):
        out.append({
            'id': f'S{i:02d}', 'cat': p['cat'], 'name': p['name'], 'addr': p['addr'],
            'benefits': p['benefits'], 'how': p.get('how', ''), 'from': p.get('from', ''), 'to': p.get('to', ''),
            'latlng': [p['lat'], p['lng']] if p.get('lat') else None, 'approx': bool(p.get('approx')),
        })
    PARTNERS_JSON.write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'이름이 같은 항목 {matched}개에 누팁스 분류·메모 추가, 새 항목 {added}개 추가 → 전체 {len(ours)}개, 제휴 {len(out)}곳')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit('사용: python3 scripts/merge_knutips.py <누팁스 knutips_app 폴더>')
    main(sys.argv[1])
