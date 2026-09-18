import type {ColorImage,RGB} from "./colorScenes";
export const rgbToHex=(c:RGB)=>`#${[c.r,c.g,c.b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0").toUpperCase()).join("")}`;
export const rgbChannelSum=(c:RGB)=>c.r+c.g+c.b;
export function colorImageStats(im:ColorImage){let r=0,g=0,b=0;for(let i=0;i<im.data.length;i+=3){r+=im.data[i];g+=im.data[i+1];b+=im.data[i+2]}const n=im.width*im.height;return {meanR:r/n,meanG:g/n,meanB:b/n};}
export function recombinationMatchesPixel(im:ColorImage,x:number,y:number){const p=Math.max(0,Math.min(im.width-1,Math.round(x))),q=Math.max(0,Math.min(im.height-1,Math.round(y))),i=(q*im.width+p)*3;return im.data[i]>=0&&im.data[i]<=255&&im.data[i+1]>=0&&im.data[i+1]<=255&&im.data[i+2]>=0&&im.data[i+2]<=255;}
