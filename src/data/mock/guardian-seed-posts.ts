import type { ContentPost, ContentPostHeroSubject, ContentPostKind, ContentPostStatus } from "@/types/domain";
import {
  GUARDIAN_SEED_USE_LOCAL_POST_COVERS,
  type GuardianSeedRow,
} from "./guardian-seed-types";
import { resolveGuardianDisplayName } from "./guardian-seed-display-names";

type SeedPostTheme = {
  category_slug: string;
  kind: ContentPostKind;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  /** 일부 시드만 명시 — 크롭 우선순위 데모 */
  hero_subject?: ContentPostHeroSubject;
};

const UNSPLASH_COVER_IDS = [
  "photo-1604719314756-9048b615390b",
  "photo-1555939594-58d7cb561ad1",
  "photo-1519692938861-5d0bc062f546",
  "photo-1565680018434-b723cf961d3e",
  "photo-1507525428034-b723cf961d3e",
  "photo-1589871749729-1e2abc49b8f4",
  "photo-1614680376579-d9e0f7a729bd",
  "photo-1441986300917-64674bd600d8",
  "photo-1566988102596-43bb7b84db8f",
  "photo-1596422840783-7124f7369a1f",
  "photo-1519046904887-71707b70f783",
  "photo-1551218808-94e3e5618947",
  "photo-1506905925346-21bda4d32df4",
  "photo-1548115184-bc6547d06a58",
  "photo-1517154421773-0529f29ea451",
  "photo-1528164344705-47542687000d",
  "photo-1493976040374-85c8e12f0c0e",
  "photo-1502602898657-3e91760cbb34",
  "photo-1469854523086-cc02fe5d8800",
  "photo-1476514525535-07fb3b4ae5f1",
];

/** 로컬 `public/mock/post-covers/cover_XX.jpg` 추가 시 `GUARDIAN_SEED_USE_LOCAL_POST_COVERS`를 켭니다. */
export function guardianSeedPostCoverUrl(seq: number): string {
  const n = ((seq - 1) % 20) + 1;
  if (GUARDIAN_SEED_USE_LOCAL_POST_COVERS) {
    return `/mock/post-covers/cover_${String(n).padStart(2, "0")}.jpg`;
  }
  const id = UNSPLASH_COVER_IDS[(seq - 1) % UNSPLASH_COVER_IDS.length];
  return `https://images.unsplash.com/${id}?w=1200&q=80`;
}

const SEED_POST_THEMES: readonly SeedPostTheme[] = [
  {
    category_slug: "practical",
    kind: "practical",
    title: "교통카드 충전 — 키오스크에서 막힐 때 최소 동선",
    summary: "영어 화면이 없을 때 그림 메뉴와 직원 호출 버튼 위치를 기준으로 잡습니다.",
    body: "편의점 키오스크는 브랜드마다 색이 달라도 ‘교통카드’ 아이콘은 비슷한 편입니다. 화면이 한글만 나오면 금액 버튼부터 누르고 카드를 올리는 순서로 진행해 보세요. 정말 막히면 계산대 쪽을 가리키면 대부분 바로 도와줍니다. 동행 시에는 제가 앞서 순서를 짚어 드리고, 첫날에는 소액 충전으로 부담을 줄이는 것도 방법입니다.",
    tags: ["T-money", "편의점", "첫날"],
  },
  {
    category_slug: "local-tips",
    kind: "local_tip",
    title: "지하철 환승 — 표지판과 출구 번호를 한 번에 읽는 습관",
    summary: "‘몇 호선’보다 먼저 목적 방향 화살표를 확인하면 헷갈림이 줄어듭니다.",
    body: "큰 역은 분기가 많아서 출구 번호만 보면 오히려 더 혼란스러울 때가 있습니다. 먼저 노선 색 띠를 찾고, 그다음 목적지 방향 화살표를 따라가면 실수가 줄었습니다. 계단 중간에서 잠깐 멈춰 지도를 펼치기보다, 플랫폼 끝 안내판 앞에서 한 번에 정리하는 편이 안전합니다. 안심 동행에서는 이동 중 잠깐씩 체크포인트를 나눠 맞춥니다.",
    tags: ["지하철", "환승", "안내판"],
  },
  {
    category_slug: "practical",
    kind: "practical",
    title: "첫날 짐과 만남 장소 — ‘눈에 띄는 건물’보다 출구 기둥 번호",
    summary: "사람이 몰리는 광장 한가운데보다 출구 쪽 기둥이 만남에 더 정확합니다.",
    body: "넓은 광장에서는 ‘큰 조형물 앞’이 흔들리기 쉽습니다. 출구 번호와 기둥을 기준으로 잡으면 통화 중에도 위치 설명이 짧아집니다. 짐이 많으면 계단을 피해 엘리베이터 안내를 먼저 찾는 편이 좋고, 비가 오면 지하 연결 통로를 우선 고려합니다. 현장 동행에서는 짐 무게와 손이 자유로운지부터 확인합니다.",
    tags: ["만남", "출구", "짐"],
  },
  {
    category_slug: "food",
    kind: "food",
    title: "점심 피크 — 웨이팅 대신 ‘한 블록 안쪽’ 대안 찾기",
    summary: "메인 거리 전면이 붐비면 평행 골목의 리뷰 수와 최근 사진을 같이 봅니다.",
    body: "유명 식당 앞 줄이 길면, 같은 블록 안쪽으로 들어가면 비슷한 카테고리의 작은 식당이 종종 있습니다. 지도 앱에서 최근 리뷰 사진이 올라오는지, 메뉴판 사진이 있는지를 함께 보면 실패 확률이 줄었습니다. 첫 주문은 세트나 대표 메뉴 하나로 단순하게 가져가는 편이 마음이 편합니다. 추천 동행에서는 입맛과 알레르기를 먼저 짧게 정리합니다.",
    tags: ["식사", "웨이팅", "골목"],
    hero_subject: "mixed",
  },
  {
    category_slug: "local-tips",
    kind: "local_tip",
    title: "비 오는 날 카페 — 실내 좌석과 우산 꽂이 위치를 먼저 확인",
    summary: "입구가 좁은 매장은 우산 물기 때문에 자리 이동이 번거롭습니다.",
    body: "문이 자주 열리는 1층 코너 자리는 비 오는 날 바닥이 미끄러울 수 있습니다. 우산 꽂이가 안쪽에 있으면 들어가자마자 정리하고 자리를 잡는 순서가 편합니다. 창가 자리는 사진은 좋지만 냉기가 들어올 수 있어 겉옷 준비를 권합니다. 동행 시에는 ‘잠깐 쉬는 목표 시간’을 정해 두면 다음 이동이 수월합니다.",
    tags: ["비", "카페", "휴식"],
  },
  {
    category_slug: "hot-places",
    kind: "hot_place",
    title: "한강 공원 — 바람이 강할 때 산책과 휴게 스팟",
    summary: "강바람이 세면 낮은 울타리 쪽보다 상업 시설 뒤편 완충대가 편합니다.",
    body: "봄가을에는 바람이 갑자기 세지는 날이 있습니다. 사진을 찍더라도 잠깐이라도 모자나 머리 묶음을 챙기면 이후 이동이 편합니다. 매점·화장실 위치를 미리 짚어 두면 동선이 줄어듭니다. 지역 추천 관점에서는 ‘노을 시간’과 ‘바람 방향’을 같이 말해 주는 것이 체감 만족에 도움이 됩니다.",
    tags: ["한강", "산책", "날씨"],
  },
  {
    category_slug: "local-tips",
    kind: "local_tip",
    title: "북촌·주택가 골목 — 사진과 통행을 나누는 현실적인 기준",
    summary: "주민 통로에서는 셔터 소리와 역주행이 부담이 될 수 있어 옆 보도를 우선합니다.",
    body: "골목은 차와 보행이 좁게 겹치는 구간이 있습니다. 사진은 잠깐 멈춰 찍고, 바로 통행을 열어 주는 리듬이 중요합니다. 높은 곳을 찍고 싶다면 발 아래 돌계단과 빗물을 먼저 확인합니다. 안심 동행에서는 ‘찍을 때’와 ‘걸을 때’를 번갈아 안내하면 피로가 줄었습니다.",
    tags: ["북촌", "매너", "골목"],
  },
  {
    category_slug: "food",
    kind: "food",
    title: "전통시장 안에서 — 현금·카드 혼합 결제를 대비한 작은 습관",
    summary: "일부 코너는 현금만 되는 경우가 있어 작은 지폐를 나눠 두면 마음이 편합니다.",
    body: "시장은 코너마다 결제 방식이 달라서, 첫 구매 전에 짧게 물어보는 편이 시간을 아껴 줍니다. 음식을 들고 걸을 때는 뜨거운 컵의 뚜껑 고정을 먼저 확인합니다. 같이 걷는 동선에서는 ‘먹는 구간’과 ‘볼 구간’을 나누면 사람 흐름에 덜 밀립니다.",
    tags: ["시장", "결제", "길찾기"],
  },
  {
    category_slug: "shopping",
    kind: "shopping",
    title: "면세·환급 — 영수증 정리와 물품 포장 순서",
    summary: "영수증을 날짜별로 끼우면 카운터에서 시간이 줄었습니다.",
    body: "여러 매장을 돌면 영수증이 뭉치기 쉽습니다. 날짜별로 끼우거나, 금액이 큰 것부터 정리해 두면 카운터에서 설명이 짧아집니다. 포장된 상품은 뜯지 않은 채로 제시하는 경우가 많습니다. 쇼핑 동행에서는 ‘오늘 살 것’과 ‘내일 이후’를 나눠 가방 무게를 관리합니다.",
    tags: ["면세", "환급", "쇼핑"],
  },
  {
    category_slug: "local-tips",
    kind: "local_tip",
    title: "부산 해운대 — 바람이 강한 날 실내에서 만나기",
    summary: "모래와 바람이 겹치면 이어폰 통화도 힘들어져 실내 랜드마크가 안전합니다.",
    body: "해변가는 날씨에 따라 체감이 크게 달라집니다. 바람이 세면 모래가 옷과 가방 안으로 들어오기 쉬워, 짧은 만남은 역사나 몰 쪽이 편한 경우가 많았습니다. 그래도 산책을 원하면 방풍이 있는 쪽 보도를 고르고, 휴지와 물을 미리 챙깁니다. 지역 추천은 ‘날씨에 따라 같은 장소도 다른 경험’이라는 점을 솔직히 말해 주는 편이 좋습니다.",
    tags: ["해운대", "날씨", "만남"],
  },
  {
    category_slug: "hot-places",
    kind: "hot_place",
    title: "야경 구간 — 사진보다 발밑과 횡단 타이밍을 먼저",
    summary: "네온이 강하면 발밑 대비가 어두워 보일 수 있습니다.",
    body: "밤에는 조명이 화려한 만큼 그림자도 깊어집니다. 횡단보도에서는 신호가 바뀌기 직전 재확인을 습관화하면 좋습니다. 사진은 잠깐 멈추고, 렌즈를 들기 전에 주변 통행을 한 번 훑습니다. 동행에서는 ‘여기서 2분’처럼 시간을 짧게 나누면 흐름이 자연스럽습니다.",
    tags: ["야경", "안전", "보행"],
  },
  {
    category_slug: "practical",
    kind: "practical",
    title: "배터리와 데이터 — 긴 하루 일정을 나누는 체크리스트",
    summary: "보조배터리는 케이블 고정이 흔들리지 않게 먼저 확인합니다.",
    body: "지도·번역·결제가 한 기기에 몰리면 배터리 소모가 빠릅니다. 점심 전후로 한 번씩 충전 슬롯을 잡아 두면 저녁이 편합니다. 데이터가 불안하면 카페 와이파이는 비밀번호 표지판 위치를 사진으로 남겨 두면 재접속이 빠릅니다. 안심 동행에서는 ‘충전할 수 있는 20분’을 일정에 넣어 두는 것을 권합니다.",
    tags: ["배터리", "데이터", "준비"],
    hero_subject: "person",
  },
  {
    category_slug: "local-tips",
    kind: "local_tip",
    title: "화장실·물 — 관광지 밀집 구간에서의 현실적인 우선순위",
    summary: "표지판이 멀면 역사·대형 몰 쪽이 대체로 예측 가능합니다.",
    body: "긴 산책 코스는 화장실 위치를 미리 짚어 두면 마음이 한결 가벼워집니다. 물은 편의점에서 작은 병을 나눠 들고 가면 부담이 줄었습니다. 동행 시에는 속도가 다른 구성원이 있으면 ‘쉬는 지점’을 두 군데 정도만 정해도 충분합니다.",
    tags: ["휴게", "물", "동선"],
  },
  {
    category_slug: "practical",
    kind: "practical",
    title: "계단 많은 동네 — 신발과 짐 무게를 맞추는 작은 팁",
    summary: "발목이 불안하면 짧은 우회로가 오히려 전체 시간을 줄여 줍니다.",
    body: "언덕과 계단이 잦은 구간은 지도상 짧아 보여도 체력 소모가 큽니다. 신발이 미끄럽지 않은지 아침에 한 번 확인하고, 짐이 무거우면 택시 한 구간을 끼워 넣는 선택도 합리적입니다. 지역 추천에서는 ‘예쁜 골목’과 ‘편한 동선’을 같이 제시하면 만족도가 올라갑니다.",
    tags: ["보행", "계단", "짐"],
  },
  {
    category_slug: "local-tips",
    kind: "local_tip",
    title: "촬영·사진 — 허용 구역과 주변 동선을 먼저 확인",
    summary: "‘찍어도 되는지’가 애매하면 짧게 물어보는 것이 이후 마찰을 줄입니다.",
    body: "일부 전시·상점은 촬영 제한이 있습니다. 입구 안내를 먼저 읽고, 불확실하면 직원에게 짧게 확인합니다. 플래시는 통행에 방해가 되기 쉬워 끄는 편이 좋습니다. 동행에서는 촬영 시간을 정해 두면 서로 기다림이 줄었습니다.",
    tags: ["사진", "예절", "전시"],
  },
  {
    category_slug: "practical",
    kind: "practical",
    title: "늦은 밤 이동 — 택시 승차 위치와 목적지 표기",
    summary: "큰 교차로보다 건물 이름이 잡힌 쪽이 승차 설명이 짧아집니다.",
    body: "밤에는 지도 핀이 미세하게 어긋나도 기사님과 설명이 길어질 수 있습니다. 랜드마크 건물 이름을 함께 적어 두면 소통이 빨라집니다. 동승자가 있으면 먼저 탑승해 좌석을 정리하고, 목적지는 한글 주소를 화면으로 보여 주는 방식이 안전합니다. 안심 동행에서는 승차 전 번호판을 확인하는 습관을 같이 맞춥니다.",
    tags: ["야간", "택시", "안전"],
  },
  {
    category_slug: "local-tips",
    kind: "local_tip",
    title: "숙소와 역 거리 — ‘지도상 10분’과 ‘실제 짐 있는 10분’",
    summary: "짐이 있으면 출구 번호와 경사를 함께 보는 편이 정확합니다.",
    body: "지도의 직선 거리는 출구와 경사를 반영하지 못하는 경우가 많습니다. 캐리어가 있으면 지하 연결로가 있는지 먼저 찾습니다. 첫날에는 무리한 도보를 줄이고, 다음 날 여유로운 코스를 추천합니다.",
    tags: ["숙소", "도보", "짐"],
  },
  {
    category_slug: "practical",
    kind: "practical",
    title: "짐 보관·라커 — 몰·역 시설을 활용할 때 확인할 것",
    summary: "라커 크기와 결제 방식은 현장 표기가 가장 정확합니다.",
    body: "큰 캐리어는 라커에 안 들어가는 경우가 있어, 몰 안내데스크 쪽 대안을 먼저 물어보는 편이 좋습니다. 비밀번호형은 사진으로 남기면 실수가 줄었습니다. 동행에서는 귀중품을 분리해 소지하는지 짧게 확인합니다.",
    tags: ["라커", "짐", "역"],
  },
  {
    category_slug: "local-tips",
    kind: "local_tip",
    title: "우천 대체 코스 — 실내 동선을 ‘한 줄’로 잇기",
    summary: "지하 연결로와 몰을 이으면 우산을 접는 횟수가 줄어듭니다.",
    body: "비가 오면 야외 명소를 줄이고, 전시·몰·지하상가를 짧게 이어서 하루를 구성하면 피로가 덜했습니다. 우산은 접을 때 물기가 튀지 않게 한 번 털고 들어가는 습관이 실내를 쾌적하게 유지합니다. 추천 동행에서는 ‘비 올 때 플랜 B’를 전날 밤에 짧게만 정리해 둡니다.",
    tags: ["우천", "실내", "동선"],
  },
  {
    category_slug: "food",
    kind: "food",
    title: "테이크아웃 줄 — 주문을 단순화하면 대기 체감이 줄어듭니다",
    summary: "인기 메뉴 하나와 옵션 최소로 가면 실수도 줄었습니다.",
    body: "줄이 긴 매장은 옵션이 많을수록 결정 시간이 길어집니다. 대표 메뉴 하나로 고정하고, 포장인지 매장인지 먼저 말하면 계산이 빨라집니다. 동행에서는 알레르기와 뜨거운 음료 취향을 미리 짧게 정리합니다.",
    tags: ["테이크아웃", "주문", "대기"],
  },
  {
    category_slug: "local-tips",
    kind: "local_tip",
    title: "언어가 섞일 때 — 짧은 문장과 번역 앱 화면을 같이",
    summary: "긴 문장보다 키워드 세 개가 현장에서 통하는 경우가 많았습니다.",
    body: "완벽한 문장보다 ‘목적지·시간·인원’을 짧게 나열하면 소통이 빨라집니다. 번역 앱은 큰 글씨로 보여 주고, 동시에 한 번 더 천천히 읽어 주면 오해가 줄었습니다. 안심 동행에서는 제가 먼저 짧게 말하고, 필요할 때만 여행자분이 보완하는 흐름이 편했습니다.",
    tags: ["소통", "번역", "동행"],
  },
  {
    category_slug: "practical",
    kind: "practical",
    title: "아이 동반 이동 — 휴게 타이밍을 ‘장소’가 아니라 ‘시간’으로",
    summary: "30분마다 짧게 앉는 것이 긴 하루의 만족도를 올렸습니다.",
    body: "아이와 함께면 계단과 좁은 골목이 체감 난이도로 올라갑니다. 휴게는 카페뿐 아니라 넓은 보도의 벤치도 활용할 수 있습니다. 화장실은 ‘다음 코스 전’에 미리 들르는 습관이 좋습니다. 지역 추천은 놀이공간보다 ‘쉬기 쉬운 동선’을 우선 말해 주는 편이 현실적입니다.",
    tags: ["가족", "휴게", "동선"],
  },
  {
    category_slug: "local-tips",
    kind: "local_tip",
    title: "천천히 걷는 하루 — 속도 맞추기와 옆으로 비키기",
    summary: "뒤에서 밀리는 구간은 잠깐 멈춰 비켜 서면 전체가 편해집니다.",
    body: "붐비는 길은 속도 차이가 스트레스로 이어지기 쉽습니다. 사진이나 지도를 볼 때는 옆 공간으로 한 걸음 비키는 습관이 좋습니다. 동행에서는 ‘앞사람 속도’를 기본으로 하고, 필요할 때만 잠깐 빠르게 지나가는 구간을 잡습니다.",
    tags: ["보행", "매너", "혼잡"],
  },
  {
    category_slug: "practical",
    kind: "practical",
    title: "지도 앱 전환 — 오프라인 타일과 스크린샷 백업",
    summary: "데이터가 끊기면 미리 찍어 둔 출구 스크린샷이 가장 빠릅니다.",
    body: "지하에서는 위치가 튈 수 있어, 중요한 출구 화면은 스크린샷을 남겨 두면 마음이 편합니다. 배터리가 낮을 때는 밝기를 줄이고, 불필요한 앱을 닫는 것만으로도 체감이 달라집니다. 큐레이션 동행에서는 ‘오늘의 핵심 3지점’만 지도에 핀으로 고정합니다.",
    tags: ["지도", "오프라인", "준비"],
  },
  {
    category_slug: "shopping",
    kind: "shopping",
    title: "K뷰티 매장 — 테스터와 결제 줄을 나눠 보는 동선",
    summary: "테스터 구역은 손 소독 후 짧게 시도하는 편이 매너에 맞습니다.",
    body: "인기 매장은 결제 줄과 상담 줄이 분리되어 있습니다. 먼저 원하는 카테고리만 집어 테스트하고, 장바구니를 한 번에 정리하면 시간이 줄었습니다. 면세·즉시 환급 안내는 카운터마다 다를 수 있어 짧게 확인합니다.",
    tags: ["K뷰티", "쇼핑", "면세"],
  },
  {
    category_slug: "k-content",
    kind: "k_content",
    title: "굿즈·앨범 샵 — 평일 슬롯과 포장 확인",
    summary: "포장 테이프와 영수증을 받은 뒤 바로 가방에 넣으면 분실이 줄었습니다.",
    body: "주말 오후는 대기가 길어지기 쉽습니다. 평일 점심 전후가 상대적으로 여유로웠습니다. 포장이 약하면 한 장 더 감싸 달라고 부탁해도 대부분 흔쾌히 해 줍니다. 동행에서는 ‘구매 후 5분’ 안에 가방 정리를 같이 확인합니다.",
    tags: ["K-pop", "굿즈", "대기"],
    hero_subject: "place",
  },
  {
    category_slug: "hot-places",
    kind: "hot_place",
    title: "궁궐 인근 산책 — 그늘과 벤치를 기준으로 쉬는 루프",
    summary: "정오 전후는 그늘 구간을 먼저 잡고, 사진은 그 다음이 편합니다.",
    body: "넓은 광장형 공간은 햇빛이 강할 때 그늘 벤치를 기준으로 루프를 만듭니다. 물을 미리 챙기면 중간 이탈이 줄어듭니다. 단체 관광이 몰리기 전 오전이 상대적으로 여유로웠습니다. 지역 추천은 ‘사진’보다 ‘쉴 곳’을 먼저 짚어 주면 동행 만족도가 좋았습니다.",
    tags: ["궁궐", "산책", "휴게"],
  },
  {
    category_slug: "local-tips",
    kind: "local_tip",
    title: "한복 대여 시간 — 착탈과 보관을 일정에 넣기",
    summary: "착용 시간이 길면 신발과 허리 피로가 먼저 올라옵니다.",
    body: "한복은 계단과 바람에 따라 체감이 달라집니다. 대여 시간을 넉넉히 잡되, 중간에 앉아 쉴 장소를 하나 정해 두면 좋습니다. 보관함 번호는 사진으로 남기면 찾을 때 빠릅니다. 큐레이션에서는 ‘사진 코스’와 ‘쉬는 코스’를 분리해 제안합니다.",
    tags: ["한복", "대여", "일정"],
  },
  {
    category_slug: "local-tips",
    kind: "local_tip",
    title: "야시장·밀집 행사 — 소지품 앞쪽 보관과 이동 리듬",
    summary: "가방을 앞으로 돌리면 혼잡 구간에서 마음이 한결 편합니다.",
    body: "사람이 몰리는 구간은 가방을 앞으로 돌리고, 귀중품은 안쪽 주머니에 두는 편이 안전합니다. 현금을 쓸 때는 지갑을 길게 열어 두지 않는 습관이 좋습니다. 동행에서는 ‘잠깐 멈출 때’와 ‘계속 걸을 때’를 번갈아 맞춥니다.",
    tags: ["야시장", "안전", "혼잡"],
  },
  {
    category_slug: "practical",
    kind: "practical",
    title: "지하상가 길찾기 — 색 띠와 번호를 한 세트로 기억",
    summary: "‘몇 번 출구’만으로는 부족할 때가 많아 상가 구역 번호를 같이 봅니다.",
    body: "큰 역 지하상가는 구역 번호가 표시된 경우가 많습니다. 색 띠와 구역을 세트로 기억하면 길을 잃었을 때 되찾기 쉽습니다. 화장실 표지판은 상가 중앙부에 모이는 경우가 많습니다. 안심 동행에서는 제가 앞서 구역 표지를 가리키며 속도를 맞춥니다.",
    tags: ["지하상가", "길찾기", "역"],
  },
  {
    category_slug: "practical",
    kind: "practical",
    title: "공영주차·대안 — 도보 전 마지막 구간만 차로",
    summary: "혼잡 지역은 주차보다 내려서 걷는 쪽이 전체 시간이 짧을 때가 있습니다.",
    body: "중심가는 주차 대기가 길어질 수 있습니다. 목적지 근처 공영주차를 미리 보고, 마지막 구간만 도보로 잇는 방식이 현실적입니다. 내비게이션 핀과 실제 입구가 다를 수 있어 도착 직전에 한 번 더 확인합니다.",
    tags: ["주차", "도보", "동선"],
  },
  {
    category_slug: "food",
    kind: "food",
    title: "편의점 도시락·간단 식사 — 자리와 쓰레기 분리",
    summary: "매장 내 취식이 안 되는 경우가 있어 벤치·공원 쪽을 미리 짚습니다.",
    body: "편의점은 매장마다 취식 규칙이 다릅니다. 포장이면 근처 벤치나 공원 쪽을 안내합니다. 쓰레기는 분리수거 표시를 확인하고, 재활용이 애매하면 일반 쓰레기 통을 찾습니다. 짧은 동행 식사는 메뉴를 단순하게 고정하면 선택 피로가 줄었습니다.",
    tags: ["편의점", "간단식", "쓰레기"],
  },
  {
    category_slug: "local-tips",
    kind: "local_tip",
    title: "이른 아침 첫 이동 — 사람 적은 슬롯에 맞춘 만남",
    summary: "첫차·이른 슬롯은 출구 혼잡이 적어 설명이 짧아집니다.",
    body: "이른 시간은 역 안내가 한눈에 들어오는 경우가 많습니다. 다만 상점이 닫혀 있을 수 있어 물과 간단한 간식은 미리 챙깁니다. 안심 동행에서는 ‘집결 시간’을 5분 넉넉히 잡아 스트레스를 줄입니다.",
    tags: ["아침", "첫이동", "만남"],
  },
  {
    category_slug: "food",
    kind: "food",
    title: "디저트·카페 — 당도와 카페인을 하루 일정에 맞추기",
    summary: "저녁 일정이 길면 오후 디저트는 가볍게 가져가는 편이 좋습니다.",
    body: "여행 후반으로 갈수록 카페인과 당 섭취가 쌓입니다. 오후에는 디저트를 반쪽만 나눠 먹거나, 녹차류로 바꾸는 선택도 있습니다. 동행에서는 알레르기와 유당 불내성을 미리 짧게 확인합니다.",
    tags: ["카페", "디저트", "컨디션"],
  },
  {
    category_slug: "hot-places",
    kind: "hot_place",
    title: "전망 좋은 구간 — 바람과 난간을 먼저 확인",
    summary: "전망대는 바람이 강할 때 모자와 가방 끈을 정리합니다.",
    body: "높은 곳은 바람이 예상보다 셀 수 있습니다. 사진을 찍을 때도 난간에서 몸을 숙이는 각도를 과하지 않게 조절합니다. 동행에서는 서로 거리를 두고 찍으면 사진도 통행도 편합니다.",
    tags: ["전망", "안전", "바람"],
  },
  {
    category_slug: "k-content",
    kind: "k_content",
    title: "촬영지 인근 카페 — 팬덤 예절과 소음",
    summary: "촬영지 인근은 사진보다 통행 우선이 현장 분위기를 해치지 않습니다.",
    body: "인기 촬영지 주변은 사람이 몰리기 쉽습니다. 촬영은 짧게 하고, 카페에서는 주문 후 자리를 빨리 정리하는 편이 좋습니다. 동행에서는 ‘사진 2분’처럼 시간을 정해 두면 서로 부담이 줄었습니다.",
    tags: ["촬영지", "카페", "예절"],
  },
  {
    category_slug: "shopping",
    kind: "shopping",
    title: "기념품 고르기 — 무게와 파손을 먼저 고려",
    summary: "유리·도자기는 포장 상태를 계산대에서 한 번 더 확인합니다.",
    body: "기념품은 마음에 들어도 무게가 하루 종일 따라옵니다. 깨지기 쉬운 것은 포장을 두 겹 부탁해도 됩니다. 동행에서는 ‘마지막 날 살 것’과 ‘첫날 살 것’을 나누면 가방 관리가 쉬워집니다.",
    tags: ["기념품", "포장", "쇼핑"],
  },
  {
    category_slug: "practical",
    kind: "practical",
    title: "공항·역 첫 연결 — 리무진·지하철 선택을 짐과 컨디션으로",
    summary: "짐이 많으면 환승이 적은 노선이 체감 피로를 줄였습니다.",
    body: "첫 이동은 컨디션에 따라 선택이 갈립니다. 리무진은 대기 시간이 변수이고, 지하철은 환승이 변수입니다. 캐리어가 두 개 이상이면 엘리베이터 유무를 먼저 보는 편이 좋습니다. 안심 동행에서는 ‘도착 후 30분’을 버퍼로 잡는 것을 권합니다.",
    tags: ["공항", "첫이동", "교통"],
  },
  {
    category_slug: "local-tips",
    kind: "local_tip",
    title: "동행 첫 인사 — 오늘 목표와 ‘중단 신호’를 미리 맞추기",
    summary: "‘잠깐 쉬자’를 말하기 쉬운 분위기를 만드는 것이 하루 만족도에 큽니다.",
    body: "동행은 실력만큼이나 커뮤니케이션 리듬이 중요합니다. 하루 시작에 목표 지점 2~3개만 정하고, 중간에 속도가 떨어지면 바로 쉬는 것을 권합니다. 저는 길 안내 외에도 화장실·물·그늘 같은 기본 니즈를 먼저 챙기는 편입니다.",
    tags: ["동행", "커뮤니케이션", "안심"],
  },
  {
    category_slug: "local-tips",
    kind: "local_tip",
    title: "지역 추천 — ‘필수’보다 ‘대체’를 한 가지씩",
    summary: "막히거나 피곤할 때 바꿀 수 있는 플랜 B가 있으면 마음이 편합니다.",
    body: "여행은 변수가 많아서 한 코스에 올인하면 스트레스가 커집니다. 같은 테마라도 거리가 짧은 대체 코스를 하나씩만 준비해 두면 선택지가 생깁니다. 저는 현장에서 날씨와 체력을 보고 플랜 B를 꺼내는 방식을 선호합니다.",
    tags: ["추천", "플랜B", "지역"],
  },
  {
    category_slug: "food",
    kind: "food",
    title: "해산물·시푸드 코너 — 주문 단위와 매운맛 표현",
    summary: "인분 개념이 애매할 때는 손가락으로 수량을 같이 확인합니다.",
    body: "시장형 코너는 ‘1인분’ 기준이 매장마다 다릅니다. 매운 정도는 ‘조금’보다 ‘거의 없음’처럼 더 구체적으로 말하면 실수가 줄었습니다. 동행에서는 알레르기 재료를 메모로 보여 주는 방법이 빠릅니다.",
    tags: ["해산물", "주문", "매운맛"],
  },
  {
    category_slug: "hot-places",
    kind: "hot_place",
    title: "야외 전시·팝업 — 줄과 일정을 짧게 나누기",
    summary: "팝업은 폐장 직전이 오히려 줄이 짧을 때가 있습니다.",
    body: "인기 팝업은 오픈 직후와 주말이 붐빕니다. 평일 늦은 오후는 상대적으로 줄이 안정적인 경우가 있었습니다. 동행에서는 ‘기다릴 최대 시간’을 미리 정해 두면 만족도가 올라갑니다.",
    tags: ["팝업", "전시", "대기"],
  },
  {
    category_slug: "practical",
    kind: "practical",
    title: "택시·호출앱 — 승차 전 목적지를 한글로 저장",
    summary: "복사해 둔 한글 주소가 통화보다 빠른 경우가 많았습니다.",
    body: "호출앱은 목적지 핀 오차가 생길 수 있습니다. 한글 주소를 메모에 저장해 두고 보여 주면 기사님과 오해가 줄었습니다. 동행에서는 승차 전 번호판과 앱 상 차량 정보를 짧게 대조합니다.",
    tags: ["호출앱", "택시", "주소"],
  },
];

function pickTheme(globalIndex: number, authorId: string): SeedPostTheme {
  const tail = authorId.charCodeAt(authorId.length - 1) || 0;
  const idx = (globalIndex * 13 + tail) % SEED_POST_THEMES.length;
  return SEED_POST_THEMES[idx]!;
}

function isoCreatedAt(globalIndex: number): string {
  const d = new Date("2026-03-24T12:00:00.000Z");
  d.setUTCDate(d.getUTCDate() - globalIndex);
  d.setUTCHours(8 + (globalIndex % 9), (globalIndex * 7) % 60, 0, 0);
  return d.toISOString();
}

function scoresForStatus(status: ContentPostStatus, globalIndex: number) {
  const base = 30 + (globalIndex % 40);
  if (status === "approved") {
    return {
      usefulness_votes: 120 + (globalIndex % 500),
      helpful_rating: 4.2 + (globalIndex % 8) / 10,
      popular_score: 50 + (globalIndex % 45),
      recommended_score: 55 + (globalIndex % 40),
    };
  }
  if (status === "pending") {
    return {
      usefulness_votes: 0,
      helpful_rating: null as number | null,
      popular_score: 20 + (globalIndex % 15),
      recommended_score: 25 + (globalIndex % 15),
    };
  }
  if (status === "draft") {
    return {
      usefulness_votes: 0,
      helpful_rating: null as number | null,
      popular_score: 10 + (globalIndex % 10),
      recommended_score: 12 + (globalIndex % 10),
    };
  }
  return {
    usefulness_votes: 0,
    helpful_rating: null as number | null,
    popular_score: 15 + (globalIndex % 12),
    recommended_score: 10 + (globalIndex % 10),
  };
}

const statusShort: Record<ContentPostStatus, string> = {
  approved: "ap",
  pending: "pe",
  draft: "dr",
  rejected: "re",
};

function pushPosts(
  row: GuardianSeedRow,
  status: ContentPostStatus,
  count: number,
  globalIndexRef: { n: number },
  out: ContentPost[],
) {
  for (let i = 0; i < count; i++) {
    globalIndexRef.n += 1;
    const g = globalIndexRef.n;
    const theme = pickTheme(g, row.id);
    const id = `seed-${row.id}-${statusShort[status]}-${String(i + 1).padStart(2, "0")}`;
    const sc = scoresForStatus(status, g);
    out.push({
      id,
      author_user_id: row.id,
      author_display_name: resolveGuardianDisplayName(row.id, row.display_name),
      region_slug: row.primary_region_slug,
      category_slug: theme.category_slug,
      kind: theme.kind,
      ...(theme.hero_subject != null ? { hero_subject: theme.hero_subject } : {}),
      title: theme.title,
      body: theme.body,
      summary: theme.summary,
      status,
      created_at: isoCreatedAt(g),
      tags: [...theme.tags, row.primary_region_slug === "busan" ? "부산" : "서울"],
      usefulness_votes: sc.usefulness_votes,
      helpful_rating: sc.helpful_rating,
      popular_score: sc.popular_score,
      recommended_score: sc.recommended_score,
      featured: false,
      /** 커버 없음 → `getPostHeroImageUrl`이 제목·본문·태그 기준으로 보강(샘플 포스트는 오버레이에서 별도 커버). */
      cover_image_url: null,
    });
  }
}

/** `GUARDIAN_SEED_ROWS`의 `posts_plan`과 동일한 개수의 포스트를 생성합니다. */
export function buildGuardianSeedPosts(rows: readonly GuardianSeedRow[]): ContentPost[] {
  const out: ContentPost[] = [];
  const globalIndexRef = { n: 0 };
  for (const row of rows) {
    const p = row.posts_plan;
    pushPosts(row, "approved", p.approved, globalIndexRef, out);
    pushPosts(row, "pending", p.pending, globalIndexRef, out);
    pushPosts(row, "draft", p.draft, globalIndexRef, out);
    pushPosts(row, "rejected", p.rejected, globalIndexRef, out);
  }
  return out;
}
