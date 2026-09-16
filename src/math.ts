import type { GrayImage } from "./imageScenes";

export function convolve(img: GrayImage, kernel: number[][]): GrayImage {
  const kh = kernel.length, kw = kernel[0].length;
  const cy = Math.floor(kh/2), cx = Math.floor(kw/2);
  const out = { width: img.width, height: img.height, data: new Float32Array(img.data.length) };
  for (let y=0;y<img.height;y++) for (let x=0;x<img.width;x++) {
    let s=0;
    for (let j=0;j<kh;j++) for (let i=0;i<kw;i++) {
      const yy=Math.max(0,Math.min(img.height-1,y+j-cy));
      const xx=Math.max(0,Math.min(img.width-1,x+i-cx));
      s += img.data[yy*img.width+xx]*kernel[j][i];
    }
    out.data[y*img.width+x]=s;
  }
  return out;
}

export function normalizeForDisplay(img: GrayImage): GrayImage {
  let min=Infinity,max=-Infinity;
  for (const v of img.data){min=Math.min(min,v);max=Math.max(max,v);}
  const range=max-min || 1;
  return {width:img.width,height:img.height,data:Float32Array.from(img.data,v=>(v-min)*255/range)};
}

export function statsImage(img: GrayImage) {
  let min=Infinity,max=-Infinity,sum=0;
  for(const v of img.data){min=Math.min(min,v);max=Math.max(max,v);sum+=v;}
  return {min,max,mean:sum/img.data.length};
}

export function patchCalculation(img: GrayImage, kernel: number[][], x=128, y=128) {
  const kh=kernel.length,kw=kernel[0].length,cy=Math.floor(kh/2),cx=Math.floor(kw/2);
  const terms:string[]=[]; let total=0;
  for(let j=0;j<kh;j++)for(let i=0;i<kw;i++){
    const yy=Math.max(0,Math.min(img.height-1,y+j-cy));
    const xx=Math.max(0,Math.min(img.width-1,x+i-cx));
    const p=img.data[yy*img.width+xx], w=kernel[j][i], t=p*w; total+=t;
    terms.push(`${p.toFixed(1)} × ${w.toFixed(3)} = ${t.toFixed(2)}`);
  }
  return {x,y,total,terms};
}
