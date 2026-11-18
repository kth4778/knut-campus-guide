# 교통대 충주캠퍼스 건물 데이터 (수집만, 앱에는 아직 안 씀)

건물 화면을 실제 정보로 채우기 위해 공개된 곳에서 모은 원자료다. 다시 모으려면:

```bash
python3 scripts/collect_buildings.py
```

## 파일

| 파일 | 내용 | 출처 · 라이선스 |
|---|---|---|
| `official-floors.json` | 공식 건물 37곳 × 층별 부서·시설 (원본 그대로) | [학교 캠퍼스지도](https://www.ut.ac.kr/prog/campusMap/kor/sub01_07_02/list.do?campus_code=dorm1) 상세검색. 출처를 밝히고 쓴다 |
| `osm-buildings.geojson` | 캠퍼스와 대학로 둘레 건물 외곽선 315개 (태그 그대로) | © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright) — 화면에 출처 표기 필수 |
| `buildings.json` | 건물 코드(E8 등)로 위 둘을 합친 것 | 위 둘 |
| `floorplan-checklist.md` | 층별 피난안내도 촬영 체크리스트 (32개 건물, 약 118개 층) | — |

## `buildings.json` 항목

- `code`, `name`: 학교 건물 코드와 이름 (예: `E8`, `대학본부`)
- `floors`: `[{floor:"3", what:["교직원식당","글로컬대학30추진단"]}]` — 학교가 안내하는 층만 있다(부서가 없는 층은 빠짐)
- `osm`: 같은 코드를 이름에 단 OSM 건물 (`id`, `levels` 층수, `height` 높이 m, `center` 가운데 좌표). 없으면 `null`
- `topFloorOfficial`: 공식 안내에 나온 가장 높은 층
- `levelsMismatch`: OSM 층수와 `topFloorOfficial` 이 다른지. **공식 안내는 부서가 있는 층만 적어서**, 다르다고 꼭 틀린 건 아니다

## 수집 결과 (2026-11-18)

- 공식: 건물 37곳 · 층 83개 · 부서·시설 134개. 이 중 앱 장소에 이미 있는 것은 21개, **새로 알게 된 것 113개**
- 23곳은 층 안내가 한 줄뿐(생활관·건축관 등 「1F 건물이름」) → 층별 안내판 사진으로 채워야 한다
- OSM: 공식 37곳 중 31곳 외곽선 있음(정문·국원쉼터·대학본부 별관·테니스장·화학생명관·대운동장 없음), 높이 있는 곳 19곳
- 층수가 서로 다른 곳 9곳 (예: 대학본부 공식 8층 / OSM 7, 중앙도서관 공식 10층 / OSM 14)

## 아직 못 모은 것

| 자료 | 상태 | 할 일 |
|---|---|---|
| 건축물대장 층별개요 (국토교통부 건축HUB) | 팀 공공데이터 키가 이 API에 등록 안 됨 (`SERVICE_KEY_IS_NOT_REGISTERED_ERROR`) | 키 주인이 [공공데이터포털](https://www.data.go.kr/data/15134735/openapi.do)에서 활용신청 |
| 방 단위 도면 | 공개 자료 없음 | 시설과에 도면·피난안내도 사용 허락 요청 → `floorplan-checklist.md` 대로 촬영, 또는 정보공개청구 |
| 네이버·카카오 실내지도 | 웹에서 쓸 수 있는 API 없음 (네이버는 모바일 SDK만) | 해당 없음 |
