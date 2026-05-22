# /public/mock/artists — 하루루트 아티스트 프로필 이미지

내부 시연용 mock 디렉터리. 하루루트 6번 스팟 시트의 "관련 아티스트" 카드 아바타가 이 경로를 참조합니다.

`src/data/mock/haru-route.ts`의 `SpotArtist.avatar_url`이 다음 파일을 가리킵니다:

| 파일명 | 아티스트 | 사용처 |
|--------|---------|--------|
| `bts.png` | BTS | ARTIST_BTS — 스팟 1·2 (경복궁 근정전·경회루), 스팟 6 (Ktown4u 인사) |
| `cl.png` | CL (씨엘) | ARTIST_CL — 스팟 3·4 (종친부·MMCA), 스팟 6 |
| `leenalchi.png` | 이날치 (LEENALCHI) | ARTIST_LEENALCHI — 스팟 5 (덕수궁 대한문), 스팟 6 |
| `ambiguous.png` | 앰비규어스 댄스컴퍼니 | ARTIST_AMBIGUOUS — 스팟 5 |

파일이 없을 경우 컴포넌트는 자동으로 이니셜 색상 fallback으로 렌더링됩니다 (`ArtistAvatar` 컴포넌트).

권장 사양:
- 정사각형(1:1), 256×256 이상
- 배경이 단색이면 시각적으로 깔끔
- `.png` 또는 `.webp` 권장 (Next/Image 최적화)

## 파일 교체 방법

1. 4개 이미지를 위 표의 파일명대로 본 디렉터리에 저장
2. `git add public/mock/artists && git commit -m "assets: 하루루트 아티스트 프로필 이미지" && git push`
