export type Kernel = { name: string; values: number[][]; kind: string; description: string };

export const K = (name: string, values: number[][], kind: string, description: string): Kernel => ({name,values,kind,description});

export const filters: Kernel[] = [
  K("Identity", [[0,0,0],[0,1,0],[0,0,0]], "identity", "Copies the local center pixel."),
  K("Box 3×3", Array.from({length:3},()=>Array(3).fill(1/9)), "smoothing", "Uniform local average."),
  K("Box 9×9", Array.from({length:9},()=>Array(9).fill(1/81)), "smoothing", "Larger uniform average; stronger blur."),
  K("Gaussian σ≈1", [[1,2,1],[2,4,2],[1,2,1]].map(r=>r.map(v=>v/16)), "smoothing", "Weighted smoothing; center gets more weight."),
  K("Sobel X", [[-1,0,1],[-2,0,2],[-1,0,1]], "first derivative", "First derivative in x with perpendicular smoothing."),
  K("Sobel Y", [[-1,-2,-1],[0,0,0],[1,2,1]], "first derivative", "First derivative in y with perpendicular smoothing."),
  K("Prewitt X", [[-1,0,1],[-1,0,1],[-1,0,1]], "first derivative", "Simple first derivative in x."),
  K("Prewitt Y", [[-1,-1,-1],[0,0,0],[1,1,1]], "first derivative", "Simple first derivative in y."),
  K("Second derivative X", [[0,0,0],[1,-2,1],[0,0,0]], "second derivative", "Approximation to ∂²/∂x²."),
  K("Second derivative Y", [[0,1,0],[0,-2,0],[0,1,0]], "second derivative", "Approximation to ∂²/∂y²."),
  K("Laplacian 4-neighbour", [[0,1,0],[1,-4,1],[0,1,0]], "second derivative", "Sum of x and y second derivatives."),
  K("Laplacian 8-neighbour", [[1,1,1],[1,-8,1],[1,1,1]], "second derivative", "Eight-neighbour high-pass curvature response."),
  K("Sharpen", [[0,-1,0],[-1,5,-1],[0,-1,0]], "sharpening", "Enhances local detail while preserving the DC component."),
  K("LoG-like", [[0,0,-1,0,0],[0,-1,-2,-1,0],[-1,-2,16,-2,-1],[0,-1,-2,-1,0],[0,0,-1,0,0]], "second derivative", "Sampled Laplacian-of-Gaussian-like kernel."),
];

export function stats(k: number[][]) {
  const flat = k.flat();
  const sum = flat.reduce((a,b)=>a+b,0);
  const sumSq = flat.reduce((a,b)=>a+b*b,0);
  return { sum, sumSq, noiseGain: Math.sqrt(sumSq), min: Math.min(...flat), max: Math.max(...flat), size: `${k.length}×${k[0].length}` };
}
