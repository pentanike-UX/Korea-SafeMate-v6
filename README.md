# Korea SafeMate v3

v2 코드베이스를 기반으로 한 **초기 안정 베이스**입니다. 구조를 갈아엎지 않고, 공개 홈·공통 UI 토큰·테마·헤더를 v3 방향(모바일 우선, 라이트/다크, 중립 톤 + 블루 포인트)으로 정리합니다.

## 요구 사항

- **Node.js 20.x** (`package.json`의 `engines` 참고)

## 설치

```bash
npm install
```

## 로컬 실행

```bash
npm run dev
```

브라우저에서 **http://localhost:3000** 을 엽니다.

- 기본 로케일은 **영어(en)** 이며 URL 접두사가 없을 수 있습니다.
- 한국어: **http://localhost:3000/ko** , 일본어: **http://localhost:3000/ja**

## 빌드 검증

```bash
npm run build
npm start
```

## 확인 포인트 (이번 1차 범위)

- 홈: 히어로, 빠른 시작(지역·무드), 추천 가디언, 포스트, 신뢰, 리뷰, 준비 중 지역, 하단 CTA
- 헤더: 밝은 배경에서도 대비, **라이트/다크 토글**(데스크톱 상단 · 모바일은 메뉴 시트 내)
- 선택이 없을 때 가디언 CTA는 **비활성 + 안내 문구**로 표시

## 환경 변수 (선택)

Supabase·지도·가디언 포스트 API·**네이버 검색(하루웨이 스팟 보강)**·**Google Places(스팟 place_id 갤러리)** 등은 해당 기능을 켤 때만 필요합니다. 이름·용도는 루트 **`env.example`** 을 본다(시크릿은 커밋하지 않음). 네이버·Google **Places용 키는 서버 전용**(`NAVER_SEARCH_*`, `GOOGLE_MAPS_API_KEY`). 지도 JS용 `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`는 Places 호출에 사용하지 않는다. [DATA_MODEL_API.md](./DATA_MODEL_API.md) §5.3·§10, [HARNESS.md](./HARNESS.md) §4.

## 라이선스 / 원본

프로젝트 메타의 원본 저장소 정보는 `package.json`의 `repository` 필드를 참고하세요.
