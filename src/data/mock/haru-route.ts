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
import type { HaruRoute } from "@/types/haru";

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
  total_duration_min: 180, // 3시간
  estimated_cost_min_krw: 0,
  estimated_cost_max_krw: 15000, // 경복궁·덕수궁 입장료 별도
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
  ],
};
