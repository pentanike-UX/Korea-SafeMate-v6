/**
 * 폴리라인 단순화 — Douglas–Peucker 알고리즘 (재귀 비스택, 평면 좌표 근사).
 * 도보 라우트(서울 시내 기준)에서 ~5m 정도의 변위(약 4.5e-5 deg)를 임계로 두면
 * 시각적 손실 없이 점 개수를 절반 이하로 줄일 수 있다.
 *
 * DB 저장 시 row 크기 가드용. 라이브 렌더링은 원본 path를 사용한다.
 */

export interface PathPoint {
  lat: number;
  lng: number;
}

/** 점 p에서 직선 ab까지의 평면 수직거리 제곱(degree 단위). */
function perpDistanceSq(p: PathPoint, a: PathPoint, b: PathPoint): number {
  const dx = b.lng - a.lng;
  const dy = b.lat - a.lat;
  if (dx === 0 && dy === 0) {
    const ex = p.lng - a.lng;
    const ey = p.lat - a.lat;
    return ex * ex + ey * ey;
  }
  // 직선 (a→b)의 t = (p-a)·(b-a) / |b-a|²
  const t = ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / (dx * dx + dy * dy);
  const projX = a.lng + t * dx;
  const projY = a.lat + t * dy;
  const ex = p.lng - projX;
  const ey = p.lat - projY;
  return ex * ex + ey * ey;
}

/**
 * @param tolerance 직선과의 허용 변위 (degree). 기본 4.5e-5 ≈ 5m at 서울 위도.
 * @param maxOutPoints 결과 점 개수 상한. 초과하면 tolerance를 두 배씩 늘려 재시도.
 */
export function simplifyPath(
  points: PathPoint[],
  tolerance = 4.5e-5,
  maxOutPoints = 500,
): PathPoint[] {
  if (points.length <= 2) return points.slice();

  let toleranceSq = tolerance * tolerance;
  // 최대 6회까지 tolerance를 두 배씩 늘려 maxOutPoints 안에 들이도록.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const out = dpReduce(points, toleranceSq);
    if (out.length <= maxOutPoints) return out;
    toleranceSq *= 4; // tolerance 두 배 → 제곱이므로 *4
  }
  // 그래도 초과하면 일정 간격으로 데시메이션.
  const step = Math.ceil(points.length / maxOutPoints);
  const out: PathPoint[] = [];
  for (let i = 0; i < points.length; i += step) out.push(points[i]);
  if (out[out.length - 1] !== points[points.length - 1]) out.push(points[points.length - 1]);
  return out;
}

function dpReduce(points: PathPoint[], toleranceSq: number): PathPoint[] {
  const n = points.length;
  if (n <= 2) return points.slice();
  const keep = new Uint8Array(n);
  keep[0] = 1;
  keep[n - 1] = 1;

  const stack: Array<[number, number]> = [[0, n - 1]];
  while (stack.length > 0) {
    const [lo, hi] = stack.pop()!;
    let maxDistSq = -1;
    let maxIdx = -1;
    for (let i = lo + 1; i < hi; i += 1) {
      const d = perpDistanceSq(points[i], points[lo], points[hi]);
      if (d > maxDistSq) {
        maxDistSq = d;
        maxIdx = i;
      }
    }
    if (maxDistSq > toleranceSq && maxIdx > 0) {
      keep[maxIdx] = 1;
      stack.push([lo, maxIdx]);
      stack.push([maxIdx, hi]);
    }
  }

  const out: PathPoint[] = [];
  for (let i = 0; i < n; i += 1) if (keep[i]) out.push(points[i]);
  return out;
}
