import { WallSegment } from '../store/useAppStore';

/**
 * 画像からエッジ検出を行い、壁面の直線（水平・垂直）を検出する
 */

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  angle: number;
  length: number;
}

/**
 * 配列の最大値を安全に取得（スタックオーバーフロー防止）
 */
function safeMax(arr: number[]): number {
  let max = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] > max) max = arr[i];
  }
  return max;
}

/**
 * 配列の最小値を安全に取得
 */
function safeMin(arr: number[]): number {
  let min = Infinity;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] < min) min = arr[i];
  }
  return min;
}

/**
 * グレースケール変換
 */
function toGrayscale(imageData: ImageData): Float32Array {
  const len = imageData.width * imageData.height;
  const gray = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const j = i * 4;
    gray[i] = 0.299 * imageData.data[j] + 0.587 * imageData.data[j + 1] + 0.114 * imageData.data[j + 2];
  }
  return gray;
}

/**
 * Box blur (3パス)
 */
function blur(gray: Float32Array, width: number, height: number): Float32Array {
  let result = new Float32Array(gray);
  for (let pass = 0; pass < 2; pass++) {
    const temp = new Float32Array(result.length);
    const r = 2;
    for (let y = r; y < height - r; y++) {
      for (let x = r; x < width - r; x++) {
        let sum = 0;
        let count = 0;
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            sum += result[(y + dy) * width + (x + dx)];
            count++;
          }
        }
        temp[y * width + x] = sum / count;
      }
    }
    result = temp;
  }
  return result;
}

/**
 * Sobelフィルタ
 */
function sobelMagnitude(gray: Float32Array, width: number, height: number): Float32Array {
  const mag = new Float32Array(gray.length);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const gx =
        -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)] +
        -2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)] +
        -gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)];
      const gy =
        -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)] +
        gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)];
      mag[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return mag;
}

/**
 * ハフ変換 - 水平線と垂直線のみ検出
 */
function detectMainLines(magnitude: Float32Array, width: number, height: number): Line[] {
  // 安全に最大値を取得
  const maxMag = safeMax(Array.from(magnitude));
  if (maxMag === 0) return [];
  const edgeThreshold = maxMag * 0.25;

  const maxRho = Math.ceil(Math.sqrt(width * width + height * height));
  const numTheta = 180;
  const accSize = maxRho * 2 * numTheta;
  const accumulator = new Int32Array(accSize);

  // 蓄積（水平・垂直のみ）
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (magnitude[y * width + x] < edgeThreshold) continue;

      // 垂直線 (0-5度)
      for (let t = 0; t < 5; t++) {
        const theta = (t * Math.PI) / numTheta;
        const rho = Math.round(x * Math.cos(theta) + y * Math.sin(theta)) + maxRho;
        if (rho >= 0 && rho < maxRho * 2) {
          accumulator[rho * numTheta + t]++;
        }
      }
      // 垂直線 (175-180度)
      for (let t = 175; t < 180; t++) {
        const theta = (t * Math.PI) / numTheta;
        const rho = Math.round(x * Math.cos(theta) + y * Math.sin(theta)) + maxRho;
        if (rho >= 0 && rho < maxRho * 2) {
          accumulator[rho * numTheta + t]++;
        }
      }
      // 水平線 (85-95度)
      for (let t = 85; t < 95; t++) {
        const theta = (t * Math.PI) / numTheta;
        const rho = Math.round(x * Math.cos(theta) + y * Math.sin(theta)) + maxRho;
        if (rho >= 0 && rho < maxRho * 2) {
          accumulator[rho * numTheta + t]++;
        }
      }
    }
  }

  // ピーク検出
  const voteThreshold = Math.max(width, height) * 0.25;
  const peaks: { rho: number; theta: number; votes: number }[] = [];

  for (let r = 0; r < maxRho * 2; r++) {
    for (let t = 0; t < numTheta; t++) {
      const votes = accumulator[r * numTheta + t];
      if (votes > voteThreshold) {
        peaks.push({ rho: r - maxRho, theta: t, votes });
      }
    }
  }

  // 上位取得
  peaks.sort((a, b) => b.votes - a.votes);
  const topPeaks = peaks.slice(0, 12);

  // 近いピークを統合
  const merged: typeof topPeaks = [];
  const used = new Set<number>();
  for (let i = 0; i < topPeaks.length; i++) {
    if (used.has(i)) continue;
    let best = topPeaks[i];
    for (let j = i + 1; j < topPeaks.length; j++) {
      if (used.has(j)) continue;
      if (Math.abs(topPeaks[i].rho - topPeaks[j].rho) < 15 &&
          Math.abs(topPeaks[i].theta - topPeaks[j].theta) < 5) {
        used.add(j);
        if (topPeaks[j].votes > best.votes) best = topPeaks[j];
      }
    }
    merged.push(best);
  }

  // ラインに変換
  const lines: Line[] = [];
  for (const peak of merged.slice(0, 6)) {
    const theta = (peak.theta * Math.PI) / numTheta;
    const rho = peak.rho;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    let x1: number, y1: number, x2: number, y2: number;

    if (Math.abs(sinT) > 0.5) {
      x1 = 0; x2 = width;
      y1 = Math.round((rho - x1 * cosT) / sinT);
      y2 = Math.round((rho - x2 * cosT) / sinT);
    } else {
      y1 = 0; y2 = height;
      x1 = Math.round((rho - y1 * sinT) / cosT);
      x2 = Math.round((rho - y2 * sinT) / cosT);
    }

    x1 = Math.max(0, Math.min(width, x1));
    x2 = Math.max(0, Math.min(width, x2));
    y1 = Math.max(0, Math.min(height, y1));
    y2 = Math.max(0, Math.min(height, y2));

    const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = (peak.theta * 180) / numTheta;

    if (len > Math.min(width, height) * 0.25) {
      lines.push({ x1, y1, x2, y2, angle, length: len });
    }
  }

  return lines;
}

/**
 * 部屋の矩形構造に整理
 */
function organizeAsRoom(lines: Line[], imgWidth: number, imgHeight: number): Line[] {
  const horizontals = lines.filter(l => l.angle > 80 && l.angle < 100);
  const verticals = lines.filter(l => l.angle < 10 || l.angle > 170);

  const topH = horizontals.slice(0, 2);
  const topV = verticals.slice(0, 2);

  if (topH.length < 2) {
    if (topH.length === 0) topH.push({ x1: 0, y1: imgHeight * 0.15, x2: imgWidth, y2: imgHeight * 0.15, angle: 90, length: imgWidth });
    topH.push({ x1: 0, y1: imgHeight * 0.85, x2: imgWidth, y2: imgHeight * 0.85, angle: 90, length: imgWidth });
  }
  if (topV.length < 2) {
    if (topV.length === 0) topV.push({ x1: imgWidth * 0.15, y1: 0, x2: imgWidth * 0.15, y2: imgHeight, angle: 0, length: imgHeight });
    topV.push({ x1: imgWidth * 0.85, y1: 0, x2: imgWidth * 0.85, y2: imgHeight, angle: 0, length: imgHeight });
  }

  return [...topH.slice(0, 2), ...topV.slice(0, 2)];
}

/**
 * メイン: 画像から壁面セグメントを検出
 */
export async function detectWalls(imageDataUrl: string): Promise<WallSegment[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // 小さくリサイズ（スマホでも軽く処理）
        const maxSize = 200;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        const gray = toGrayscale(imageData);
        const blurred = blur(gray, w, h);
        const magnitude = sobelMagnitude(blurred, w, h);
        const rawLines = detectMainLines(magnitude, w, h);
        const roomLines = organizeAsRoom(rawLines, w, h);

        const scaleBack = 1 / scale;
        const walls: WallSegment[] = roomLines.map((line, i) => ({
          id: `wall-${Date.now()}-${i}`,
          start: { x: line.x1 * scaleBack, y: line.y1 * scaleBack },
          end: { x: line.x2 * scaleBack, y: line.y2 * scaleBack },
          thickness: 12,
          height: 250,
          sourceImage: imageDataUrl,
        }));

        resolve(walls);
      } catch (err) {
        console.error('Wall detection error:', err);
        // エラー時もフォールバックの矩形を返す
        resolve([
          { id: `wall-fallback-0`, start: { x: 50, y: 50 }, end: { x: 350, y: 50 }, thickness: 12, height: 250 },
          { id: `wall-fallback-1`, start: { x: 50, y: 250 }, end: { x: 350, y: 250 }, thickness: 12, height: 250 },
          { id: `wall-fallback-2`, start: { x: 50, y: 50 }, end: { x: 50, y: 250 }, thickness: 12, height: 250 },
          { id: `wall-fallback-3`, start: { x: 350, y: 50 }, end: { x: 350, y: 250 }, thickness: 12, height: 250 },
        ]);
      }
    };
    img.onerror = () => {
      reject(new Error('画像の読み込みに失敗しました'));
    };
    img.src = imageDataUrl;
  });
}

/**
 * 複数画像の検出結果を統合して平面図を生成
 */
export function generateFloorPlan(allWalls: WallSegment[]): {
  walls: WallSegment[];
  width: number;
  height: number;
} {
  if (allWalls.length === 0) {
    return { walls: [], width: 800, height: 600 };
  }

  // 壁を水平・垂直にスナップ
  const snappedWalls = allWalls.map((w) => {
    const dx = Math.abs(w.end.x - w.start.x);
    const dy = Math.abs(w.end.y - w.start.y);

    if (dx > dy * 2) {
      const avgY = (w.start.y + w.end.y) / 2;
      return { ...w, start: { ...w.start, y: avgY }, end: { ...w.end, y: avgY } };
    }
    if (dy > dx * 2) {
      const avgX = (w.start.x + w.end.x) / 2;
      return { ...w, start: { ...w.start, x: avgX }, end: { ...w.end, x: avgX } };
    }
    return w;
  });

  // 正規化
  const allPoints = snappedWalls.flatMap((w) => [w.start, w.end]);
  const xs = allPoints.map((p) => p.x);
  const ys = allPoints.map((p) => p.y);
  const minX = safeMin(xs);
  const minY = safeMin(ys);
  const maxX = safeMax(xs);
  const maxY = safeMax(ys);

  const padding = 80;
  const contentW = maxX - minX || 1;
  const contentH = maxY - minY || 1;

  const fitScale = Math.min(640 / contentW, 440 / contentH, 1);

  const normalizedWalls = snappedWalls.map((w) => ({
    ...w,
    start: {
      x: (w.start.x - minX) * fitScale + padding,
      y: (w.start.y - minY) * fitScale + padding,
    },
    end: {
      x: (w.end.x - minX) * fitScale + padding,
      y: (w.end.y - minY) * fitScale + padding,
    },
  }));

  return {
    walls: normalizedWalls,
    width: 800,
    height: 600,
  };
}
