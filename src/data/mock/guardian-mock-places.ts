/** Mock POIs for guardian route editor search — replace with Places API later. */
export type MockPlaceHit = {
  id: string;
  /** English label (for i18n / debugging). */
  label: string;
  /** Primary display name for KO UI. */
  label_ko: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
};

export const mockSeoulSearchPlaces: MockPlaceHit[] = [
  {
    id: "pl-1",
    label: "Gwanghwamun Square",
    label_ko: "광화문 광장",
    district: "종로구",
    address: "서울 종로구 세종대로 172",
    lat: 37.5759,
    lng: 126.9768,
  },
  {
    id: "pl-2",
    label: "Bukchon Hanok Village",
    label_ko: "북촌 한옥마을",
    district: "종로구",
    address: "서울 종로구 계동길 37",
    lat: 37.5826,
    lng: 126.985,
  },
  {
    id: "pl-3",
    label: "Insadong main strip",
    label_ko: "인사동 거리",
    district: "종로구",
    address: "서울 종로구 인사동길 일대",
    lat: 37.5738,
    lng: 126.9864,
  },
  {
    id: "pl-4",
    label: "Cheonggyecheon Plaza",
    label_ko: "청계천 광통교",
    district: "종로구",
    address: "서울 종로구 세종대로 지하",
    lat: 37.5692,
    lng: 126.9788,
  },
  {
    id: "pl-5",
    label: "Seongsu cafe row",
    label_ko: "성수 카페거리",
    district: "성동구",
    address: "서울 성동구 성수이로7길 일대",
    lat: 37.5447,
    lng: 127.0555,
  },
  {
    id: "pl-6",
    label: "Seoul Forest",
    label_ko: "서울숲",
    district: "성동구",
    address: "서울 성동구 뚝섬로 273",
    lat: 37.5443,
    lng: 127.0378,
  },
  {
    id: "pl-7",
    label: "Yeouido Hangang Park",
    label_ko: "여의도 한강공원",
    district: "영등포구",
    address: "서울 영등포구 여의동로 330",
    lat: 37.5283,
    lng: 126.9326,
  },
  {
    id: "pl-8",
    label: "Myeongdong Station exit cluster",
    label_ko: "명동역 인근",
    district: "중구",
    address: "서울 중구 퇴계로 124",
    lat: 37.5636,
    lng: 126.9826,
  },
  {
    id: "pl-9",
    label: "Starfield COEX Mall",
    label_ko: "스타필드 코엑스몰",
    district: "강남구",
    address: "서울 강남구 영동대로 513",
    lat: 37.5126,
    lng: 127.0594,
  },
  {
    id: "pl-10",
    label: "Garosu-gil",
    label_ko: "가로수길",
    district: "강남구",
    address: "서울 강남구 도산대로11길",
    lat: 37.5209,
    lng: 127.0231,
  },
];
