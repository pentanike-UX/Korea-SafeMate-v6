/**
 * Mock Haru Route — 서울 궁궐 골목에서 만나는 K-뮤직 씬
 * T10 Route View 개발·시연용. 실 Supabase 데이터로 교체 예정.
 *
 * 경로: 경복궁 근정전 → 경회루 → 소격동 종친부 → 국립현대미술관 서울관 → 덕수궁 대한문
 * 테마: BTS 〈IDOL〉·〈소우주〉 · CL 〈화(HWA)〉 · 이날치 ‘Feel the Rhythm of Korea’
 *
 * 비즈니스 메모(2026-05-21): 본 페이지(하루루트)는 결제 게이트가 작동하는 거래 자산.
 * 하루웨이(/posts/[id])는 테마 정서를 무료로 제공하고,
 * 정확한 위치·감상 포인트·이동 동선·소요 시간은 여기(하루루트)에서만 노출.
 */
import type { HaruRoute, SpotArtist } from "@/types/haru";

// ── 아티스트 메타 (이 코스 5개 스팟에 부착) ───────────────────────────────
// 비즈니스 메모: 아바타 이미지는 저작권 이슈로 데모에서는 이니셜+컬러 fallback만.
// 실서비스 전환 시 라이선스 확인된 이미지 또는 공식 프로필을 avatar_url로 대체.

// 비즈니스 메모(2026-05-21): 음악 커버·영상 썸네일·외부 링크는 모두 시연용 목 데이터.
// 트랙 cover_url은 비워두고 accent_class 그라데이션 fallback으로 렌더 → 외부 이미지 의존 0.
// 영상 thumbnail_url은 YouTube CDN(i.ytimg.com)을 직접 참조해 실제 영상 비주얼을 살림.
const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// 비즈니스 메모: 본 mock은 내부 시연 전용. YouTube 채널 핸들의 정합성 보장 어렵기에
// BTS는 검증된 공식 핸들(@BANGTANTV) 직접 사용, 나머지는 YouTube 검색 결과 URL로 폴백
// (어떤 채널이라도 첫 결과로 노출돼 깨짐 없음). 죽은 사이트(www.verycherry.world,
// www.ambiguousdc.com)는 해당 필드 제거. 프로필 이미지는 사용자가 BTS는 직접 교체 예정,
// 나머지는 프로젝트 내 기존 mock 프로필 이미지를 임시 대표 이미지로 활용.
const ytChannelSearch = (q: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

const ARTIST_BTS: SpotArtist = {
  id: "bts",
  name: "BTS",
  name_en: "BTS",
  initials: "BTS",
  accent_class: "bg-violet-600 text-white",
  // avatar_url: 사용자가 직접 교체 예정 (이니셜 fallback로 노출)
  agency: "HYBE · BIG HIT MUSIC",
  agency_url: "https://hybecorp.com/",
  official_site_url: "https://bts.ibighit.com/",
  youtube_channel_url: "https://www.youtube.com/@BANGTANTV",
  instagram_url: "https://www.instagram.com/bts.bighitofficial/",
  rep_works: ["Dynamite", "IDOL", "소우주 (Mikrokosmos)", "Spring Day", "Butter"],
  scene: "BTS Week (NBC 〈더 투나잇 쇼〉)에서 〈IDOL〉·〈소우주〉를 경복궁에서 공연",
  tracks: [
    { id: "bts-idol", title: "IDOL", title_ko: "아이돌", year: 2018, youtube_url: yt("pBuZEGYXA6E") },
    { id: "bts-mikrokosmos", title: "Mikrokosmos", title_ko: "소우주", year: 2019, youtube_url: yt("Y3cV-jbeRYo") },
    { id: "bts-dynamite", title: "Dynamite", year: 2020, youtube_url: yt("gdZLi9oWNZg") },
    { id: "bts-butter", title: "Butter", year: 2021, youtube_url: yt("WMweEpGlu_U") },
    { id: "bts-spring-day", title: "Spring Day", title_ko: "봄날", year: 2017, youtube_url: yt("xEeFrLSkMm8") },
  ],
  featured_videos: [
    {
      id: "bts-tonight-idol",
      title: "IDOL @ The Tonight Show — BTS Week (경복궁)",
      kind: "stage",
      thumbnail_url: ytThumb("9Y3v_6E7frw"),
      youtube_url: yt("9Y3v_6E7frw"),
    },
    {
      id: "bts-tonight-mikrokosmos",
      title: "Mikrokosmos @ The Tonight Show — BTS Week (경회루)",
      kind: "stage",
      thumbnail_url: ytThumb("DCYxn0SDQpI"),
      youtube_url: yt("DCYxn0SDQpI"),
    },
  ],
};

const ARTIST_CL: SpotArtist = {
  id: "cl",
  name: "CL (씨엘)",
  name_en: "CL",
  initials: "CL",
  accent_class: "bg-pink-500 text-white",
  avatar_url: "/mock/profiles/profile_03_avatar.jpg",
  agency: "前 YG · 2NE1",
  // agency_url 제거: www.verycherry.world 도메인 응답 없음
  // official_site_url 제거: chaelincl.com 검증 불가, 보수적으로 숨김
  youtube_channel_url: ytChannelSearch("CL 씨엘 official"),
  instagram_url: "https://www.instagram.com/chaelincl/",
  rep_works: ["HWA (화)", "나쁜 기집애", "Lover Like Me", "I Am the Best (2NE1)"],
  scene: "CBS 〈더 레이트 레이트 쇼 위드 제임스 코든〉에서 〈화(HWA)〉를 전통×현대 공간에서 공연",
  tracks: [
    { id: "cl-hwa", title: "HWA", title_ko: "화 (火花)", year: 2021, youtube_url: yt("ZWjEYWLcfvE") },
    { id: "cl-lover-like-me", title: "Lover Like Me", year: 2021, youtube_url: yt("rD-CmZRgbgs") },
    { id: "cl-the-baddest-female", title: "나쁜 기집애", title_ko: "The Baddest Female", year: 2013, youtube_url: yt("twC8d2-72-Q") },
    { id: "2ne1-i-am-the-best", title: "I Am the Best", title_ko: "내가 제일 잘 나가 (2NE1)", year: 2011, youtube_url: yt("vBSXSAuc8Xs") },
  ],
  featured_videos: [
    {
      id: "cl-corden-hwa",
      title: "HWA @ The Late Late Show with James Corden (종친부·MMCA)",
      kind: "stage",
      thumbnail_url: ytThumb("Hj3pyDPwSrk"),
      youtube_url: yt("Hj3pyDPwSrk"),
    },
  ],
};

const ARTIST_LEENALCHI: SpotArtist = {
  id: "leenalchi",
  name: "이날치 (LEENALCHI)",
  name_en: "LEENALCHI",
  initials: "이날",
  accent_class: "bg-amber-600 text-white",
  avatar_url: "/mock/profiles/profile_07_avatar.jpg",
  agency: "Mirrorball Music",
  agency_url: "https://mirrorballmusic.co.kr/",
  official_site_url: "https://www.leenalchi.com/",
  youtube_channel_url: ytChannelSearch("이날치 LEENALCHI"),
  instagram_url: "https://www.instagram.com/leenalchi/",
  rep_works: ["범 내려온다", "어류도감", "Feel the Rhythm of Korea: Seoul"],
  scene: "한국관광공사 'Feel the Rhythm of Korea' 서울 편 — 판소리 베이스 얼터너티브",
  tracks: [
    { id: "leenalchi-tiger", title: "Tiger is Coming", title_ko: "범 내려온다", year: 2020, youtube_url: yt("YbtV0PiVEvI") },
    { id: "leenalchi-fishing", title: "어류도감", year: 2020, youtube_url: yt("9Q4tdHmftcs") },
  ],
  featured_videos: [
    {
      id: "leenalchi-rhythm-seoul",
      title: "Feel the Rhythm of Korea: SEOUL (대한문)",
      kind: "mv",
      thumbnail_url: ytThumb("3J7iWnYIjqM"),
      youtube_url: yt("3J7iWnYIjqM"),
    },
    {
      id: "leenalchi-tiger-mv",
      title: "범 내려온다 — Official Performance Film",
      kind: "mv",
      thumbnail_url: ytThumb("ydGzlIvgYTQ"),
      youtube_url: yt("ydGzlIvgYTQ"),
    },
  ],
};

const ARTIST_AMBIGUOUS: SpotArtist = {
  id: "ambiguous",
  name: "앰비규어스 댄스컴퍼니",
  name_en: "Ambiguous Dance Company",
  initials: "AMB",
  accent_class: "bg-teal-600 text-white",
  avatar_url: "/mock/profiles/profile_10_avatar.jpg",
  agency: "독립 (김보람 안무가)",
  // agency_url / official_site_url 제거: www.ambiguousdc.com 응답 없음
  youtube_channel_url: ytChannelSearch("Ambiguous Dance Company 앰비규어스"),
  instagram_url: "https://www.instagram.com/ambiguousdc/",
  rep_works: ["Feel the Rhythm of Korea", "Body Concert", "BTS·BLACKPINK 안무 협업"],
  scene: "이날치와 함께 'Feel the Rhythm' 서울 편 안무·퍼포먼스",
  tracks: [
    { id: "amb-rhythm-seoul", title: "Feel the Rhythm of Korea: Seoul (안무)", year: 2020, youtube_url: yt("3J7iWnYIjqM") },
  ],
  featured_videos: [
    {
      id: "amb-body-concert",
      title: "Body Concert — Highlight Reel",
      kind: "stage",
      thumbnail_url: ytThumb("kPaPdaB1QRA"),
      youtube_url: yt("kPaPdaB1QRA"),
    },
  ],
};

export const mockHaruRoute: HaruRoute = {
  id: "mock-route-kmusic-palace-01",
  title: {
    ko: "서울 궁궐 골목에서 만나는 K-뮤직 씬",
    en: "K-Music Stages Across Seoul's Palaces",
  },
  guardian: {
    display_name: "Seoho · Seoul Palace Tribe",
    photo_url: null,
  },
  total_duration_min: 240, // 4시간 (5스팟 + 인사동 케타포 마무리)
  estimated_cost_min_krw: 0,
  estimated_cost_max_krw: 60000, // 경복궁·덕수궁 입장료 + 인사동 굿즈·음료 (선택)
  recommended_time_of_day: "morning",
  cover_image_url: "/mock/posts/seoul/kmusic/spot1-geunjeongjeon-1.jpg",
  spots: [
    // ── 1. 경복궁 근정전 — BTS 〈IDOL〉 ───────────────────────────────────────
    {
      id: "spot-01",
      order: 1,
      catalog: {
        name: {
          ko: "경복궁 근정전",
          en: "Geunjeongjeon, Gyeongbokgung",
        },
        category: "palace",
        category_emoji: "🏯",
        image_url: "/mock/posts/seoul/kmusic/spot1-geunjeongjeon-1.jpg",
        address: "서울 종로구 사직로 161",
        lat: 37.5786,
        lng: 126.977,
      },
      stay_min: 35,
      guardian_note: {
        ko: "BTS가 〈더 투나잇 쇼 스타링 지미 팰런〉의 ‘BTS Week’에서 〈IDOL〉 무대를 선보인 곳. 조선 왕실의 격식을 상징하는 경복궁의 중심 전각입니다.",
        en: "Where BTS performed 'IDOL' during 'BTS Week' on The Tonight Show. The throne hall — symbol of Joseon court formality.",
      },
      move_from_prev_method: null,
      move_from_prev_min: null,
      featured: true,
      artists: [ARTIST_BTS],
      spot_types: ["start", "scene", "photo"],
      soundtrack: {
        artist_id: "bts",
        track_id: "bts-idol",
        curator_note: {
          ko: "근정전 마당의 축과 〈IDOL〉의 직선 비트가 정확히 겹치는 순간. 한 곡만 듣고 들어가야 한다면 이 곡.",
          en: "The axis of the courtyard and the straight beat of 'IDOL' align here. If you listen to one song before stepping in — this one.",
        },
      },
      details: {
        gallery_image_urls: [
          "/mock/posts/seoul/kmusic/spot1-geunjeongjeon-1.jpg",
          "/mock/posts/seoul/kmusic/spot1-geunjeongjeon-2.jpg",
          "/mock/posts/seoul/kmusic/spot1-geunjeongjeon-3.jpg",
          "/mock/posts/seoul/kmusic/spot1-geunjeongjeon-4.webp",
        ],
        why_here: {
          ko: "왜 〈IDOL〉이 강하게 보였는지 알게 되는 자리. 넓게 열린 마당, 정면으로 뻗은 축, 반복되는 전각의 선이 퍼포먼스를 더 크게 만듭니다. 음악은 현대적이지만 배경은 가장 한국적인 궁궐 — 화면 속 장면은 단순한 무대가 아니라 ‘서울이 자신을 소개하는 방식’이었습니다.",
          en: "Standing here you understand why 'IDOL' felt monumental. The open courtyard, straight axis, and repeating eave lines amplify any performance. Modern music against the most Korean of backdrops — less a stage than 'how Seoul introduces itself.'",
        },
        what_to_do: {
          ko: "① 마당 입구에서 멀리서 한 컷 — 무대 전체 스케일이 보임 ② 가까이 다가가 단청·지붕선 한 컷 — 디테일이 살아남 ③ 마당 가장자리 그늘에서 호흡 정리하고 경회루(서북) 방향으로 이동.",
          en: "① Far-shot from the courtyard entrance — full stage scale ② Close-up of eaves + dancheong details ③ Catch a breath at the shaded edge, then head NW toward Gyeonghoeru.",
        },
        photo_tip: {
          ko: "정면 축 컷 1장 + 단청 디테일 1장이면 충분합니다. 광각으로 욕심내면 사람만 잡힙니다. 빛은 오전 9~11시가 가장 부드러움.",
          en: "One axis-aligned wide + one dancheong detail is enough. Wide-angle overshoots into crowd shots. Best light: 9–11 AM.",
        },
        caution: {
          ko: "근정전 내부는 진입 불가. 마당 끝까지만 다가갈 수 있습니다. 단체 시간대는 정면 컷 어려움 — 10시 이전 또는 폐장 1시간 전 추천.",
          en: "Interior is closed; you can only approach the steps. Group tours dominate midday — go before 10 AM or last hour before close.",
        },
      },
    },
    // ── 2. 경복궁 경회루 — BTS 〈소우주〉 ─────────────────────────────────────
    {
      id: "spot-02",
      order: 2,
      catalog: {
        name: {
          ko: "경복궁 경회루",
          en: "Gyeonghoeru, Gyeongbokgung",
        },
        category: "palace",
        category_emoji: "🪷",
        image_url: "/mock/posts/seoul/kmusic/spot2-gyeonghoeru-1.webp",
        address: "경복궁 내 (서북측)",
        lat: 37.5793,
        lng: 126.9745,
      },
      stay_min: 30,
      guardian_note: {
        ko: "같은 BTS Week에서 〈소우주〉가 배경 삼은 누각. 근정전이 강한 에너지였다면 경회루는 여백의 무대입니다.",
        en: "Where 'Mikrokosmos' (Soyojoo) was filmed during the same BTS Week — a pavilion of stillness, the counterweight to Geunjeongjeon's energy.",
      },
      move_from_prev_method: "walk",
      move_from_prev_min: 6,
      artists: [ARTIST_BTS],
      spot_types: ["scene", "rest", "photo"],
      soundtrack: {
        artist_id: "bts",
        track_id: "bts-mikrokosmos",
        curator_note: {
          ko: "물 위 누각의 여백을 그대로 들이쉬는 곡. 근정전이 외향의 〈IDOL〉이라면 경회루는 내향의 〈소우주〉.",
          en: "A song that breathes in the space of a pavilion over water. Where Geunjeongjeon was outward, Gyeonghoeru turns inward.",
        },
      },
      details: {
        gallery_image_urls: [
          "/mock/posts/seoul/kmusic/spot2-gyeonghoeru-1.webp",
          "/mock/posts/seoul/kmusic/spot2-gyeonghoeru-2.webp",
          "/mock/posts/seoul/kmusic/spot2-gyeonghoeru-3.jpeg",
        ],
        why_here: {
          ko: "물 위에 떠 있는 듯한 누각은 낮에는 단정하고 해가 기울면 더 깊어집니다. 〈소우주〉의 분위기와 잘 맞는 이유 — 공간이 음악의 여백을 만들어주기 때문입니다. 화려하게 밀어붙이지 않고, 받쳐주는 무대.",
          en: "A pavilion floating over water — clean at noon, deeper at golden hour. It suits 'Mikrokosmos' because the space *creates the rests* in the song.",
        },
        what_to_do: {
          ko: "① 정면이 아닌 30도 비낀 각도에서 누각·물·하늘이 한 프레임에 들어오는 자리 찾기 ② 인물보다 공간의 여백을 우선하는 컷 ③ 북문(신무문) 방향 → 동측 담장 따라 종친부로.",
          en: "① Move 30° off-axis until pavilion, water, and sky align in one frame ② Frame the space, not the person ③ Exit via the north gate (Sinmumun) and walk the east wall toward Jongchin-bu.",
        },
        photo_tip: {
          ko: "수면 반영을 노린다면 무풍 오전이 베스트. 황혼이라면 누각이 실루엣이 되는 18:00 전후.",
          en: "For water reflections: still mornings. For silhouettes: around 6 PM at dusk.",
        },
        caution: {
          ko: "물가 난간 너머는 출입 금지. 한 컷 위해 넘지 마세요. 누각 내부는 사전 예약자만 진입.",
          en: "Do not cross the waterside railing. Interior access by advance reservation only.",
        },
      },
    },
    // ── 3. 소격동 종친부 — CL 〈화(HWA)〉 ───────────────────────────────────
    {
      id: "spot-03",
      order: 3,
      catalog: {
        name: {
          ko: "소격동 종친부 경근당·옥첩당",
          en: "Jongchin-bu, Sogyeok-dong",
        },
        category: "heritage",
        category_emoji: "🏛",
        image_url: "/mock/posts/seoul/kmusic/spot3-sogyeokdong-1.jpg",
        address: "서울 종로구 삼청로 30",
        lat: 37.5773,
        lng: 126.9803,
      },
      stay_min: 25,
      guardian_note: {
        ko: "CL이 미국 〈제임스 코든 쇼〉에서 〈화(HWA)〉를 공개한 무대 배경. 경복궁이 장엄함이라면 종친부는 조용한 밀도입니다.",
        en: "Backdrop for CL's 'HWA' on The Late Late Show with James Corden. If Gyeongbokgung is grandeur, Jongchin-bu is quiet density.",
      },
      move_from_prev_method: "walk",
      move_from_prev_min: 12,
      artists: [ARTIST_CL],
      spot_types: ["scene", "story", "photo"],
      soundtrack: {
        artist_id: "cl",
        track_id: "cl-hwa",
        curator_note: {
          ko: "낮은 처마와 골목의 결 위로 CL의 굵은 보컬이 얹히면 동네 전체가 무대가 됩니다.",
          en: "Lay CL's heavy vocals over these low eaves and quiet alleys — the whole block becomes a stage.",
        },
      },
      details: {
        gallery_image_urls: [
          "/mock/posts/seoul/kmusic/spot3-sogyeokdong-1.jpg",
          "/mock/posts/seoul/kmusic/spot3-sogyeokdong-2.png",
        ],
        why_here: {
          ko: "촬영지 ‘한 점’이 아니라 동네의 결로 봐야 진짜 보이는 자리. 낮은 전통 건축에 미술관·카페·골목이 붙어 있어 CL의 강한 리듬과 존재감이 오히려 더 또렷이 보입니다. 종친부를 보고 바로 떠나지 말고 5분 더 머무세요.",
          en: "Read the *neighborhood texture*, not just the building. Low traditional structures touching galleries, cafes, alleys — that contrast is exactly what makes CL's presence pop. Linger 5 extra minutes past the building itself.",
        },
        what_to_do: {
          ko: "① 종친부 정면이 아닌 측면 처마+골목이 들어오는 구도로 한 컷 ② 골목을 따라 50m 산책하며 분위기 체감 ③ MMCA 방향(동측 바로 옆)으로.",
          en: "① Shoot the side eaves with alley context, not the head-on facade ② Walk 50 m down the alley to feel the texture ③ Continue east to MMCA, just next door.",
        },
        photo_tip: {
          ko: "건물 정면 대칭 컷보다 처마+골목의 깊이 있는 측면 구도. 흐린 날이 색감이 깔끔.",
          en: "Side angle with alley depth beats a symmetric facade shot. Overcast days give cleaner color.",
        },
        caution: {
          ko: "주변 카페·갤러리는 화요일 휴무가 많음. 영업 시간은 당일 확인.",
          en: "Many nearby cafes/galleries close Tuesdays. Confirm hours day-of.",
        },
      },
    },
    // ── 4. 국립현대미술관 서울관 (MMCA) — CL 〈화〉 이어짐 ─────────────────────
    {
      id: "spot-04",
      order: 4,
      catalog: {
        name: {
          ko: "국립현대미술관 서울관",
          en: "MMCA Seoul",
        },
        category: "museum",
        category_emoji: "🖼",
        image_url: "/mock/posts/seoul/kmusic/spot4-mmca-1.jpg",
        address: "서울 종로구 삼청로 30",
        lat: 37.5786,
        lng: 126.9803,
      },
      stay_min: 30,
      guardian_note: {
        ko: "CL의 〈화〉 무대는 종친부에서 끝나지 않고 MMCA 서울관으로 이어졌습니다. 전통→현대 공간 전환 자체가 〈화〉의 콘셉트와 정확히 겹칩니다.",
        en: "CL's 'HWA' continued from Jongchin-bu into MMCA Seoul. The traditional-to-contemporary transition *is* the concept of 'HWA.'",
      },
      move_from_prev_method: "walk",
      move_from_prev_min: 3,
      artists: [ARTIST_CL],
      spot_types: ["rest", "photo", "transport"],
      soundtrack: {
        artist_id: "cl",
        track_id: "cl-lover-like-me",
        curator_note: {
          ko: "전통→현대로 시선이 옮겨가는 동선과 어울리는 가벼운 후반곡. 〈화〉의 강도를 식히며 닫기.",
          en: "A lighter closer that matches the traditional-to-contemporary pivot — cooling down from 'HWA's heat.",
        },
      },
      details: {
        gallery_image_urls: [
          "/mock/posts/seoul/kmusic/spot4-mmca-1.jpg",
          "/mock/posts/seoul/kmusic/spot4-mmca-2.webp",
          "/mock/posts/seoul/kmusic/spot4-mmca-3.jpg",
          "/mock/posts/seoul/kmusic/spot4-mmca-4.jpg",
          "/mock/posts/seoul/kmusic/spot4-mmca-5.jpg",
        ],
        why_here: {
          ko: "전시 입장보다 외부 동선이 더 중요한 스팟. 경복궁·종친부·북촌·삼청동을 잇는 허브로서의 위치가 핵심입니다. 미술관 매스와 종친부 처마를 한 프레임에 잡으면 두 시대가 같이 들어옵니다.",
          en: "The exterior matters more than the galleries here — MMCA is the hub linking palace, Jongchin-bu, Bukchon, and Samcheong-dong. Frame the museum mass and Jongchin-bu eaves together to catch two eras at once.",
        },
        what_to_do: {
          ko: "① 외부 광장 한 바퀴 ② 종친부+MMCA가 함께 들어오는 컷 ③ 삼청동·북촌으로 빠지지 말고 광화문 방향 남쪽으로 (덕수궁행).",
          en: "① Walk the exterior plaza ② Capture Jongchin-bu + MMCA in one frame ③ Don't drift north to Samcheong — head south to Gwanghwamun for Deoksugung.",
        },
        photo_tip: {
          ko: "광장 남측에서 미술관 외관 매스를 측면으로. 직사광보다 그늘진 입면이 디테일이 살아남.",
          en: "Side-mass shot from the south plaza. Shaded facade reveals more detail than direct sunlight.",
        },
        caution: {
          ko: "전시 관람은 별도 티켓. 외부 동선만 볼 거면 무료. 월요일 휴관.",
          en: "Gallery entry requires a ticket; exterior is free. Closed Mondays.",
        },
      },
    },
    // ── 5. 덕수궁 대한문 — 이날치 ‘Feel the Rhythm of Korea’ ─────────────────
    {
      id: "spot-05",
      order: 5,
      catalog: {
        name: {
          ko: "덕수궁 대한문",
          en: "Daehanmun, Deoksugung",
        },
        category: "palace",
        category_emoji: "🏯",
        image_url: "/mock/posts/seoul/kmusic/spot5-daehanmun-1.jpg",
        address: "서울 중구 세종대로 99",
        lat: 37.5658,
        lng: 126.975,
      },
      stay_min: 30,
      guardian_note: {
        ko: "이날치밴드와 앰비규어스 댄스컴퍼니의 ‘Feel the Rhythm of Korea’ 서울 편 주요 배경. 차도·빌딩·궁궐 담장이 한 화면에 들어오는 도심형 궁궐의 정수.",
        en: "Key backdrop of LEENALCHI × Ambiguous Dance Company's 'Feel the Rhythm of Korea: Seoul' — where road, towers, and palace wall collide in one frame.",
      },
      move_from_prev_method: "walk",
      move_from_prev_min: 25,
      featured: true,
      artists: [ARTIST_LEENALCHI, ARTIST_AMBIGUOUS],
      spot_types: ["scene", "photo"],
      soundtrack: {
        artist_id: "leenalchi",
        track_id: "leenalchi-tiger",
        curator_note: {
          ko: "도심·궁궐·판소리가 한 화면에서 부딪히는 자리. 마지막 스팟의 BGM은 무조건 〈범 내려온다〉.",
          en: "Downtown, palace, pansori collide in one frame. The last stop's BGM has to be 'Tiger is Coming.'",
        },
      },
      details: {
        gallery_image_urls: [
          "/mock/posts/seoul/kmusic/spot5-daehanmun-1.jpg",
          "/mock/posts/seoul/kmusic/spot5-daehanmun-2.jpg",
          "/mock/posts/seoul/kmusic/spot5-daehanmun-3.jpg",
          "/mock/posts/seoul/kmusic/spot5-daehanmun-4.jpg",
          "/mock/posts/seoul/kmusic/spot5-daehanmun-5.jpg",
          "/mock/posts/seoul/kmusic/spot5-daehanmun-3.gif",
        ],
        why_here: {
          ko: "K팝 아이돌 무대와는 결이 다른 ‘힙조선’의 입구. 전통 판소리, 독특한 춤, 궁궐 앞 도시 풍경이 섞이면서 ‘서울은 이렇게도 보일 수 있구나’라는 인상을 만듭니다. 경복궁이 웅장이라면 대한문은 도심과 훨씬 가깝습니다.",
          en: "The 'Hip Joseon' gateway — pansori, idiosyncratic dance, and downtown traffic in one frame. Where Gyeongbokgung is monumental, Daehanmun is *embedded in the city*.",
        },
        what_to_do: {
          ko: "① 대한문 정면 한 컷 ② 뒤를 돌아 시청·빌딩이 들어오는 대비 컷 ③ 정동길로 마무리 산책 (1km, 카페·역사관 분포). 코스 끝.",
          en: "① Frontal shot of the gate ② Turn 180° — capture City Hall and towers behind you ③ Walk Jeongdong-gil to close the day (1 km, cafes + history museums).",
        },
        photo_tip: {
          ko: "두 컷의 ‘대비’가 핵심. 한 장만 찍을 거면 측면 45도에서 담장+도심이 같이 들어오는 자리.",
          en: "The contrast between the two shots is the point. If only one frame: 45° side angle with both palace wall and downtown.",
        },
        caution: {
          ko: "왕궁수문장 교대식은 11:00·14:00·15:30. 시간대 잡으면 풍부, 놓치면 정문 인파만 — 일정은 당일 공지 우선.",
          en: "Royal Guard Changing: 11 AM · 2 PM · 3:30 PM. Catching it adds depth; missing it = just crowds. Confirm day-of.",
        },
      },
    },
    // ── 6. 케타포 인사 (Ktown4u 인사) — K-POP 굿즈·앨범·카페 결제 가능 스팟 ──────
    // 인사동 안녕인사동 3층 오프라인 스토어. 다양한 K-POP 앨범·문구류와
    // 시기에 따라 아티스트 테마 음료·디저트를 제공. 소격동·MMCA 동선에서 자연스러운 마무리.
    {
      id: "spot-06",
      order: 6,
      catalog: {
        name: {
          ko: "케타포 인사 (Ktown4u 인사)",
          en: "Ktown4u Insadong",
        },
        category: "shopping",
        category_emoji: "🛍",
        image_url: "/mock/posts/seoul/kmusic/spot5-daehanmun-1.jpg",
        address: "서울 종로구 인사동길 49 안녕인사동 3층",
        lat: 37.5742,
        lng: 126.9847,
      },
      stay_min: 30,
      guardian_note: {
        ko: "K-뮤직 영상의 장면을 따라 걷던 흐름에서, 실제 팬 경험으로 전환되는 스팟. K-POP 앨범과 문구류, 시기별 아티스트 테마 음료·디저트를 한 자리에서.",
        en: "Pivot from K-music scene-watching into hands-on fan experience — K-POP albums, stationery, and rotating artist-themed drinks and desserts under one roof.",
      },
      move_from_prev_method: "walk",
      move_from_prev_min: 18,
      artists: [ARTIST_BTS, ARTIST_CL, ARTIST_LEENALCHI],
      spot_types: ["buy", "rest", "end"],
      commerce: {
        is_commerce_spot: true,
        commerce_types: ["album", "goods", "photo_card", "fan_cafe", "drink"],
        payment_mode: "onsite",
        price_range_label: "₩5,000 ~ ₩50,000",
        purchasable_items: [
          { name: "K-POP 정규/미니 앨범", item_type: "album", is_official: true, note: "주요 아티스트 라인업 상시 진열" },
          { name: "아티스트 문구류·MD", item_type: "goods", is_official: true },
          { name: "포토카드 (시즌·앨범별)", item_type: "photo_card", is_official: true, note: "특전·재고는 방문 시점에 따라 변동" },
          { name: "아티스트 테마 음료", item_type: "drink", is_official: true, is_limited: true, note: "시기별 한정 메뉴" },
          { name: "테마 디저트", item_type: "drink", is_official: true, is_limited: true },
        ],
        reservation_required: false,
        partner_enabled: false,
        disclaimer: "취급 아티스트, 상품 구성, 특전, 음료 운영 여부는 방문 시점에 따라 달라질 수 있습니다. 방문 전 공식 채널 확인을 권장합니다.",
      },
      details: {
        gallery_image_urls: ["/mock/posts/seoul/kmusic/spot5-daehanmun-1.jpg"],
        why_here: {
          ko: "이 구간은 K-뮤직 영상의 장면을 따라 걷던 흐름에서, 실제 팬 경험으로 전환되는 스팟입니다. K-POP 앨범과 문구류를 확인할 수 있고, 시기에 따라 아티스트 테마 음료나 디저트도 만날 수 있습니다. 촬영지 감상 후 팬 굿즈를 둘러보고 잠시 쉬어가기 좋은 중간 지점입니다.",
          en: "Where K-music scene-watching becomes fan experience. Browse K-POP albums and stationery, and depending on the season catch artist-themed drinks or desserts — a natural pause between filming-location reflection and the last leg of the day.",
        },
        what_to_do: {
          ko: "① 관심 아티스트 앨범·포토카드 코너 확인 ② 문구류·MD 한 바퀴 ③ 시즌 음료 한 잔 곁들여 잠시 휴식 ④ 안국역 6번 출구 또는 인사동길로 마무리.",
          en: "① Browse the album & photo-card corner ② Walk the stationery / MD aisles ③ Pause with a seasonal drink ④ Exit toward Anguk Sta. Exit 6 or down Insadong-gil.",
        },
        photo_tip: {
          ko: "매장 내부 촬영은 직원·안내 표지 확인 후. 굿즈 자체 컷은 구매 후 외부에서 남기는 편이 매너입니다.",
          en: "Check signage / staff before shooting inside. Goods-only photos read best outside the store.",
        },
        caution: {
          ko: "취급 아티스트, 상품 구성, 특전, 음료 운영 여부는 방문 시점에 따라 달라질 수 있습니다. 방문 전 공식 채널 확인을 권장합니다. 운영시간 12:00~20:00, 안국역 6번 출구에서 인사동길 방향 약 120m.",
          en: "Lineup, items, perks, and beverage rotation change over time — check the official channels before visiting. Hours 12:00–20:00. ~120 m from Anguk Sta. Exit 6 toward Insadong-gil.",
        },
      },
    },
  ],
};
