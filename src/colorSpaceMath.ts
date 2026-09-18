export type RGBInput = { r:number; g:number; b:number };
export type HSV = { h:number; s:number; v:number };
export type HSL = { h:number; s:number; l:number };
const clamp255=(v:number)=>Math.max(0,Math.min(255,v));
export function rgbToGrayscale(rgb:RGBInput):number{
  return 0.2126*clamp255(rgb.r)+0.7152*clamp255(rgb.g)+0.0722*clamp255(rgb.b);
}
export function rgbToHsv(rgb:RGBInput):HSV{
  const r=clamp255(rgb.r)/255,g=clamp255(rgb.g)/255,b=clamp255(rgb.b)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min; let h=0;
  if(d!==0){
    if(max===r) h=60*(((g-b)/d)%6);
    else if(max===g) h=60*((b-r)/d+2);
    else h=60*((r-g)/d+4);
  }
  if(h<0)h+=360;
  return {h,s:(max===0?0:d/max)*100,v:max*100};
}
export function rgbToHsl(rgb:RGBInput):HSL{
  const r=clamp255(rgb.r)/255,g=clamp255(rgb.g)/255,b=clamp255(rgb.b)/255;
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;
  let h=0,s=0;
  if(d!==0){
    s=d/(1-Math.abs(2*l-1));
    if(max===r)h=60*(((g-b)/d)%6);
    else if(max===g)h=60*((b-r)/d+2);
    else h=60*((r-g)/d+4);
    if(h<0)h+=360;
  }
  return {h,s:s*100,l:l*100};
}
export function hsvHueLabel(h:number):string{
  if(h<15||h>=345)return "red";
  if(h<45)return "orange";
  if(h<75)return "yellow";
  if(h<165)return "green";
  if(h<255)return "blue";
  if(h<285)return "purple";
  return "pink";
}
