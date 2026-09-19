import type { GrayImage } from "./imageScenes";
import { convolve, normalizeForDisplay, pixelNeighborhood } from "./math";

export type DerivativeMethod = "central" | "sobel";

export const CENTRAL_DX = [[-0.5, 0, 0.5]];
export const CENTRAL_DY = [[-0.5], [0], [0.5]];
export const SOBEL_X = [[-1,0,1],[-2,0,2],[-1,0,1]];
export const SOBEL_Y = [[-1,-2,-1],[0,0,0],[1,2,1]];

export function derivativeKernelX(method: DerivativeMethod) {
  return method === "sobel" ? SOBEL_X : CENTRAL_DX;
}
export function derivativeKernelY(method: DerivativeMethod) {
  return method === "sobel" ? SOBEL_Y : CENTRAL_DY;
}

export function derivativeResponses(image: GrayImage, method: DerivativeMethod = "central") {
  const ix = convolve(image, derivativeKernelX(method));
  const iy = convolve(image, derivativeKernelY(method));
  const magnitude: GrayImage = {width:image.width,height:image.height,data:new Float32Array(image.data.length)};
  const orientation: GrayImage = {width:image.width,height:image.height,data:new Float32Array(image.data.length)};
  for (let i=0;i<image.data.length;i++) {
    const x=ix.data[i], y=iy.data[i];
    magnitude.data[i]=Math.hypot(x,y);
    orientation.data[i]=Math.atan2(y,x);
  }
  return {ix,iy,magnitude,orientation};
}

export function orientationForDisplay(orientation: GrayImage): GrayImage {
  return {width:orientation.width,height:orientation.height,
    data:Float32Array.from(orientation.data,v=>((v+Math.PI)/(2*Math.PI))*255)};
}

export function derivativePixel(image: GrayImage,x:number,y:number,method:DerivativeMethod="central") {
  const {ix,iy,magnitude,orientation}=derivativeResponses(image,method);
  const index=y*image.width+x;
  return {x,y,center:image.data[index],patch:pixelNeighborhood(image,x,y,1),
    ix:ix.data[index],iy:iy.data[index],magnitude:magnitude.data[index],
    orientation:orientation.data[index]};
}

export function derivativeDisplayImages(image:GrayImage,method:DerivativeMethod="central") {
  const responses=derivativeResponses(image,method);
  return {ix:normalizeForDisplay(responses.ix),iy:normalizeForDisplay(responses.iy),
    magnitude:normalizeForDisplay(responses.magnitude),
    orientation:orientationForDisplay(responses.orientation),raw:responses};
}

export function verifyConstantImageDerivatives() {
  const image:GrayImage={width:5,height:5,data:new Float32Array(25).fill(128)};
  const {ix,iy,magnitude}=derivativeResponses(image,"central");
  return ix.data.every(v=>Math.abs(v)<1e-6)&&iy.data.every(v=>Math.abs(v)<1e-6)
    &&magnitude.data.every(v=>Math.abs(v)<1e-6);
}

export function verifyRampDerivative() {
  const image:GrayImage={width:5,height:5,
    data:new Float32Array(Array.from({length:25},(_,i)=>i%5))};
  const {ix,iy}=derivativeResponses(image,"central");
  const interior=[1,2,3,6,7,8,11,12,13,16,17,18];
  return interior.every(i=>Math.abs(ix.data[i]-1)<1e-6)
    &&interior.every(i=>Math.abs(iy.data[i])<1e-6);
}
