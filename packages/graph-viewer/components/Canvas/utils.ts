import type { SkMatrix, Vector } from "@shopify/react-native-skia";
import { Skia, vec } from "@shopify/react-native-skia";

const MatrixIndex = {
  ScaleX: 0,
  SkewX: 1,
  TransX: 2,
  SkewY: 3,
  ScaleY: 4,
  TransY: 5,
  Persp0: 6,
  Persp1: 7,
  Persp2: 8,
};

export const rotateZ = (matrix: SkMatrix, theta: number, origin: Vector) => {
  "worklet";
  return Skia.Matrix()
    .translate(origin.x, origin.y)
    .rotate(theta)
    .translate(-origin.x, -origin.y)
    .concat(matrix);
};

export const translate = (matrix: SkMatrix, x: number, y: number) => {
  "worklet";
  return Skia.Matrix().translate(x, y).concat(matrix);
};
function bbox(shapes: { x: number; y: number; radius: number }[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < shapes.length; i++) {
    const { x = 0, y = 0, radius: r = 0 } = shapes[i];
    if (x - r < minX) minX = x - r;
    if (x + r > maxX) maxX = x + r;
    if (y - r < minY) minY = y - r;
    if (y + r > maxY) maxY = y + r;
  }

  return { minX, minY, maxX, maxY };
}

export function getTransformFromShapes(
  shapes: { x: number; y: number; radius: number }[],
  width: number,
  height: number
) {
  const { minX, minY, maxX, maxY } = bbox(shapes);
  const w = Math.abs(maxX - minX) || 0;
  const h = Math.abs(maxY - minY) || 0;
  const cx = (minX + maxX) / 2 || 0;
  const cy = (minY + maxY) / 2 || 0;
  const scale = Math.min(width / w, height / h);
  return (
    Skia.Matrix()
      // to origin
      .translate(-scale * cx, -scale * cy)
      // scale
      .scale(scale, scale)
      // center
      .translate(width / 2 / scale, height / 2 / scale)
  );
}

export function applyTransform(matrix: SkMatrix, input: Vector) {
  "worklet";
  const m = matrix.get();
  const x = input.x * m[MatrixIndex.ScaleX] + m[MatrixIndex.TransX];
  const y = input.y * m[MatrixIndex.ScaleY] + m[MatrixIndex.TransY];
  return vec(x, y);
}

export function invertTransform(matrix: SkMatrix, input: Vector) {
  "worklet";
  const m = matrix.get();
  const x =
    (input.x - m[MatrixIndex.TransX]) / m[MatrixIndex.ScaleX] || input.x;
  const y =
    (input.y - m[MatrixIndex.TransY]) / m[MatrixIndex.ScaleY] || input.y;
  return vec(x, y);
}

export function zoomAroundPoint(
  matrix: SkMatrix,
  scale: number,
  origin: Vector
) {
  "worklet";
  return Skia.Matrix(matrix.get())
    .translate(origin.x, origin.y)
    .scale(scale, scale)
    .translate(-origin.x, -origin.y);
}
