export type RGB={r:number;g:number;b:number};
export type ColorImage={width:number;height:number;data:Uint8ClampedArray};
const clamp=(v:number)=>Math.max(0,Math.min(255,Math.round(v)));
export function createRGBScene(width=256,height=160):ColorImage{
 const data=new Uint8ClampedArray(width*height*3);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const nx=x/(width-1),ny=y/(height-1);
  const i=(y*width+x)*3;
  data[i]=clamp(255*nx); data[i+1]=clamp(255*(1-Math.abs(2*ny-1))); data[i+2]=clamp(255*(1-nx)*ny);
 }
 fill(data,width,height,18,20,68,52,{r:230,g:40,b:40});
 fill(data,width,height,94,20,68,52,{r:40,g:220,b:70});
 fill(data,width,height,170,20,68,52,{r:40,g:90,b:235});
 return {width,height,data};
}
function fill(data:Uint8ClampedArray,width:number,height:number,x0:number,y0:number,w:number,h:number,c:RGB){
 for(let y=Math.max(0,y0);y<Math.min(height,y0+h);y++)for(let x=Math.max(0,x0);x<Math.min(width,x0+w);x++){
  const i=(y*width+x)*3; data[i]=c.r;data[i+1]=c.g;data[i+2]=c.b;
 }
}
export function getRGBPixel(im:ColorImage,x:number,y:number):RGB{
 const px=Math.max(0,Math.min(im.width-1,Math.round(x))),py=Math.max(0,Math.min(im.height-1,Math.round(y)));
 const i=(py*im.width+px)*3; return {r:im.data[i],g:im.data[i+1],b:im.data[i+2]};
}
export function extractChannel(im:ColorImage,ch:keyof RGB):Uint8ClampedArray{
 const o=ch==="r"?0:ch==="g"?1:2,out=new Uint8ClampedArray(im.width*im.height*4);
 for(let p=0;p<im.width*im.height;p++){const v=im.data[p*3+o];out[p*4]=v;out[p*4+1]=v;out[p*4+2]=v;out[p*4+3]=255;} return out;
}
export const recombineRGB=(r:number,g:number,b:number):RGB=>({r:clamp(r),g:clamp(g),b:clamp(b)});
