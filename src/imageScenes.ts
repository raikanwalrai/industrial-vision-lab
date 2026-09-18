export type GrayImage = {
  width: number;
  height: number;
  data: Float32Array;
};

export type Scene = {
  id: string;
  label: string;
  note: string;
  category: string;
  learningObjective: string;
  whyUse: string;
  experiment: string;
  recommendedFilters: string[];
};

export const SIZE = 256;

const blank = (w = SIZE, h = SIZE) => ({ width: w, height: h, data: new Float32Array(w * h) });

function set(img: GrayImage, x: number, y: number, v: number) {
  if (x >= 0 && x < img.width && y >= 0 && y < img.height) img.data[y * img.width + x] = Math.max(0, Math.min(255, v));
}

function rect(img: GrayImage, x0: number, y0: number, x1: number, y1: number, v: number) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) set(img, x, y, v);
}

export function makeScene(name: string): GrayImage {
  const img = blank();

  if (name === "constant") {
    img.data.fill(128);
  } else if (name === "step") {
    for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) set(img, x, y, x < 128 ? 35 : 220);
  } else if (name === "ramp") {
    for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) set(img, x, y, x);
  } else if (name === "checker") {
    const s = 24;
    for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) set(img, x, y, ((Math.floor(x / s) + Math.floor(y / s)) % 2) ? 230 : 25);
  } else if (name === "corner") {
    rect(img, 45, 45, 210, 210, 25); rect(img, 45, 45, 135, 135, 225);
  } else if (name === "noisy") {
    const base = makeScene("shapes");
    for (let i = 0; i < base.data.length; i++) {
      const n = (Math.random() - 0.5) * 70;
      img.data[i] = Math.max(0, Math.min(255, base.data[i] + n));
    }
  } else {
    // shapes / synthetic scene
    img.data.fill(170);
    // roof
    for (let y = 65; y < 135; y++) {
      const half = Math.floor((y - 65) * 0.9);
      const cx = 80;
      for (let x = cx - half; x <= cx + half; x++) set(img, x, y, 105);
    }
    rect(img, 45, 130, 145, 220, 55);
    rect(img, 80, 165, 110, 220, 235);
    // star-ish polygon
    const cx = 175, cy = 82;
    for (let y = cy - 35; y <= cy + 35; y++) for (let x = cx - 45; x <= cx + 45; x++) {
      const dx = x - cx, dy = y - cy;
      const a = Math.atan2(dy, dx), r = Math.hypot(dx, dy);
      const boundary = 28 + 13 * Math.cos(5 * a);
      if (r < boundary) set(img, x, y, 45);
    }
    // circles
    const circles = [[195,170,16],[150,190,8],[185,210,28]] as const;
    for (const [cx2, cy2, r] of circles) for (let y = cy2-r; y <= cy2+r; y++) for (let x = cx2-r; x <= cx2+r; x++)
      if ((x-cx2)**2 + (y-cy2)**2 <= r*r) set(img,x,y,25);
    // checkerboard
    for (let y = 20; y < 85; y += 13) for (let x = 145; x < 225; x += 13)
      rect(img,x,y,x+13,y+13,(((x-145)/13+(y-20)/13)%2===0)?245:10);
    // label-like dark bar
    rect(img, 10, 235, 246, 248, 25);
  }
  return img;
}

export const scenes: Scene[] = [
  {
    id: "shapes",
    label: "Synthetic scene",
    note: "ideal edges, corners, shapes",
    category: "General playground",
    learningObjective: "Explore how different filters respond to different image structures.",
    whyUse: "This scene contains edges, corners, shapes, circles, and high-frequency structure.",
    experiment: "Try several filter families and observe which structures each filter responds to.",
    recommendedFilters: [
      "Identity",
      "Box 3×3",
      "Gaussian σ≈1",
      "Sobel X",
      "Sobel Y",
      "Laplacian 4-neighbour",
      "Sharpen",
    ],
  },
  {
    id: "constant",
    label: "Constant image",
    note: "uniform intensity everywhere",
    category: "Mathematical foundation",
    learningObjective: "Understand constant images, kernel sums, and DC preservation or removal.",
    whyUse: "Every pixel has the same value, so we can clearly see what a kernel does to uniform intensity.",
    experiment: "Compare a smoothing filter with a derivative filter. What happens to a constant image?",
    recommendedFilters: [
      "Identity",
      "Box 3×3",
      "Gaussian σ≈1",
      "Sobel X",
      "Sobel Y",
      "Laplacian 4-neighbour",
    ],
  },
  {
    id: "step",
    label: "Step edge",
    note: "single ideal intensity transition",
    category: "Edges",
    learningObjective: "Understand how derivative filters respond to sudden intensity changes.",
    whyUse: "A step edge contains a sharp transition from dark to bright.",
    experiment: "Compare Sobel X and Sobel Y. Which direction responds to the edge?",
    recommendedFilters: [
      "Sobel X",
      "Sobel Y",
      "Prewitt X",
      "Prewitt Y",
      "Second derivative X",
      "Laplacian 4-neighbour",
    ],
  },
  {
    id: "ramp",
    label: "Ramp",
    note: "smooth intensity change",
    category: "Derivatives",
    learningObjective: "Understand the difference between first and second derivatives.",
    whyUse: "A ramp changes gradually, making it useful for studying slope and change of slope.",
    experiment: "Compare a first derivative with a second derivative on the same ramp.",
    recommendedFilters: [
      "Sobel X",
      "Prewitt X",
      "Second derivative X",
      "Laplacian 4-neighbour",
    ],
  },
  {
    id: "checker",
    label: "Checkerboard",
    note: "high-frequency structure",
    category: "High-frequency structure",
    learningObjective: "Understand how smoothing and derivative filters respond to rapid local changes.",
    whyUse: "The checkerboard contains repeated high-frequency intensity transitions.",
    experiment: "Compare Box 3×3 and Box 9×9. How does neighbourhood size affect detail?",
    recommendedFilters: [
      "Box 3×3",
      "Box 9×9",
      "Gaussian σ≈1",
      "Sobel X",
      "Sobel Y",
      "Sharpen",
    ],
  },
  {
    id: "corner",
    label: "Corner",
    note: "two perpendicular edges",
    category: "Corners and structure",
    learningObjective: "Understand how directional filters respond to different orientations.",
    whyUse: "A corner contains intensity changes in more than one direction.",
    experiment: "Compare Sobel X, Sobel Y, and the Laplacian around the corner.",
    recommendedFilters: [
      "Sobel X",
      "Sobel Y",
      "Laplacian 4-neighbour",
      "Sharpen",
    ],
  },
  {
    id: "noisy",
    label: "Noisy shapes",
    note: "tests smoothing and later restoration methods",
    category: "Noise and restoration",
    learningObjective: "Understand why smoothing filters are useful when images contain unwanted variation.",
    whyUse: "Random intensity variation makes it easier to observe the effect of smoothing.",
    experiment: "Compare Box 3×3 and Gaussian. Which structures remain visible after smoothing?",
    recommendedFilters: [
      "Box 3×3",
      "Box 9×9",
      "Gaussian σ≈1",
    ],
  },
];

export function cloneImage(img: GrayImage): GrayImage {
  return {
    width: img.width,
    height: img.height,
    data: new Float32Array(img.data),
  };
}

function seededRandom(seed: number) {
  let state = (seed >>> 0) || 1;
  return () => {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussianRandom(random: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = random();
  while (v === 0) v = random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function addGaussianNoise(img: GrayImage, sigma = 18, seed = 42): GrayImage {
  const out = cloneImage(img);
  const random = seededRandom(seed);

  for (let i = 0; i < out.data.length; i++) {
    out.data[i] = Math.max(0, Math.min(255, img.data[i] + gaussianRandom(random) * sigma));
  }

  return out;
}

export function addSaltPepperNoise(
  img: GrayImage,
  probability = 0.08,
  saltProbability = 0.5,
  seed = 42,
): GrayImage {
  const out = cloneImage(img);
  const random = seededRandom(seed);

  for (let i = 0; i < out.data.length; i++) {
    if (random() < probability) {
      out.data[i] = random() < saltProbability ? 255 : 0;
    }
  }

  return out;
}
