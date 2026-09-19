import type { GrayImage } from "./imageScenes";
import { addGaussianNoise } from "./imageScenes";
import { convolve, normalizeForDisplay } from "./math";

export type EdgeOperator = "roberts" | "prewitt" | "sobel" | "laplacian" | "log";

export const ROBERTS_X = [[1, 0], [0, -1]];
export const ROBERTS_Y = [[0, 1], [-1, 0]];
export const PREWITT_X = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]];
export const PREWITT_Y = [[-1, -1, -1], [0, 0, 0], [1, 1, 1]];
export const SOBEL_X = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
export const SOBEL_Y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];
export const LAPLACIAN_4 = [[0, 1, 0], [1, -4, 1], [0, 1, 0]];

export function gaussianKernel(size = 5, sigma = 1.0): number[][] {
  const r = Math.floor(size / 2); const out: number[][] = []; let sum = 0;
  for (let y = -r; y <= r; y++) { const row: number[] = []; for (let x = -r; x <= r; x++) { const v = Math.exp(-(x*x+y*y)/(2*sigma*sigma)); row.push(v); sum += v; } out.push(row); }
  return out.map(row => row.map(v => v / sum));
}

export function laplacianOfGaussianKernel(sigma = 1.0): number[][] {
  const size=7, r=3, s2=sigma*sigma, s4=s2*s2; const out:number[][]=[]; let sum=0;
  for(let y=-r;y<=r;y++){const row:number[]=[];for(let x=-r;x<=r;x++){const q=x*x+y*y;const v=((q-2*s2)/s4)*Math.exp(-q/(2*s2));row.push(v);sum+=v;}out.push(row);}
  const mean=sum/(size*size); return out.map(row=>row.map(v=>v-mean));
}

function gradientMagnitude(image: GrayImage,kx:number[][],ky:number[][]):GrayImage{const gx=convolve(image,kx),gy=convolve(image,ky),data=new Float32Array(image.data.length);for(let i=0;i<data.length;i++)data[i]=Math.hypot(gx.data[i],gy.data[i]);return{width:image.width,height:image.height,data};}

export function edgeResponse(image:GrayImage,operator:EdgeOperator,sigma=1):GrayImage{if(operator==="roberts")return gradientMagnitude(image,ROBERTS_X,ROBERTS_Y);if(operator==="prewitt")return gradientMagnitude(image,PREWITT_X,PREWITT_Y);if(operator==="sobel")return gradientMagnitude(image,SOBEL_X,SOBEL_Y);if(operator==="laplacian")return convolve(image,LAPLACIAN_4);return convolve(image,laplacianOfGaussianKernel(sigma));}
export function edgeDisplayImage(image:GrayImage,operator:EdgeOperator,sigma=1):GrayImage{return normalizeForDisplay(edgeResponse(image,operator,sigma));}
export function thresholdEdges(response:GrayImage,threshold:number):GrayImage{const data=new Float32Array(response.data.length);for(let i=0;i<data.length;i++)data[i]=Math.abs(response.data[i])>=threshold?255:0;return{width:response.width,height:response.height,data};}

export function zeroCrossingEdges(response:GrayImage,threshold=5):GrayImage{const data=new Float32Array(response.data.length),w=response.width,h=response.height;for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const center=response.data[y*w+x];if(Math.abs(center)<threshold)continue;let crossing=false;for(let dy=-1;dy<=1&&!crossing;dy++)for(let dx=-1;dx<=1;dx++){if(dx===0&&dy===0)continue;const n=response.data[(y+dy)*w+(x+dx)];if(Math.abs(n)>=threshold&&Math.sign(n)!==Math.sign(center)){crossing=true;break;}}if(crossing)data[y*w+x]=255;}return{width:w,height:h,data};}

export type NoiseAmplificationResult={noisy:GrayImage;difference:GrayImage;inputVariance:number;derivativeVariance:number;varianceRatio:number;expectedRatio:number;};
export function noiseAmplificationExperiment(noiseSigma=18,seed=42):NoiseAmplificationResult{const base:GrayImage={width:256,height:256,data:new Float32Array(256*256).fill(128)};const noisy=addGaussianNoise(base,noiseSigma,seed),differenceData=new Float32Array(noisy.data.length);let inputSum=0,inputSq=0,diffSum=0,diffSq=0,n=0;for(let y=1;y<noisy.height-1;y++)for(let x=1;x<noisy.width-1;x++){const n0=noisy.data[y*noisy.width+x],n1=noisy.data[y*noisy.width+x+1],d=n1-n0;differenceData[y*noisy.width+x]=d;const e=n0-128;inputSum+=e;inputSq+=e*e;diffSum+=d;diffSq+=d*d;n++;}const inputMean=inputSum/n,diffMean=diffSum/n,inputVariance=inputSq/n-inputMean*inputMean,derivativeVariance=diffSq/n-diffMean*diffMean;return{noisy,difference:{width:noisy.width,height:noisy.height,data:differenceData},inputVariance,derivativeVariance,varianceRatio:derivativeVariance/Math.max(inputVariance,1e-12),expectedRatio:2};}

export function edgePixel(image:GrayImage,x:number,y:number,operator:EdgeOperator,sigma=1){const response=edgeResponse(image,operator,sigma),index=y*image.width+x;return{x,y,input:image.data[index],response:response.data[index],absolute:Math.abs(response.data[index])};}
export function verifyConstantEdges():boolean{const image:GrayImage={width:9,height:9,data:new Float32Array(81).fill(100)};for(const op of ["roberts","prewitt","sobel","laplacian","log"] as EdgeOperator[]){const response=edgeResponse(image,op,1);if(!response.data.every(v=>Math.abs(v)<1e-3))return false;}return true;}
export function verifyHorizontalStep():boolean{const data=new Float32Array(25);for(let y=0;y<5;y++)for(let x=0;x<5;x++)data[y*5+x]=x<2?0:100;const image:GrayImage={width:5,height:5,data},response=edgeResponse(image,"sobel");return Math.max(...Array.from(response.data))>100;}
export function verifyLoGKernel():boolean{const kernel=laplacianOfGaussianKernel(1),sum=kernel.flat().reduce((a,b)=>a+b,0);return Math.abs(sum)<1e-5&&kernel[3][3]<0;}
export function verifyZeroCrossingStep():boolean{const data=new Float32Array(25);for(let y=0;y<5;y++)for(let x=0;x<5;x++)data[y*5+x]=x<2?0:100;const image:GrayImage={width:5,height:5,data};return zeroCrossingEdges(edgeResponse(image,"laplacian"),5).data.some(v=>v>0);}
export function verifyNoiseAmplification():boolean{const result=noiseAmplificationExperiment(18,42);return result.varianceRatio>1.7&&result.varianceRatio<2.3;}
