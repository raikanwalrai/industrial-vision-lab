export type GrayImage = { width: number; height: number; data: Float32Array };

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
  if (name === "step") {
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

export const scenes = [
  { id: "shapes", label: "Synthetic scene", note: "ideal edges, corners, shapes" },
  { id: "step", label: "Step edge", note: "single ideal intensity transition" },
  { id: "ramp", label: "Ramp", note: "smooth intensity change" },
  { id: "checker", label: "Checkerboard", note: "high-frequency structure" },
  { id: "corner", label: "Corner", note: "two perpendicular edges" },
  { id: "noisy", label: "Noisy shapes", note: "tests smoothing and median filtering" },
];
