// 다국어 모드: 한국어 · English · 中文 · 日本語
// 홈 위쪽 지구본 버튼으로 고르고, 이 브라우저(localStorage)에 기억해요.
// 메뉴·버튼·안내 같은 화면 글자만 바꾸고, 가게 이름·학생 후기·글 내용은 한국어 그대로 둬요.
// app.js·moa.js를 고치지 않도록, 화면에 그려진 글자를 사전에서 찾아 바꿔 끼워요(MutationObserver).
(function () {
  const KEY = 'knut-campus-guide:lang';
  const LANGS = [['ko', '한국어', 'KO'], ['en', 'English', 'EN'], ['zh', '中文', '中'], ['ja', '日本語', '日']];
  const IDX = {en: 0, zh: 1, ja: 2};

  // '한국어': [English, 中文, 日本語]
  const D = {
    // 공통 · 탭
    '홈': ['Home', '首页', 'ホーム'], '지도': ['Map', '地图', 'マップ'], '검색': ['Search', '搜索', '検索'], '프로필': ['Profile', '我的', 'プロフィール'],
    'MOA': ['MOA', 'MOA', 'MOA'], '주요 메뉴': ['Main menu', '主菜单', 'メインメニュー'],
    '전체': ['All', '全部', 'すべて'], '맛집': ['Food', '美食', 'グルメ'], '숨은장소': ['Hidden spots', '秘密景点', '穴場'], '생활꿀팁': ['Life tips', '生活小贴士', '生活のコツ'],
    '자유': ['Free talk', '自由', 'フリー'], '버스': ['Bus', '公交', 'バス'], '고속버스': ['Express bus', '高速巴士', '高速バス'],
    '교내': ['On campus', '校内', 'キャンパス内'], '대소원': ['Daesowon', 'Daesowon', 'テソウォン'], '충주 시내': ['Chungju downtown', '忠州市区', '忠州市内'],
    '장소 없음': ['No place', '无地点', '場所なし'],
    '한국교통대 충주캠퍼스': ['KNUT Chungju Campus', '韩国交通大学 忠州校区', '韓国交通大学 忠州キャンパス'],
    'KNUTIPS · 한국교통대 충주캠퍼스': ['KNUTIPS · KNUT Chungju Campus', 'KNUTIPS · 韩国交通大学 忠州校区', 'KNUTIPS · 韓国交通大学 忠州キャンパス'],
    '캠퍼스 가이드를 불러오는 중…': ['Loading campus guide…', '正在加载校园指南…', 'キャンパスガイドを読み込み中…'],
    '캠퍼스 산책': ['Campus walk', '校园散步', 'キャンパス散歩'],
    '지금 재생 중: 캠퍼스 산책. 누르면 크게 보기': ['Now playing: Campus walk. Tap to expand', '正在播放：校园散步。点击放大', '再生中：キャンパス散歩。タップで拡大'],
    '재생/일시정지': ['Play/Pause', '播放/暂停', '再生/一時停止'],
    // 피드
    '충주캠퍼스의 교내 시설과 학교 앞 장소를 찾아보세요.': ['Find campus facilities and spots near KNUT Chungju Campus.', '查找忠州校区的校内设施和学校周边地点。', '忠州キャンパスの校内施設や学校周辺のスポットを探してみましょう。'],
    '좋아요': ['Like', '赞', 'いいね'], '좋아요 취소': ['Unlike', '取消赞', 'いいねを取り消す'], '댓글': ['Comments', '评论', 'コメント'],
    '지도에서 위치 보기': ['See on map', '在地图上查看', '地図で見る'], '게시물 링크 복사': ['Copy link', '复制链接', 'リンクをコピー'],
    '장소 저장': ['Save place', '收藏地点', '場所を保存'], '저장 취소': ['Unsave', '取消收藏', '保存を取り消す'],
    '댓글 달기': ['Add a comment', '添加评论', 'コメントする'], '댓글 달기…': ['Add a comment…', '添加评论…', 'コメントする…'],
    '프로필 열기': ['Open profile', '打开主页', 'プロフィールを開く'], '게시물 열기': ['Open post', '打开帖子', '投稿を開く'],
    '캠퍼스 지도': ['Campus map', '校园地图', 'キャンパスマップ'], '캠퍼스 지도 열기': ['Open campus map', '打开校园地图', 'キャンパスマップを開く'],
    '충주캠퍼스 일러스트': ['Chungju Campus illustration', '忠州校区插画', '忠州キャンパスのイラスト'],
    '게시물 더 보기': ['More posts', '更多帖子', 'もっと見る'], '더 보기': ['More', '更多', 'もっと見る'],
    '장소 카테고리': ['Place categories', '地点分类', '場所のカテゴリー'],
    '첫 댓글을 남겨 보세요.': ['Be the first to comment.', '来发表第一条评论吧。', '最初のコメントを書いてみましょう。'],
    '게시': ['Post', '发布', '投稿'], '댓글 닫기': ['Close comments', '关闭评论', 'コメントを閉じる'], '댓글 입력': ['Write a comment', '输入评论', 'コメント入力'],
    '닫기': ['Close', '关闭', '閉じる'],
    // 검색
    '장소·건물·메뉴 검색': ['Search places, buildings, menus', '搜索地点·建筑·菜单', '場所・建物・メニューを検索'],
    '검색어 지우기': ['Clear search', '清除搜索', '検索語を消す'], '검색 결과': ['Results', '搜索结果', '検索結果'], '추천 장소': ['Recommended', '推荐地点', 'おすすめスポット'],
    '검색 결과가 없어요.': ['No results.', '没有搜索结果。', '検索結果がありません。'],
    '장소 이름이나 다른 키워드를 입력해 보세요.': ['Try a place name or another keyword.', '请输入地点名称或其他关键词。', '場所の名前や別のキーワードを入力してみてください。'],
    '저장한 장소': ['Saved place', '已收藏', '保存した場所'], '지도에서 보기': ['View on map', '在地图上查看', '地図で見る'],
    // 지도
    '지도에서 찾을 장소 검색': ['Search on map', '在地图中搜索', '地図で検索'], '지도 카테고리': ['Map categories', '地图分类', 'マップのカテゴリー'],
    '실시간 버스 노선': ['Live bus routes', '实时公交线路', 'リアルタイムバス路線'], '장소 지도': ['Place map', '地点地图', '場所マップ'],
    '캠퍼스 중심으로': ['Center on campus', '回到校园中心', 'キャンパス中心へ'], '확대': ['Zoom in', '放大', '拡大'], '축소': ['Zoom out', '缩小', '縮小'],
    '지도를 불러오지 못했어요.': ["Couldn't load the map.", '地图加载失败。', '地図を読み込めませんでした。'],
    '배경 지도 연결이 지연되고 있어요.': ['The base map is slow to load.', '底图加载较慢。', '背景地図の読み込みが遅れています。'],
    '교통대 고속버스 정류소': ['KNUT express bus stop', '交通大高速巴士站', '交通大 高速バス停'], '충주 고속버스터미널': ['Chungju Express Bus Terminal', '忠州高速巴士客运站', '忠州高速バスターミナル'],
    // 버스 · 고속버스
    '실시간': ['Live', '实时', 'リアルタイム'], '정류장': ['Bus stop', '公交站', 'バス停'], '정류장 번호': ['Stop no.', '站点编号', 'バス停番号'],
    '시내버스 정류장': ['City bus stop', '市内公交站', '市内バス停'], '곧 도착': ['Arriving soon', '即将到达', 'まもなく到着'],
    '도착 정보를 불러오는 중…': ['Loading arrivals…', '正在加载到站信息…', '到着情報を読み込み中…'], '불러오는 중…': ['Loading…', '加载中…', '読み込み中…'],
    '지금 도착 예정인 버스가 없어요.': ['No buses arriving now.', '暂无即将到站的公交。', '今到着予定のバスはありません。'],
    '새로고침': ['Refresh', '刷新', '更新'], '오늘': ['Today', '今天', '今日'], '내일': ['Tomorrow', '明天', '明日'],
    '도착완료': ['Arrived', '已到达', '到着済み'], '운행 끝': ['Service ended', '已停运', '運行終了'], '곧 출발': ['Departing soon', '即将出发', 'まもなく出発'],
    '운행 중': ['On the way', '运行中', '運行中'], '도착 예정': ['Expected', '预计到达', '到着予定'], '지난 차': ['Past buses', '已发车', '過ぎた便'],
    '이 날은 운행하는 버스가 없어요.': ['No buses run on this day.', '当天没有运行的班车。', 'この日は運行するバスがありません。'],
    '오늘 남은 버스가 없어요. 내일 시간표를 확인해 보세요.': ['No more buses today. Check tomorrow’s timetable.', '今天没有剩余班次了，请查看明天的时刻表。', '今日のバスはもうありません。明日の時刻表を確認してください。'],
    '예매는 고속버스 예매 앱에서 해요': ['Book tickets in an express bus app', '请在高速巴士购票App中购票', '予約は高速バス予約アプリで'],
    '노선 불러오는 중…': ['Loading routes…', '正在加载线路…', '路線を読み込み中…'], '노선 목록 없음': ['No routes', '无线路', '路線なし'],
    '20초마다 위치가 갱신돼요': ['Location updates every 20 seconds', '每20秒更新位置', '20秒ごとに位置を更新'],
    '고속버스 시간표·요금 · 달리는 버스 실시간 위치': ['Express bus times · fares · live bus location', '高速巴士时刻·票价 · 实时位置', '高速バス時刻・運賃 · リアルタイム位置'],
    '기준 · 30초마다 갱신': ['· updates every 30 s', '· 每30秒更新', '· 30秒ごとに更新'], '기준 · 1분마다 위치 갱신': ['· location every 1 min', '· 每分钟更新位置', '· 1分ごとに位置更新'],
    // 프로필 · 설정
    '게시물': ['Posts', '帖子', '投稿'], '팔로워': ['Followers', '粉丝', 'フォロワー'], '팔로잉': ['Following', '关注', 'フォロー中'],
    '프로필 편집': ['Edit profile', '编辑资料', 'プロフィール編集'], '새 게시물': ['New post', '新帖子', '新規投稿'], '제보하기': ['Report', '爆料', '投稿する'], '장소 찾아보기': ['Find places', '查找地点', '場所を探す'],
    '챗봇': ['Chatbot', '聊天机器人', 'チャットボット'], '저장한 게시물': ['Saved posts', '收藏的帖子', '保存した投稿'],
    '프로필 게시물': ['Profile posts', '主页帖子', 'プロフィールの投稿'], '내 게시물': ['My posts', '我的帖子', '自分の投稿'], '저장한 게시물 격자': ['Saved posts grid', '收藏帖子网格', '保存した投稿'],
    '아직 저장한 게시물이 없어요.': ['No saved posts yet.', '还没有收藏的帖子。', 'まだ保存した投稿はありません。'],
    '첫 번째 게시물을 만들어보세요': ['Create your first post', '发布你的第一条帖子', '最初の投稿を作ってみましょう'],
    '학교에서 발견한 장소를 기록해 보세요.': ['Record places you found on campus.', '记录你在学校发现的地点吧。', '学校で見つけた場所を記録してみましょう。'],
    '설정': ['Settings', '设置', '設定'], '뒤로': ['Back', '返回', '戻る'], '내 활동': ['My activity', '我的动态', 'マイアクティビティ'], '기록': ['Data', '记录', '記録'],
    '게시물·좋아요·댓글·저장은 이 브라우저에만 저장돼요. 다른 기기나 다른 사람과 공유되지 않아요.': ['Posts, likes, comments and saves stay in this browser only. They are not shared with other devices or people.', '帖子、点赞、评论和收藏只保存在此浏览器中，不会与其他设备或他人共享。', '投稿・いいね・コメント・保存はこのブラウザにのみ保存されます。他の端末や他の人とは共有されません。'],
    '내 기록 모두 지우기': ['Clear all my data', '清除我的全部记录', '自分の記録をすべて消去'], '정보': ['About', '关于', '情報'], '소스 코드': ['Source code', '源代码', 'ソースコード'],
    '지도: 네이버 지도 (연결이 안 되면 OpenStreetMap)': ['Map: Naver Map (OpenStreetMap if unavailable)', '地图：Naver地图（无法连接时使用OpenStreetMap）', '地図：NAVERマップ（接続できない場合はOpenStreetMap）'],
    '건물 사진: Wikimedia Commons · CC BY-SA 4.0': ['Building photos: Wikimedia Commons · CC BY-SA 4.0', '建筑照片：Wikimedia Commons · CC BY-SA 4.0', '建物写真：Wikimedia Commons · CC BY-SA 4.0'],
    '저장': ['Save', '收藏', '保存'], '이름': ['Name', '名字', '名前'], '소개': ['Bio', '简介', '紹介'],
    '나를 소개해 보세요': ['Tell us about yourself', '介绍一下自己吧', '自己紹介をどうぞ'],
    '이름과 소개는 이 브라우저에만 저장돼요.': ['Name and bio stay in this browser only.', '名字和简介只保存在此浏览器中。', '名前と紹介はこのブラウザにのみ保存されます。'],
    '프로필을 저장했어요.': ['Profile saved.', '资料已保存。', 'プロフィールを保存しました。'], '내 기록을 모두 지웠어요.': ['All your data was cleared.', '已清除全部记录。', '記録をすべて消去しました。'],
    // 글쓰기
    '사진': ['Photo', '照片', '写真'], '(선택)': ['(optional)', '（可选）', '（任意）'], '카테고리': ['Category', '分类', 'カテゴリー'], '제목': ['Title', '标题', 'タイトル'], '내용': ['Text', '内容', '内容'],
    '장소나 기록 이름': ['Place or note name', '地点或记录名称', '場所や記録の名前'], '문구를 입력하세요…': ['Write something…', '输入内容…', '文章を入力…'],
    '게시물은 이 브라우저에 저장됩니다.': ['Posts are saved in this browser.', '帖子保存在此浏览器中。', '投稿はこのブラウザに保存されます。'],
    '제목과 내용을 입력해 주세요.': ['Please enter a title and text.', '请输入标题和内容。', 'タイトルと内容を入力してください。'],
    '게시물을 저장했어요.': ['Post saved.', '帖子已保存。', '投稿を保存しました。'], '게시물을 찾을 수 없어요.': ["Couldn't find the post.", '找不到该帖子。', '投稿が見つかりません。'],
    // 장소 상세
    '장소 정보': ['Place info', '地点信息', '場所の情報'], '네이버 지도': ['Naver Map', 'Naver地图', 'NAVERマップ'], '가이드 정보': ['Guide info', '指南信息', 'ガイド情報'],
    '메뉴': ['Menu', '菜单', 'メニュー'], '운영 정보': ['Hours', '营业信息', '営業情報'], '학교 공식 안내': ['Official school info', '学校官方信息', '学校公式案内'], '학교 안내': ['School info', '学校信息', '学校案内'],
    '등록된 장소를 찾을 수 없어요.': ["Couldn't find this place.", '找不到该地点。', '登録された場所が見つかりません。'],
    '확인 안 됨': ['Not confirmed', '未确认', '未確認'], '해당 없음': ['N/A', '不适用', '該当なし'],
    '장소를 저장했어요.': ['Place saved.', '已收藏地点。', '場所を保存しました。'], '저장을 취소했어요.': ['Removed from saved.', '已取消收藏。', '保存を取り消しました。'],
    '링크를 복사했어요.': ['Link copied.', '链接已复制。', 'リンクをコピーしました。'], '링크를 복사하지 못했어요.': ["Couldn't copy the link.", '复制链接失败。', 'リンクをコピーできませんでした。'],
    '가이드 정보를 불러오지 못했어요.': ["Couldn't load the guide.", '指南信息加载失败。', 'ガイド情報を読み込めませんでした。'], '다시 시도': ['Try again', '重试', '再試行'],
    // MOA
    '같이 시키고, 같이 타요': ['Order together, ride together', '一起点餐，一起打车', '一緒に頼んで、一緒に乗ろう'],
    '배달비·최소주문, 택시비를 학우들과 나눠요': ['Split delivery fees, minimum orders and taxi fares with classmates', '与同学分摊配送费、起送价和打车费', '配達料・最低注文・タクシー代を学友と割り勘'],
    '모집 중': ['Open', '招募中', '募集中'], '내 참여': ['Joined', '我参与的', '参加中'], '＋ 모집하기': ['＋ New group', '＋ 发起招募', '＋ 募集する'], '모집하기': ['New group', '发起招募', '募集する'],
    '배달': ['Delivery', '外卖', '配達'], '픽업': ['Pickup', '自取', 'ピックアップ'], '택시': ['Taxi', '出租车', 'タクシー'],
    '참여하기': ['Join', '参加', '参加する'], '참여 중 ✓': ['Joined ✓', '已参加 ✓', '参加中 ✓'], '정원 찼어요': ['Full', '已满员', '満員'], '마감': ['Closed', '已截止', '締切'], '마감됨': ['Closed', '已截止', '締切済み'],
    '내 모집 · 마감하기': ['My group · Close', '我的招募 · 截止', '自分の募集 · 締め切る'],
    '출발 시각 지남': ['Departure time passed', '已过出发时间', '出発時刻を過ぎました'], '픽업 시각 지남': ['Pickup time passed', '已过自取时间', 'ピックアップ時刻を過ぎました'], '주문 시각 지남': ['Order time passed', '已过下单时间', '注文時刻を過ぎました'],
    '1인': ['Per person', '每人', '1人あたり'], '배달비 1인': ['Delivery fee per person', '每人配送费', '配達料 1人あたり'], '참여자 1인': ['Per participant', '每位参与者', '参加者1人あたり'],
    '최소주문 없음': ['No minimum order', '无起送价', '最低注文なし'], '타고 나서 1/N': ['Split after the ride', '乘车后平摊', '乗車後に割り勘'],
    '모집글은 이 브라우저에만 저장돼요. 다른 사람에게는 보이지 않아요.': ['Groups are saved in this browser only. Others can’t see them.', '招募帖只保存在此浏览器中，其他人看不到。', '募集はこのブラウザにのみ保存されます。他の人には見えません。'],
    '모집글은 이 브라우저에만 저장돼요.': ['Groups are saved in this browser only.', '招募帖只保存在此浏览器中。', '募集はこのブラウザにのみ保存されます。'],
    '참여한 모집이 없어요.': ["You haven't joined any group.", '你还没有参加任何招募。', '参加した募集はありません。'], '지금 모집 중인 글이 없어요.': ['No open groups right now.', '目前没有招募中的帖子。', '今募集中の投稿はありません。'],
    '먼저 모집해 보세요!': ['Start one yourself!', '你来发起吧！', '先に募集してみましょう！'],
    '무엇을 같이 할까요?': ['What do you want to share?', '想一起做什么？', '何を一緒にしますか？'],
    '배달 같이 시키기': ['Order delivery together', '一起点外卖', '一緒に配達を頼む'], '픽업해서 같이 먹기': ['Pick up and eat together', '自取后一起吃', 'ピックアップして一緒に食べる'], '택시 같이 타기': ['Share a taxi', '一起打车', 'タクシー相乗り'],
    '같이 타기': ['Ride together', '一起乘车', '相乗り'], '같이 먹기': ['Eat together', '一起吃', '一緒に食べる'], '같이 시키기': ['Order together', '一起点', '一緒に頼む'],
    '받는 곳': ['Delivery spot', '收货地点', '受け取り場所'], '나눌 곳 (사 와서 모일 곳)': ['Meet-up spot (where we share)', '分餐地点（买回来集合的地方）', '分ける場所（買ってきて集まる場所）'], '나눌 곳': ['Meet-up spot', '分餐地点', '分ける場所'],
    '출발': ['From', '出发', '出発'], '도착': ['To', '到达', '到着'], '가게': ['Store', '店铺', 'お店'], '내 위치': ['My location', '我的位置', '現在地'],
    '배달비 (원)': ['Delivery fee (KRW)', '配送费（韩元）', '配達料（ウォン）'], '내 주문금액 (원)': ['My order (KRW)', '我的订单金额（韩元）', '自分の注文額（ウォン）'],
    '최소주문금액 (원, 없으면 비워두기)': ['Minimum order (KRW, leave empty if none)', '起送价（韩元，没有可留空）', '最低注文額（ウォン、なければ空欄）'],
    '배달은 인원 제한 없이 누구나 참여할 수 있어요.': ['Anyone can join a delivery group, no limit.', '外卖不限人数，任何人都可以参加。', '配達は人数制限なく誰でも参加できます。'],
    '주문까지': ['Order in', '下单时间', '注文まで'], '출발까지': ['Leaving in', '出发时间', '出発まで'], '픽업 출발까지': ['Pickup in', '自取出发时间', 'ピックアップ出発まで'],
    '닉네임': ['Nickname', '昵称', 'ニックネーム'], '취소': ['Cancel', '取消', 'キャンセル'], '올리기': ['Post', '发布', '投稿する'],
    '예상 택시비 (원, 모르면 비워두기)': ['Estimated fare (KRW, leave empty if unsure)', '预计车费（韩元，不确定可留空）', '予想タクシー代（ウォン、分からなければ空欄）'],
    '음식 총액 (원)': ['Food total (KRW)', '餐费总额（韩元）', '食事の合計（ウォン）'], '교통비': ['Travel cost', '交通费', '交通費'], '음식': ['Food', '餐费', '食事'], '택시비': ['Taxi fare', '车费', 'タクシー代'], '최소주문': ['Min. order', '起送价', '最低注文'],
    '픽업하는 나(모집자)는': ['As the one picking up, I', '负责自取的我（发起人）', 'ピックアップする私（募集者）は'], '교통비 면제': ['skip travel cost', '免交通费', '交通費免除'], '교통비 같이 부담': ['share travel cost', '一起分摊交通费', '交通費も割り勘'],
    '음식 총액을 적으면 사람 수별 1인 금액을 보여 드려요.': ['Enter the food total to see the cost per person.', '填写餐费总额后会显示按人数的人均金额。', '食事の合計を入れると人数ごとの1人あたり金額を表示します。'],
    '정원 (나 포함)': ['Group size (incl. me)', '人数上限（含自己）', '定員（自分を含む）'], '사람 수별 1인 금액': ['Cost per person by group size', '按人数的人均金额', '人数別の1人あたり金額'],
    '사람이 늘면 1인 금액이 줄어요': ['more people, lower cost each', '人越多人均越少', '人が増えると1人あたりの金額が減ります'],
    '내가 가게에서 사 와서 나눠요. 음식값은 N빵, 교통비는 아래에서 정해요.': ['I buy it at the store and we share. Food is split evenly; set the travel cost below.', '我去店里买回来大家分。餐费平摊，交通费在下面设置。', '私がお店で買ってきて分けます。食事代は割り勘、交通費は下で決めます。'],
    '내가 낼 돈 (지금 참여하면)': ['My share (if I join now)', '我需支付（现在参加的话）', '自分の負担額（今参加すると）'],
    '닉네임을 적어 주세요.': ['Please enter a nickname.', '请填写昵称。', 'ニックネームを入力してください。'], '내 주문금액을 적어 주세요.': ['Please enter your order amount.', '请填写你的订单金额。', '自分の注文額を入力してください。'],
    '참여했어요! 시간 맞춰 모여요.': ['Joined! See you on time.', '已参加！准时集合哦。', '参加しました！時間通りに集まりましょう。'], '참여를 취소했어요.': ['You left the group.', '已取消参加。', '参加を取り消しました。'],
    '제목을 적어 주세요.': ['Please enter a title.', '请填写标题。', 'タイトルを入力してください。'], '가게 이름을 적어 주세요.': ['Please enter the store name.', '请填写店铺名称。', 'お店の名前を入力してください。'],
    '음식 총액을 적어 주세요.': ['Please enter the food total.', '请填写餐费总额。', '食事の合計を入力してください。'], '모집글을 올렸어요.': ['Group posted.', '招募已发布。', '募集を投稿しました。'],
    '내 위치로 정했어요.': ['Set to my location.', '已设为我的位置。', '現在地に設定しました。'], '위치 권한이 필요해요.': ['Location permission is needed.', '需要位置权限。', '位置情報の許可が必要です。'], '위치를 쓸 수 없어요.': ["Can't use location.", '无法使用位置。', '位置情報を使えません。'],
    '홈으로': ['Home', '回首页', 'ホームへ'], '모집자': ['Host', '发起人', '募集者'],
    // 계정 · 제휴 (accounts.js)
    '제휴': ['Partners', '合作', '提携'], '교통대 제휴': ['KNUT Partners', '交大合作商家', '交通大 提携'], '43대 총학생회': ['43rd Student Council', '第43届总学生会', '第43代総学生会'], '우리': ['Us', '我们', 'わたしたち'],
    '제휴 매장 · 재학생·휴학생 학생증 제시 (졸업생 제외)': ['Partner stores · show your student ID (enrolled or on leave, not graduates)', '合作商家 · 出示在读/休学学生证（毕业生除外）', '提携店 · 在学生・休学生の学生証を提示（卒業生は対象外）'],
    '식사': ['Food', '餐饮', '食事'], '학교 안팎 밥집, 선배 추천 많은 순': ['Places to eat on and off campus, most recommended first', '校内外饭店，按学长学姐推荐排序', '学校内外のご飯屋さん、先輩のおすすめ順'],
    '카페·디저트': ['Café & Dessert', '咖啡·甜品', 'カフェ・デザート'], '공부하기 좋은 카페와 디저트': ['Cafés and desserts good for studying', '适合学习的咖啡店和甜品', '勉強にいいカフェとデザート'],
    '술': ['Bars', '酒吧', 'お酒'], '학교 앞 술집': ['Bars near campus', '学校附近的酒吧', '学校前の飲み屋'], '공부': ['Study', '学习', '勉強'], '열람실·스터디 공간': ['Reading rooms & study spaces', '阅览室·自习空间', '閲覧室・スタディスペース'],
    '휴식·산책': ['Relax & Walk', '休息·散步', '休憩・散歩'], '쉬는 시간에 가기 좋은 곳': ['Good spots for a break', '课间休息的好去处', '休み時間に行きたい場所'],
    '운동·놀거리': ['Sports & Fun', '运动·娱乐', '運動・遊び'], '운동하고 놀 곳': ['Places to work out and have fun', '运动和玩的地方', '運動して遊べる場所'],
    '생활편의': ['Daily Needs', '生活便利', '生活便利'], '편의점·문구·복사·은행 등 생활 시설': ['Convenience stores, stationery, copying, banks and more', '便利店·文具·复印·银行等生活设施', 'コンビニ・文具・コピー・銀行などの生活施設'],
    '교통': ['Transport', '交通', '交通'], '학교 오가는 교통': ['Getting to and from campus', '往返学校的交通', '学校への行き帰りの交通'],
    '자취방': ['Off-campus rooms', '校外租房', '一人暮らしの部屋'], '원룸·자취방과 방 구할 때 꿀팁': ['Studio rooms and tips for finding one', '单间·租房及找房小贴士', 'ワンルーム・部屋探しのコツ'],
    '주거·생활관': ['Housing & Dorms', '住房·宿舍', '住まい・寮'], '기숙사': ['Dorms', '宿舍', '寮'], '생활관(기숙사) 시설과 벌점·외박 꿀팁': ['Dorm facilities, penalty points and overnight-leave tips', '宿舍设施及扣分·外宿小贴士', '寮の施設と罰点・外泊のコツ'],
    '식사 팁': ['Food Tips', '用餐小贴士', '食事のコツ'], '밥 먹을 때 알아두면 좋은 선배 꿀팁': ['Seniors’ tips for eating out', '吃饭时值得知道的学长学姐小贴士', 'ご飯を食べるときに役立つ先輩のコツ'],
    '생활·주거 팁': ['Living Tips', '生活·住房小贴士', '生活・住まいのコツ'], '학교생활·자취 꿀팁': ['Campus life & living-alone tips', '校园生活·独居小贴士', '学校生活・一人暮らしのコツ'],
    '교통 팁': ['Transport Tips', '交通小贴士', '交通のコツ'], '버스·택시·기차 타는 꿀팁': ['Tips for buses, taxis and trains', '乘坐公交·出租车·火车的小贴士', 'バス・タクシー・電車のコツ'],
    '학사·장학 팁': ['Academic Tips', '学业·奖学金小贴士', '学事・奨学金のコツ'], '수강신청·장학금·휴학 꿀팁': ['Course registration, scholarships and leave tips', '选课·奖学金·休学小贴士', '履修登録・奨学金・休学のコツ'],
    '계정 열기': ['Open account', '打开账号', 'アカウントを開く'], '계정': ['Account', '账号', 'アカウント'], '계정을 찾을 수 없어요.': ["Couldn't find the account.", '找不到该账号。', 'アカウントが見つかりません。'],
    '분류': ['Category', '分类', '分類'], '혜택 기간': ['Valid period', '优惠期限', '特典期間'], '추천': ['Picks', '推荐', 'おすすめ'], '학생증 제시': ['Show student ID', '出示学生证', '学生証を提示'],
    '교통대 제휴 계정 열기': ['Open KNUT Partners', '打开交大合作商家账号', '交通大 提携アカウントを開く'], '제휴 게시물': ['Partner post', '合作帖子', '提携投稿'],
    '제휴 게시물을 찾을 수 없어요.': ["Couldn't find the partner post.", '找不到该合作帖子。', '提携投稿が見つかりません。'], '방법:': ['How:', '方式：', '方法：'],
    '(도로 기준 대략 위치)': ['(approximate location by road)', '（按道路的大致位置）', '（道路基準のおおよその位置）'], '네이버 지도에서 찾기': ['Find on Naver Map', '在Naver地图中查找', 'NAVERマップで探す'], '제휴 더 보기': ['More partners', '更多合作商家', '提携をもっと見る'],
    '식당': ['Restaurant', '餐厅', '食堂'], '주점·술집': ['Pub & Bar', '酒馆·酒吧', '居酒屋・バー'], '미용·뷰티': ['Beauty', '美容', '美容'], '반려동물': ['Pets', '宠物', 'ペット'],
    '운동·레저': ['Sports & Leisure', '运动·休闲', '運動・レジャー'], '영화·문화': ['Movies & Culture', '电影·文化', '映画・文化'], '꽃·소품': ['Flowers & Gifts', '鲜花·小物', '花・雑貨'], '사진·인쇄·행사': ['Photo, Print & Events', '照片·印刷·活动', '写真・印刷・イベント'],
    // 화이트 모드 버튼 (theme.js)
    '화이트 모드로 바꾸기': ['Switch to light mode', '切换到浅色模式', 'ライトモードにする'], '다크 모드로 바꾸기': ['Switch to dark mode', '切换到深色模式', 'ダークモードにする'],
    // 챗봇
    'KNUTUIDE에게 질문': ['Ask KNUTUIDE', '向KNUTUIDE提问', 'KNUTUIDEに質問'], '학교생활 무엇이든 물어보세요': ['Ask anything about campus life', '关于校园生活，随便问', '学校生活のことなら何でも聞いてね'],
    '보내기': ['Send', '发送', '送信'], '주소': ['Address', '地址', 'アドレス'], '모델': ['Model', '模型', 'モデル'], '대화 지우기': ['Clear chat', '清除对话', '会話を消す'], 'LLM 연결': ['LLM connection', 'LLM连接', 'LLM接続'],
    '프로필로': ['To profile', '回到我的', 'プロフィールへ'],
    '학교 앞 싼 밥집 추천해줘': ['Cheap eats near campus?', '推荐学校附近便宜的饭店', '学校前の安いご飯屋さんを教えて'],
    '프린트는 어디서 해?': ['Where can I print?', '在哪里可以打印？', 'プリントはどこでできる？'], '공강에 쉬기 좋은 곳': ['Places to rest between classes', '空堂适合休息的地方', '空きコマに休める場所'],
    '시내 나가는 버스 알려줘': ['Buses to downtown?', '去市区的公交有哪些？', '市内に行くバスを教えて'],
    '대화를 지웠어요.': ['Chat cleared.', '对话已清除。', '会話を消しました。'], '연결 설정을 저장했어요.': ['Connection saved.', '连接设置已保存。', '接続設定を保存しました。'],
    '내 컴퓨터에서 Ollama가 켜져 있어야 해요. 배포된 사이트에서 쓰려면 Ollama를': ['Ollama must be running on your computer. To use it on the deployed site, run Ollama with', '需要在你的电脑上运行Ollama。要在已部署的网站上使用，请用', '自分のパソコンでOllamaが起動している必要があります。公開サイトで使うには、Ollamaを'],
    '로 실행해 주세요.': ['.', '启动Ollama。', 'で起動してください。'],
    '생각하는 중…': ['Thinking…', '思考中…', '考え中…'],
  };

  // 숫자·이름이 섞인 문구. {1}{2}는 괄호 안 값을 그대로 넣어요.
  const P = [
    [/^추천 (\d+)개$/, '{1} picks', '{1} 人推荐', 'おすすめ {1}'],
    [/^댓글 (\d+)개 모두 보기$/, 'View all {1} comments', '查看全部 {1} 条评论', 'コメント{1}件をすべて見る'],
    [/^(\d+)개$/, '{1}', '{1} 个', '{1}件'],
    [/^(\d+)분 뒤$/, 'In {1} min', '{1} 分钟后', '{1}分後'],
    [/^(\d+)분 남음$/, '{1} min left', '剩 {1} 分钟', '残り{1}分'],
    [/^(\d+)분 후$/, 'In {1} min', '{1} 分钟后', '{1}分後'],
    [/^(\d+)정거장 전$/, '{1} stops away', '还有 {1} 站', '{1}つ前の停留所'],
    [/^(\d+)명 참여$/, '{1} joined', '{1} 人参加', '{1}人参加'],
    [/^(\d+)\/(\d+)명$/, '{1}/{2} people', '{1}/{2} 人', '{1}/{2}人'],
    [/^(\d+)명$/, '{1} people', '{1} 人', '{1}人'],
    [/^(\d+)천원$/, '₩{1},000', '{1}千韩元', '{1}千ウォン'],
    [/^([\d,]+)원$/, '₩{1}', '{1} 韩元', '{1}ウォン'],
    [/^(\d+)번$/, 'No. {1}', '{1} 路', '{1}番'],
    [/^(\d+)번 버스$/, 'Bus {1}', '{1} 路公交', '{1}番バス'],
    [/^(\d+)년( ·)?$/, '{1}{2}', '{1}年{2}', '{1}年{2}'],
    [/^(\d+)개 위치 · 핀을 눌러 장소를 확인하세요\.$/, '{1} places · Tap a pin to see the place.', '{1} 个地点 · 点击图钉查看地点。', '{1}か所 · ピンをタップして場所を確認しましょう。'],
    [/^최소주문 ([\d,]+)원 중 ([\d,]+)원$/, '₩{2} of ₩{1} min. order', '起送价 {1} 韩元，已凑 {2} 韩元', '最低注文{1}ウォン中 {2}ウォン'],
    [/^(.+) 제휴 혜택이에요\. 재학생·휴학생 학생증을 보여주세요\.$/, '{1} student deal. Show your student ID (enrolled or on leave).', '{1} 的合作优惠。请出示在读或休学学生证。', '{1}の提携特典です。在学生・休学生の学生証を見せてください。'],
    [/^· 기간: (.+)$/, '· Period: {1}', '· 期限：{1}', '· 期間：{1}'],
    [/^받는 곳 (.+)$/, 'Delivery spot: {1}', '收货地点：{1}', '受け取り場所：{1}'],
    [/^나눌 곳 (.+)$/, 'Meet-up spot: {1}', '分餐地点：{1}', '分ける場所：{1}'],
    [/^기존 가이드 확인일 (.+)$/, 'Guide checked: {1}', '指南确认日期：{1}', 'ガイド確認日：{1}'],
    [/^(.+) 건물 외관$/, '{1} building', '{1} 建筑外观', '{1} 建物外観'],
    [/^(.+) 게시물$/, '{1} post', '{1} 的帖子', '{1}の投稿'],
    [/^(.+) 지도에서 보기$/, 'View {1} on map', '在地图上查看 {1}', '{1}を地図で見る'],
    [/^(.+) 외 (\d+)곳$/, '{1} and {2} more', '{1} 等 {2} 处', '{1} ほか{2}か所'],
    [/^안녕하세요, KNUTUIDE예요! 충주캠퍼스 맛집·숨은장소·생활꿀팁 (\d*)개를 바탕으로 답해 드려요\. 무엇이 궁금하세요\?$/,
      'Hi, I’m KNUTUIDE! I answer using {1} food spots, hidden spots and life tips from Chungju Campus. What would you like to know?',
      '你好，我是KNUTIPS的KNUTUIDE！我会根据忠州校区的 {1} 条美食·秘密景点·生活小贴士来回答。想了解什么？',
      'こんにちは、KNUTUIDEです！忠州キャンパスのグルメ・穴場・生活のコツ {1}件をもとにお答えします。何が知りたいですか？'],
  ];

  const HANGUL = /[가-힣]/;
  const EMOJI = /^((?:\p{Extended_Pictographic}|[＋+])️?\s*)(.+)$/u;
  let lang = 'ko';
  try { lang = localStorage.getItem(KEY) || 'ko'; } catch {}
  if (!LANGS.some(([code]) => code === lang)) lang = 'ko';

  function word(ko) {
    if (lang === 'ko') return null;
    const i = IDX[lang];
    if (D[ko]) return D[ko][i];
    for (const [re, ...out] of P) {
      const m = re.exec(ko);
      if (m) return out[i].replace(/\{(\d)\}/g, (_, n) => { const v = m[+n] ?? ''; return (v && word(v)) ?? v; });
    }
    let m = EMOJI.exec(ko);
    if (m) { const t = word(m[2]); if (t != null) return m[1] + t; }
    m = /^(.+?) (\d+)$/.exec(ko);                       // '전체 3', '게시물 0'
    if (m && D[m[1]]) return D[m[1]][i] + ' ' + m[2];
    m = /^(.+?) ([\d,]+원)$/.exec(ko);                  // '택시비 9,800원'
    if (m && D[m[1]]) return D[m[1]][i] + ' ' + word(m[2]);
    if (/ · | → | \+ /.test(ko)) {                      // '맛집 · 대소원', '음식 … · 교통비 …'
      const parts = ko.split(/( · | → | \+ )/);
      let changed = false;
      const out = parts.map(p => { if (/^( · | → | \+ )$/.test(p) || !p.trim()) return p; const t = word(p.trim()); if (t != null) { changed = true; return t; } return p; });
      if (changed) return out.join('');
    }
    return null;
  }

  // 원래 한국어를 기억해 두었다가 언어를 바꾸면 다시 번역해요
  const textOrig = new WeakMap(), textOut = new WeakMap();
  const attrOrig = new WeakMap();
  const ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];
  const SKIP = '.chat-msg:not(.chat-intro), script, style, textarea, .lang, .leaflet-control-attribution';

  function doText(node) {
    const el = node.parentElement;
    if (!el || el.closest(SKIP)) return;
    if (textOut.get(node) !== node.nodeValue) { textOrig.set(node, node.nodeValue); textOut.delete(node); }
    const orig = textOrig.get(node) ?? node.nodeValue;
    if (!HANGUL.test(orig)) return;
    const trimmed = orig.trim();
    const t = word(trimmed);
    const next = t == null ? orig : orig.replace(trimmed, t);
    if (next !== node.nodeValue) node.nodeValue = next;
    textOut.set(node, next);
  }

  function doAttrs(el) {
    if (el.closest('.chat-msg:not(.chat-intro), .lang')) return;
    let saved = attrOrig.get(el);
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (v == null) continue;
      if (!saved) attrOrig.set(el, saved = {});
      const prev = saved[a];
      if (!prev || prev.out !== v) saved[a] = {orig: v, out: v};
      const orig = saved[a].orig;
      if (!HANGUL.test(orig)) continue;
      const t = word(orig.trim());
      const next = t == null ? orig : t;
      saved[a].out = next;
      if (next !== v) el.setAttribute(a, next);
    }
  }

  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    doAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) n.nodeType === 3 ? doText(n) : doAttrs(n);
  }

  const titleOrig = document.title;
  function applyAll() {
    document.documentElement.lang = lang;
    document.title = word(titleOrig) ?? titleOrig;
    walk(document.body);
    addButton();
  }

  // 홈 위쪽(KNUTIPS 제목 줄) 오른쪽에 지구본 버튼
  const GLOBE = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/></svg>';
  function addButton() {
    const top = document.querySelector('.top .middle.brand')?.closest('.top');
    if (!top || top.querySelector('.lang')) return;
    const right = top.lastElementChild;
    const box = document.createElement('div');
    box.className = 'lang';
    const code = LANGS.find(([c]) => c === lang)[2];
    box.innerHTML = `<button type="button" class="lang-btn" aria-label="Language" aria-haspopup="true" aria-expanded="false">${GLOBE}<b>${code}</b></button>
      <div class="lang-menu" hidden>${LANGS.map(([c, label]) => `<button type="button" data-lang="${c}" ${c === lang ? 'aria-current="true"' : ''}>${label}</button>`).join('')}</div>`;
    top.classList.add('has-lang');
    right.prepend(box);
  }

  document.addEventListener('click', event => {
    const btn = event.target.closest('.lang-btn');
    const menu = document.querySelector('.lang-menu');
    if (btn && menu) { menu.hidden = !menu.hidden; btn.setAttribute('aria-expanded', String(!menu.hidden)); return; }
    const pick = event.target.closest('[data-lang]');
    if (pick) {
      lang = pick.dataset.lang;
      try { localStorage.setItem(KEY, lang); } catch {}
      document.querySelector('.top.has-lang')?.classList.remove('has-lang');
      document.querySelector('.lang')?.remove();
      applyAll();
      return;
    }
    if (menu && !event.target.closest('.lang')) menu.hidden = true;
  });

  new MutationObserver(records => {
    for (const r of records) {
      if (r.type === 'characterData') doText(r.target);
      else if (r.type === 'attributes') doAttrs(r.target);
      else r.addedNodes.forEach(walk);
    }
    addButton();
  }).observe(document.body, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS});

  window.knutLang = () => lang;
  applyAll();
})();
