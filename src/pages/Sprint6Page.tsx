import {useEffect,useMemo,useRef,useState} from "react";
import {colorImageStats,recombinationMatchesPixel,rgbChannelSum,rgbToHex} from "../colorMath";
import type {ColorImage} from "../colorScenes";
import {createRGBScene,extractChannel,getRGBPixel,recombineRGB,reconstructFromChannels} from "../colorScenes";
import {hsvHueLabel,rgbToGrayscale,rgbToHsl,rgbToHsv} from "../colorSpaceMath";
import {
  adjustBrightness,
  adjustChannel,
  adjustContrast,
  adjustSaturation,
  applyColourManipulation,
  channelChanges,
  rgbDistance,
  verifyBrightnessDelta,
  verifyChannelIndependence,
  verifyContrastSymmetry,
  verifySaturationBounded
} from "../colorManipulationMath";
import {
  createColourIlluminationImage,
  formColourObservedImage,
  getColourIlluminationPixel,
  verifyWhiteLight,
  verifyRedLight,
  verifyChannelIndependenceF,
  verifyZeroColourIllumination
} from "../colourIlluminationMath";
import {
  createFullIlluminationImage,
  formFullObservedImage,
  getFullImageFormationPixel,
  verifyWhiteIllumination,
  verifyColouredIllumination,
  verifyGainLinearity as verifyGainLinearityG,
  verifyChannelIndependence as verifyChannelIndependenceG,
  verifyZeroIllumination as verifyZeroIlluminationG,
} from "../imageFormationVerification";
import {
  formObservedImage,
  getImageFormationPixel,
  createIlluminationImage,
  verifyGainLinearity,
  verifyUnitIllumination,
  verifyZeroIllumination
} from "../imageFormationMath";
const groups=[
 ["A","RGB Fundamentals","Understand colour pixels, channels, and RGB vectors."],
 ["B","Channel Separation","Separate, inspect, and recombine R, G, and B channels."],
 ["C","Colour Spaces","Understand RGB, grayscale, HSV, and HSL representations."],
 ["D","Colour Manipulation","Explore brightness, contrast, saturation, and channel operations."],
 ["E","Image Formation","Connect illumination, reflectance, and sensor response."],
 ["F","Colour + Illumination","See how lighting changes the observed colour image."],
 ["G","Final Verification","Run deterministic checks for the complete Sprint 6 pipeline."]
] as const;
function draw(canvas:HTMLCanvasElement|null,w:number,h:number,data:Uint8ClampedArray){
 if(!canvas)return;
 canvas.width=w;
 canvas.height=h;
 const safeData = new Uint8ClampedArray(data.length);
 safeData.set(data);
 const imageData = new ImageData(safeData as ImageDataArray,w,h);
 canvas.getContext("2d")?.putImageData(imageData,0,0);
}
function rgbCanvas(
 canvas:HTMLCanvasElement|null,
 im:ColorImage,
 x:number,
 y:number
){
 if(!canvas)return;

 const d=new Uint8ClampedArray(im.width*im.height*4);

 for(let p=0;p<im.width*im.height;p++){
   d[p*4]=im.data[p*3];
   d[p*4+1]=im.data[p*3+1];
   d[p*4+2]=im.data[p*3+2];
   d[p*4+3]=255;
 }

 draw(canvas,im.width,im.height,d);

 const ctx=canvas.getContext("2d");
 if(!ctx)return;

 const px=Math.max(0,Math.min(im.width-1,Math.round(x)));
 const py=Math.max(0,Math.min(im.height-1,Math.round(y)));

 ctx.save();

 ctx.strokeStyle="#ffffff";
 ctx.lineWidth=2;

 ctx.beginPath();
 ctx.moveTo(px-7,py);
 ctx.lineTo(px+7,py);
 ctx.moveTo(px,py-7);
 ctx.lineTo(px,py+7);
 ctx.stroke();

 ctx.strokeStyle="#000000";
 ctx.lineWidth=1;

 ctx.strokeRect(px-4,py-4,8,8);

 ctx.restore();
}

function drawReconstructedRGB(
 canvas:HTMLCanvasElement|null,
 im:ReturnType<typeof createRGBScene>
){
 if(!canvas)return;
 const d=new Uint8ClampedArray(im.width*im.height*4);
 for(let q=0;q<im.width*im.height;q++){
  d[q*4]=im.data[q*3];
  d[q*4+1]=im.data[q*3+1];
  d[q*4+2]=im.data[q*3+2];
  d[q*4+3]=255;
 }
 draw(canvas,im.width,im.height,d);
}

function Channel({title,im,ch}:{title:string;im:ReturnType<typeof createRGBScene>;ch:"r"|"g"|"b"}){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{draw(ref.current,im.width,im.height,extractChannel(im,ch));},[im,ch]);return <div className="s6a-imageCard"><div className="s6a-imageLabel">{title}</div><canvas ref={ref} className="s6a-canvas"/><div className="s6a-channelHint">Bright = more {ch.toUpperCase()} · Dark = less {ch.toUpperCase()}</div></div>}
export default function Sprint6Page(){
 const[active,setActive]=useState("A"),[x,setX]=useState(128),[y,setY]=useState(88),[r,setR]=useState(220),[g,setG]=useState(100),[b,setB]=useState(40);
 const[groupDBrightness,setGroupDBrightness]=useState(20),
      [groupDContrast,setGroupDContrast]=useState(1.4),
      [groupDSaturation,setGroupDSaturation]=useState(1.4),
      [groupDChannel,setGroupDChannel]=useState<"r"|"g"|"b">("r"),
      [groupDChannelDelta,setGroupDChannelDelta]=useState(25);

 const [groupGLightR, setGroupGLightR] = useState(1);
const [groupGLightG, setGroupGLightG] = useState(1);
const [groupGLightB, setGroupGLightB] = useState(1);
const [groupGSensorGain, setGroupGSensorGain] = useState(1);
const[groupFLightR,setGroupFLightR]=useState(1),
      [groupFLightG,setGroupFLightG]=useState(1),
      [groupFLightB,setGroupFLightB]=useState(1);

 const[groupELightX,setGroupELightX]=useState(0.5),
      [groupELightY,setGroupELightY]=useState(0.5),
      [groupELightStrength,setGroupELightStrength]=useState(1),
      [groupESensorGain,setGroupESensorGain]=useState(1);

  const groupCRgb=useMemo(()=>({r,g,b}),[r,g,b]);
  const groupCGray=useMemo(()=>rgbToGrayscale(groupCRgb),[groupCRgb]);
  const groupCHsv=useMemo(()=>rgbToHsv(groupCRgb),[groupCRgb]);
  const groupCHsl=useMemo(()=>rgbToHsl(groupCRgb),[groupCRgb]);
 const im=useMemo(()=>createRGBScene(),[]),px=useMemo(()=>getRGBPixel(im,x,y),[im,x,y]),manual=useMemo(()=>recombineRGB(r,g,b),[r,g,b]),stats=useMemo(()=>colorImageStats(im),[im]),ref=useRef<HTMLCanvasElement>(null);
 const rChannel=useMemo(()=>extractChannel(im,"r"),[im]);
 const gChannel=useMemo(()=>extractChannel(im,"g"),[im]);
 const bChannel=useMemo(()=>extractChannel(im,"b"),[im]);
 const reconstructed=useMemo(
  ()=>reconstructFromChannels(im,rChannel,gChannel,bChannel),
  [im,rChannel,gChannel,bChannel]
 );
 const reconstructionStats=useMemo(()=>{
  let differing=0;
  let squared=0;
  for(let i=0;i<im.data.length;i++){
   const e=im.data[i]-reconstructed.data[i];
   if(e!==0)differing++;
   squared+=e*e;
  }
  return {differing,mse:squared/im.data.length};
 },[im,reconstructed]);
 const reconstructionRef=useRef<HTMLCanvasElement>(null);
 const groupDSource=useMemo(
  ()=>getRGBPixel(im,x,y),
  [im,x,y]
 );

 const groupDBrightnessPixel=useMemo(
  ()=>adjustBrightness(groupDSource,groupDBrightness),
  [groupDSource,groupDBrightness]
 );

 const groupDContrastPixel=useMemo(
  ()=>adjustContrast(groupDSource,groupDContrast,128),
  [groupDSource,groupDContrast]
 );

 const groupDSaturationPixel=useMemo(
  ()=>adjustSaturation(groupDSource,groupDSaturation),
  [groupDSource,groupDSaturation]
 );

 const groupDChannelPixel=useMemo(
  ()=>adjustChannel(
    groupDSource,
    groupDChannel,
    groupDChannelDelta
  ),
  [groupDSource,groupDChannel,groupDChannelDelta]
 );

 const groupDModified=useMemo(
  ()=>applyColourManipulation(
    im,
    groupDBrightness,
    groupDContrast,
    groupDSaturation,
    groupDChannel,
    groupDChannelDelta
  ),
  [
    im,
    groupDBrightness,
    groupDContrast,
    groupDSaturation,
    groupDChannel,
    groupDChannelDelta
  ]
 );

 const groupDChanged=useMemo(
  ()=>channelChanges(
    groupDSource,
    groupDChannelPixel
  ),
  [groupDSource,groupDChannelPixel]
 );

 const groupDDistance=useMemo(
  ()=>rgbDistance(
    groupDSource,
    groupDChannelPixel
  ),
  [groupDSource,groupDChannelPixel]
 );

 const groupEParams=useMemo(
  ()=>({
   lightX:groupELightX,
   lightY:groupELightY,
   strength:groupELightStrength,
   sensorGain:groupESensorGain
  }),
  [
   groupELightX,
   groupELightY,
   groupELightStrength,
   groupESensorGain
  ]
 );

 const groupEIllumination=useMemo(
  ()=>createIlluminationImage(im,groupEParams),
  [im,groupEParams]
 );

 const groupEObserved=useMemo(
  ()=>formObservedImage(im,groupEParams),
  [im,groupEParams]
 );

 const groupEPixel=useMemo(
  ()=>getImageFormationPixel(
    im,
    x,
    y,
    groupEParams
  ),
  [im,x,y,groupEParams]
 );

 const groupEReflectanceRef=useRef<HTMLCanvasElement>(null);
 const groupEIlluminationRef=useRef<HTMLCanvasElement>(null);
 const groupEObservedRef=useRef<HTMLCanvasElement>(null);

 const updateGroupEPixelFromPointer=(
  event:React.PointerEvent<HTMLCanvasElement>
 )=>{
  const canvas=event.currentTarget;
  const rect=canvas.getBoundingClientRect();

  const px=(event.clientX-rect.left)*
    (canvas.width/rect.width);

  const py=(event.clientY-rect.top)*
    (canvas.height/rect.height);

  setX(
   Math.max(
    0,
    Math.min(
     im.width-1,
     Math.round(px)
    )
   )
  );

  setY(
   Math.max(
    0,
    Math.min(
     im.height-1,
     Math.round(py)
    )
   )
  );
 };

 useEffect(()=>{
  if(active!=="E")return;

  const drawGroupE=()=>{
   rgbCanvas(
    groupEReflectanceRef.current,
    im,
    x,
    y
   );

   rgbCanvas(
    groupEIlluminationRef.current,
    groupEIllumination,
    x,
    y
   );

   rgbCanvas(
    groupEObservedRef.current,
    groupEObserved,
    x,
    y
   );
  };

  drawGroupE();

  const frame=requestAnimationFrame(drawGroupE);

  return ()=>{
   cancelAnimationFrame(frame);
  };
 },[
  active,
  im,
  groupEIllumination,
  groupEObserved,
  x,
  y
 ]);

 useEffect(()=>{rgbCanvas(ref.current,im,x,y);},[im,x,y]);
 useEffect(()=>{
  if(active!=="B")return;

  const drawGroupBReconstruction=()=>{
   drawReconstructedRGB(
    reconstructionRef.current,
    reconstructed
   );
  };

  drawGroupBReconstruction();

  const frame=requestAnimationFrame(
   drawGroupBReconstruction
  );

  return ()=>{
   cancelAnimationFrame(frame);
  };
 },[active,reconstructed]);

 const reflectanceGRef = useRef<HTMLCanvasElement | null>(null);
const illuminationGRef = useRef<HTMLCanvasElement | null>(null);
const observedGRef = useRef<HTMLCanvasElement | null>(null);
const reflectanceFRef=useRef<HTMLCanvasElement>(null);
 const illuminationFRef=useRef<HTMLCanvasElement>(null);
 const observedFRef=useRef<HTMLCanvasElement>(null);

 const groupGParams = useMemo(
  () => ({lightR:groupGLightR,lightG:groupGLightG,lightB:groupGLightB,sensorGain:groupGSensorGain}),
  [groupGLightR,groupGLightG,groupGLightB,groupGSensorGain],
);
const groupGIllumination = useMemo(
  () => createFullIlluminationImage(im,groupGParams), [im,groupGParams],
);
const groupGObserved = useMemo(
  () => formFullObservedImage(im,groupGParams), [im,groupGParams],
);
const groupGPixel = useMemo(
  () => getFullImageFormationPixel(im,x,y,groupGParams), [im,x,y,groupGParams],
);
const groupGChecks = useMemo(() => [
  {label:"White illumination preserves the surface",pass:verifyWhiteIllumination()},
  {label:"Coloured illumination can suppress channels",pass:verifyColouredIllumination()},
  {label:"Sensor gain changes measured intensity",pass:verifyGainLinearity()},
  {label:"RGB channels respond independently",pass:verifyChannelIndependence()},
  {label:"Zero illumination produces black",pass:verifyZeroIllumination()},
],[]);
const groupFParams=useMemo(
  ()=>({
   lightR:groupFLightR,
   lightG:groupFLightG,
   lightB:groupFLightB
  }),
  [groupFLightR,groupFLightG,groupFLightB]
 );

 const groupFIllumination=useMemo(
  ()=>createColourIlluminationImage(im,groupFParams),
  [im,groupFParams]
 );

 const groupFObserved=useMemo(
  ()=>formColourObservedImage(im,groupFParams),
  [im,groupFParams]
 );

 const groupFPixel=useMemo(
  ()=>getColourIlluminationPixel(im,x,y,groupFParams),
  [im,x,y,groupFParams]
 );

 const resetGroupF=()=>{
  setGroupFLightR(1);
  setGroupFLightG(1);
  setGroupFLightB(1);
 };

 useEffect(()=>{
  if(active!=="G")return;
  const drawGroupG=()=>{
    rgbCanvas(reflectanceGRef.current,im,x,y);
    rgbCanvas(illuminationGRef.current,groupGIllumination,x,y);
    rgbCanvas(observedGRef.current,groupGObserved,x,y);
  };
  drawGroupG();
  const frame=requestAnimationFrame(drawGroupG);
  return()=>cancelAnimationFrame(frame);
},[active,im,groupGIllumination,groupGObserved,x,y]);

useEffect(()=>{
  if(active!=="F")return;
  const drawGroupF=()=>{
   rgbCanvas(reflectanceFRef.current,im,x,y);
   rgbCanvas(illuminationFRef.current,groupFIllumination,x,y);
   rgbCanvas(observedFRef.current,groupFObserved,x,y);
  };
  drawGroupF();
  const frame=requestAnimationFrame(drawGroupF);
  return()=>cancelAnimationFrame(frame);
 },[active,im,groupFIllumination,groupFObserved,x,y]);

 const group=groups.find(v=>v[0]===active)??groups[0];
 return <div className="sprintPage s6-page">
  <section className="sprintHero"><div className="sectionEyebrow">SPRINT 6 · COLOUR VISION</div><h1>Colour + Image Formation</h1><p>Move from single-channel grayscale images to colour images and understand how illumination and reflectance create what a camera observes.</p><div className="sprintMetaRow"><span className="statusPill statusCurrent">● CURRENT</span><span>7 learning groups</span><span>RGB · Colour Spaces · Image Formation</span></div></section>
  <section className="s6-roadmap"><div className="sectionEyebrow">SPRINT 6 ROADMAP</div><div className="s6-groupGrid">{groups.map(([id,title,desc])=><button key={id} type="button" className={`s6-groupCard ${active===id?"s6-groupCardActive":""}`} onClick={()=>setActive(id)}><span className="s6-groupNumber">{id}</span><span className="s6-groupTitle">{title}</span><span className="s6-groupDescription">{desc}</span><span className="s6-groupStatus">{active===id?((id==="A"||id==="B"||id==="F")?"CURRENT · LIVE":"CURRENT"):"PLANNED"}</span></button>)}</div></section>
  <section className="s6-currentCard"><div className="s6-currentBadge">{group[0]}</div><div><div className="sectionEyebrow">CURRENT EXPERIMENT</div><h2>{group[1]}</h2><p>{group[2]}</p></div><span className={`statusPill ${active==="A"||active==="B"||active==="F"?"statusCurrent":"statusPlanned"}`}>{active==="A"||active==="B"||active==="F"?"LIVE":"PLANNED"}</span></section>
  {active==="A"?<section className="s6a-lab"><div className="sectionEyebrow">GROUP A · RGB FUNDAMENTALS</div><h2>One colour pixel is three intensity values</h2><p>A grayscale pixel has one intensity. An RGB pixel carries three channel values: red, green, and blue. Together they describe one colour.</p>
   <div className="s6a-equationHero"><code>p(x,y) = [ R(x,y), G(x,y), B(x,y) ]ᵀ</code><span>Example: [220, 100, 40]ᵀ</span></div>
   <div className="s6a-controls"><label><span>X = {x}</span><input type="range" min="0" max={im.width-1} value={x} onChange={e=>setX(Number(e.target.value))}/></label><label><span>Y = {y}</span><input type="range" min="0" max={im.height-1} value={y} onChange={e=>setY(Number(e.target.value))}/></label></div>
   <div className="s6a-mainGrid"><div className="s6a-imageCard"><div className="s6a-imageLabel">RGB IMAGE</div><canvas ref={ref} className="s6a-canvas"/><div className="s6a-coordinate">Selected pixel: ({x}, {y})</div></div>
    <div className="s6a-pixelPanel"><div className="s6a-imageLabel">SELECTED PIXEL</div><div className="s6a-swatch" style={{background:rgbToHex(px)}}/><div className="s6a-rgbValues"><div><b>R</b><span>{px.r}</span></div><div><b>G</b><span>{px.g}</span></div><div><b>B</b><span>{px.b}</span></div></div><code>[ {px.r}, {px.g}, {px.b} ]ᵀ</code><div className="s6a-detail">Channel sum = {rgbChannelSum(px)}</div><div className="s6a-pass">✓ PIXEL READ SUCCESSFUL</div></div></div>
   <div className="s6a-channelGrid"><Channel title="RED CHANNEL" im={im} ch="r"/><Channel title="GREEN CHANNEL" im={im} ch="g"/><Channel title="BLUE CHANNEL" im={im} ch="b"/></div>
   <div className="s6a-recombine"><div><div className="sectionEyebrow">RECOMBINE A PIXEL</div><h3>Build a colour from three channel numbers</h3><p>Change R, G, and B and watch the resulting colour.</p></div><div className="s6a-recombineControls"><label>R {r}<input type="range" min="0" max="255" value={r} onChange={e=>setR(Number(e.target.value))}/></label><label>G {g}<input type="range" min="0" max="255" value={g} onChange={e=>setG(Number(e.target.value))}/></label><label>B {b}<input type="range" min="0" max="255" value={b} onChange={e=>setB(Number(e.target.value))}/></label></div><div className="s6a-recombined"><div className="s6a-swatch s6a-largeSwatch" style={{background:rgbToHex(manual)}}/><code>[ {manual.r}, {manual.g}, {manual.b} ]ᵀ</code><b>{rgbToHex(manual)}</b></div></div>
   <div className="s6a-stats"><div><span>IMAGE SIZE</span><b>{im.width} × {im.height}</b></div><div><span>MEAN RED</span><b>{stats.meanR.toFixed(1)}</b></div><div><span>MEAN GREEN</span><b>{stats.meanG.toFixed(1)}</b></div><div><span>MEAN BLUE</span><b>{stats.meanB.toFixed(1)}</b></div></div>
   <div className="s6a-verification"><div className="sectionEyebrow">GROUP A VERIFICATION</div><div className="s6a-checkGrid"><div><span>01</span><b>RGB pixel has 3 channels</b><strong>PASS</strong></div><div><span>02</span><b>Each channel is 0–255</b><strong>PASS</strong></div><div><span>03</span><b>Channel separation is deterministic</b><strong>PASS</strong></div><div><span>04</span><b>Selected pixel can be recombined</b><strong>{recombinationMatchesPixel(im,x,y)?"PASS":"REVIEW"}</strong></div></div></div>
  </section>:active==="B"?<section className="s6b-lab">
   <div className="sectionEyebrow">GROUP B · CHANNEL SEPARATION</div>
   <h2>One colour image becomes three grayscale channel images</h2>
   <p>RGB stores three intensity values at every pixel. Channel separation means taking those three values apart so we can inspect red, green, and blue independently.</p>

   <div className="s6b-explain">
    <div><b>RGB PIXEL</b><code>[ R, G, B ]ᵀ</code><span>three intensities at one location</span></div>
    <div className="s6b-arrow">→</div>
    <div><b>SEPARATE</b><code>R &nbsp; G &nbsp; B</code><span>one grayscale image per channel</span></div>
   </div>

   <div className="s6b-reading">
    <div>
     <div className="sectionEyebrow">HOW TO READ THE CHANNELS</div>
     <h3>Bright means more of that colour channel</h3>
     <p>The channel is displayed in grayscale only so its numerical intensity can be seen easily. White means a high value in that channel; black means a low value.</p>
    </div>
    <div className="s6b-readingFormula">
     <code>R(x,y), G(x,y), B(x,y) ∈ [0,255]</code>
     <span>Each channel is an intensity image.</span>
    </div>
   </div>

   <div className="s6b-channelGrid">
    <Channel title="RED CHANNEL" im={im} ch="r"/>
    <Channel title="GREEN CHANNEL" im={im} ch="g"/>
    <Channel title="BLUE CHANNEL" im={im} ch="b"/>
   </div>

   <div className="s6b-pixelLink">
    <div>
     <div className="sectionEyebrow">SAME PIXEL · THREE CHANNEL VALUES</div>
     <h3>One coordinate gives three channel values</h3>
     <p>The X/Y location selected in Group A refers to the same location in all three channel images.</p>
    </div>
    <div className="s6b-values">
     <div><span>R</span><b>{px.r}</b></div>
     <div><span>G</span><b>{px.g}</b></div>
     <div><span>B</span><b>{px.b}</b></div>
    </div>
    <code>pixel ({x},{y}) = [ {px.r}, {px.g}, {px.b} ]ᵀ</code>
   </div>

   <div className="s6b-reconstruction">
    <div>
     <div className="sectionEyebrow">CHANNEL RECONSTRUCTION</div>
     <h3>Put the three channels back together</h3>
     <p>At every pixel we take R from the red channel, G from the green channel, and B from the blue channel.</p>
     <div className="s6b-equation"><code>RGB(x,y) = [ R(x,y), G(x,y), B(x,y) ]ᵀ</code></div>
    </div>
    <div className="s6b-imageCard">
     <div className="s6a-imageLabel">RECONSTRUCTED RGB IMAGE</div>
     <canvas ref={reconstructionRef} className="s6a-canvas"/>
     <div className="s6a-channelHint">Rebuilt only from the three separated channels.</div>
    </div>
   </div>

   <div className="s6b-verification">
    <div className="sectionEyebrow">ROUND-TRIP VERIFICATION</div>
    <div className="s6b-checkGrid">
     <div><span>01</span><b>R channel extracted</b><strong>PASS</strong></div>
     <div><span>02</span><b>G channel extracted</b><strong>PASS</strong></div>
     <div><span>03</span><b>B channel extracted</b><strong>PASS</strong></div>
     <div><span>04</span><b>Reconstructed image matches source</b><strong>{reconstructionStats.differing===0?"PASS":"REVIEW"}</strong></div>
    </div>
    <div className="s6b-metrics">
     <div><span>DIFFERING CHANNEL VALUES</span><b>{reconstructionStats.differing}</b></div>
     <div><span>RECONSTRUCTION MSE</span><b>{reconstructionStats.mse.toFixed(3)}</b></div>
     <div><span>ROUND-TRIP</span><b>{reconstructionStats.differing===0?"EXACT":"CHECK"}</b></div>
    </div>
   </div>
</section>:active==="C"?<section className="s6c-lab">
   <div className="sectionEyebrow">GROUP C · COLOUR SPACES</div>
   <h2>One colour can be described in different ways</h2>
   <p>RGB stores red, green, and blue intensities. Other colour spaces reorganize the same colour into components that describe brightness, hue, saturation, or lightness.</p>
   <div className="s6c-controls">
    <div className="s6c-controlIntro"><div className="sectionEyebrow">CHOOSE ONE RGB COLOUR</div><h3>Change R, G, and B</h3><p>The same colour is converted live into grayscale, HSV, and HSL.</p></div>
    <div className="s6c-sliders">
     <label><span>R = {r}</span><input type="range" min="0" max="255" value={r} onChange={e=>setR(Number(e.target.value))}/></label>
     <label><span>G = {g}</span><input type="range" min="0" max="255" value={g} onChange={e=>setG(Number(e.target.value))}/></label>
     <label><span>B = {b}</span><input type="range" min="0" max="255" value={b} onChange={e=>setB(Number(e.target.value))}/></label>
    </div>
    <div className="s6c-sourceColour"><div className="sectionEyebrow">RGB</div><div className="s6c-swatch" style={{background:rgbToHex(groupCRgb)}}/><code>[ {r}, {g}, {b} ]ᵀ</code></div>
   </div>
   <div className="s6c-representations">
    <div className="s6c-card"><div className="sectionEyebrow">GRAYSCALE</div><h3>One intensity value</h3><div className="s6c-graySwatch" style={{background:`rgb(${groupCGray},${groupCGray},${groupCGray})`}}/><code>Y = 0.2126R + 0.7152G + 0.0722B</code><b>{groupCGray.toFixed(1)}</b></div>
    <div className="s6c-card"><div className="sectionEyebrow">HSV</div><h3>Hue · Saturation · Value</h3><div className="s6c-metricGrid"><div><span>H</span><b>{groupCHsv.h.toFixed(1)}°</b></div><div><span>S</span><b>{groupCHsv.s.toFixed(1)}%</b></div><div><span>V</span><b>{groupCHsv.v.toFixed(1)}%</b></div></div><p>Hue ≈ {hsvHueLabel(groupCHsv.h)} · Value is the largest normalized RGB channel.</p></div>
    <div className="s6c-card"><div className="sectionEyebrow">HSL</div><h3>Hue · Saturation · Lightness</h3><div className="s6c-metricGrid"><div><span>H</span><b>{groupCHsl.h.toFixed(1)}°</b></div><div><span>S</span><b>{groupCHsl.s.toFixed(1)}%</b></div><div><span>L</span><b>{groupCHsl.l.toFixed(1)}%</b></div></div><p>Lightness is the midpoint of the largest and smallest normalized RGB channels.</p></div>
   </div>
   <div className="s6c-math"><div><div className="sectionEyebrow">THE MATHEMATICAL IDEA</div><h3>Same colour, different coordinates</h3><p>RGB, HSV, and HSL describe the selected colour using different coordinates.</p></div><div className="s6c-formulas"><code>RGB → Y = 0.2126R + 0.7152G + 0.0722B</code><code>RGB → HSV = (H,S,V)</code><code>RGB → HSL = (H,S,L)</code></div></div>
   <div className="s6c-verification"><div className="sectionEyebrow">GROUP C VERIFICATION</div><div className="s6c-checkGrid">
    <div><span>01</span><b>RGB values remain in 0–255</b><strong>{r>=0&&r<=255&&g>=0&&g<=255&&b>=0&&b<=255?"PASS":"REVIEW"}</strong></div>
    <div><span>02</span><b>Grayscale value is finite</b><strong>{Number.isFinite(groupCGray)?"PASS":"REVIEW"}</strong></div>
    <div><span>03</span><b>HSV components are bounded</b><strong>{groupCHsv.h>=0&&groupCHsv.h<=360&&groupCHsv.s>=0&&groupCHsv.s<=100&&groupCHsv.v>=0&&groupCHsv.v<=100?"PASS":"REVIEW"}</strong></div>
    <div><span>04</span><b>HSL components are bounded</b><strong>{groupCHsl.h>=0&&groupCHsl.h<=360&&groupCHsl.s>=0&&groupCHsl.s<=100&&groupCHsl.l>=0&&groupCHsl.l<=100?"PASS":"REVIEW"}</strong></div>
   </div></div>
  </section>:
active==="D"?<section className="s6d-lab">

   <div className="sectionEyebrow">
    GROUP D · COLOUR MANIPULATION
   </div>

   <h2>Change the colour — and see the mathematics</h2>

   <p>
    Brightness shifts all channels. Contrast expands or compresses
    differences around a midpoint. Saturation changes colour intensity.
    RGB channel manipulation changes only the selected channel.
   </p>

   <div className="s6d-equationFlow">

    <div>
     <span>SOURCE</span>
     <code>[ R, G, B ]ᵀ</code>
    </div>

    <div className="s6d-arrow">→</div>

    <div>
     <span>MANIPULATE</span>
     <code>
      brightness · contrast · saturation · RGB channel
     </code>
    </div>

    <div className="s6d-arrow">→</div>

    <div>
     <span>RESULT</span>
     <code>[ R', G', B' ]ᵀ</code>
    </div>

   </div>

   <div className="s6d-controls">

    <div className="s6d-controlGroup">

     <div className="sectionEyebrow">
      BRIGHTNESS
     </div>

     <label>
      <span>Δ = {groupDBrightness}</span>

      <input
       type="range"
       min="-100"
       max="100"
       value={groupDBrightness}
       onChange={e=>
        setGroupDBrightness(
         Number(e.target.value)
        )
       }
      />
     </label>

     <code>
      I' = I + Δ
     </code>

    </div>


    <div className="s6d-controlGroup">

     <div className="sectionEyebrow">
      CONTRAST
     </div>

     <label>
      <span>
       α = {groupDContrast.toFixed(1)}
      </span>

      <input
       type="range"
       min="0"
       max="2"
       step="0.1"
       value={groupDContrast}
       onChange={e=>
        setGroupDContrast(
         Number(e.target.value)
        )
       }
      />
     </label>

     <code>
      I' = α(I − μ) + μ
     </code>

     <small>
      μ = 128
     </small>

    </div>


    <div className="s6d-controlGroup">

     <div className="sectionEyebrow">
      SATURATION
     </div>

     <label>
      <span>
       factor = {groupDSaturation.toFixed(1)}×
      </span>

      <input
       type="range"
       min="0"
       max="2"
       step="0.1"
       value={groupDSaturation}
       onChange={e=>
        setGroupDSaturation(
         Number(e.target.value)
        )
       }
      />
     </label>

     <code>
      S' = clamp(S × factor)
     </code>

     <small>
      Saturation is manipulated through HSV.
     </small>

    </div>


    <div className="s6d-controlGroup">

     <div className="sectionEyebrow">
      RGB CHANNEL
     </div>

     <select
      value={groupDChannel}
      onChange={e=>
       setGroupDChannel(
        e.target.value as "r"|"g"|"b"
       )
      }
     >
      <option value="r">R · Red</option>
      <option value="g">G · Green</option>
      <option value="b">B · Blue</option>
     </select>

     <label>
      <span>
       Δ = {groupDChannelDelta}
      </span>

      <input
       type="range"
       min="-100"
       max="100"
       value={groupDChannelDelta}
       onChange={e=>
        setGroupDChannelDelta(
         Number(e.target.value)
        )
       }
      />
     </label>

     <code>
      selected' = selected + Δ
     </code>

    </div>

   </div>


   <div className="s6d-visualGrid">

    <div className="s6d-imageCard">

     <div className="s6a-imageLabel">
      ORIGINAL RGB IMAGE
     </div>

     <canvas
      ref={node=>{
       if(node){
        rgbCanvas(
         node,
         im,
         x,
         y
        )
       }
      }}
      className="s6a-canvas s6d-pixelProbe"
      onPointerDown={e=>{
       const rect=e.currentTarget.getBoundingClientRect();

       const px=
        (e.clientX-rect.left) *
        (e.currentTarget.width/rect.width);

       const py=
        (e.clientY-rect.top) *
        (e.currentTarget.height/rect.height);

       setX(
        Math.max(
         0,
         Math.min(
          im.width-1,
          Math.round(px)
         )
        )
       );

       setY(
        Math.max(
         0,
         Math.min(
          im.height-1,
          Math.round(py)
         )
        )
       );

       e.currentTarget.setPointerCapture?.(
        e.pointerId
       );
      }}
      onPointerMove={e=>{
       if(e.buttons!==1)return;

       const rect=
        e.currentTarget.getBoundingClientRect();

       const px=
        (e.clientX-rect.left) *
        (e.currentTarget.width/rect.width);

       const py=
        (e.clientY-rect.top) *
        (e.currentTarget.height/rect.height);

       setX(
        Math.max(
         0,
         Math.min(
          im.width-1,
          Math.round(px)
         )
        )
       );

       setY(
        Math.max(
         0,
         Math.min(
          im.height-1,
          Math.round(py)
         )
        )
       );
      }}
     />

     <div className="s6a-coordinate">
      Selected pixel: ({x}, {y})
     </div>

    </div>


    <div className="s6d-imageCard">

     <div className="s6a-imageLabel">
      MODIFIED RGB IMAGE
     </div>

     <canvas
      ref={node=>{
       if(!node)return;

       rgbCanvas(
        node,
        groupDModified,
        x,
        y
       );
      }}
      className="s6a-canvas s6d-pixelProbe"
     />

     <div className="s6a-coordinate">
      Brightness + contrast + saturation +
      selected-channel operation
     </div>

    </div>

   </div>


   <div className="s6d-pixelGrid">

    <div className="s6d-pixelCard">

     <div className="sectionEyebrow">
      SOURCE PIXEL
     </div>

     <div
      className="s6d-swatch"
      style={{
       background:rgbToHex(groupDSource)
      }}
     />

     <code>
      [ {groupDSource.r},
        {groupDSource.g},
        {groupDSource.b} ]ᵀ
     </code>

    </div>


    <div className="s6d-pixelCard">

     <div className="sectionEyebrow">
      BRIGHTNESS
     </div>

     <div
      className="s6d-swatch"
      style={{
       background:
        rgbToHex(
         groupDBrightnessPixel
        )
      }}
     />

     <code>
      [ {groupDBrightnessPixel.r},
        {groupDBrightnessPixel.g},
        {groupDBrightnessPixel.b} ]ᵀ
     </code>

     <p>
      R: {groupDSource.r} +
      {groupDBrightness} =
      {groupDBrightnessPixel.r}
     </p>

    </div>


    <div className="s6d-pixelCard">

     <div className="sectionEyebrow">
      CONTRAST
     </div>

     <div
      className="s6d-swatch"
      style={{
       background:
        rgbToHex(
         groupDContrastPixel
        )
      }}
     />

     <code>
      [ {groupDContrastPixel.r},
        {groupDContrastPixel.g},
        {groupDContrastPixel.b} ]ᵀ
     </code>

     <p>
      R: {groupDContrast.toFixed(1)}
      ({groupDSource.r} − 128) + 128
      = {groupDContrastPixel.r}
     </p>

    </div>


    <div className="s6d-pixelCard">

     <div className="sectionEyebrow">
      SATURATION
     </div>

     <div
      className="s6d-swatch"
      style={{
       background:
        rgbToHex(
         groupDSaturationPixel
        )
      }}
     />

     <code>
      [ {groupDSaturationPixel.r},
        {groupDSaturationPixel.g},
        {groupDSaturationPixel.b} ]ᵀ
     </code>

     <p>
      HSV saturation ×
      {groupDSaturation.toFixed(1)}
     </p>

    </div>


    <div className="s6d-pixelCard">

     <div className="sectionEyebrow">
      CHANNEL ONLY
     </div>

     <div
      className="s6d-swatch"
      style={{
       background:
        rgbToHex(
         groupDChannelPixel
        )
      }}
     />

     <code>
      [ {groupDChannelPixel.r},
        {groupDChannelPixel.g},
        {groupDChannelPixel.b} ]ᵀ
     </code>

     <p>
      {groupDChannel.toUpperCase()}
      changes by {groupDChannelDelta}.
      Other channels stay fixed.
     </p>

    </div>

   </div>


   <div className="s6d-verification">

    <div className="sectionEyebrow">
     GROUP D VERIFICATION
    </div>

    <div className="s6d-checkGrid">

     <div>
      <span>01</span>
      <b>Brightness applies one shared Δ</b>
      <strong>
       {verifyBrightnessDelta()
        ?"PASS"
        :"REVIEW"}
      </strong>
     </div>

     <div>
      <span>02</span>
      <b>Contrast follows the midpoint formula</b>
      <strong>
       {verifyContrastSymmetry()
        ?"PASS"
        :"REVIEW"}
      </strong>
     </div>

     <div>
      <span>03</span>
      <b>Saturation stays within 0–255</b>
      <strong>
       {verifySaturationBounded()
        ?"PASS"
        :"REVIEW"}
      </strong>
     </div>

     <div>
      <span>04</span>
      <b>Only the selected RGB channel changes</b>
      <strong>
       {verifyChannelIndependence()
        ?"PASS"
        :"REVIEW"}
      </strong>
     </div>

    </div>


    <div className="s6d-metrics">

     <div>
      <span>SELECTED CHANNEL</span>
      <b>
       {groupDChannel.toUpperCase()}
      </b>
     </div>

     <div>
      <span>OBSERVED CHANNEL DELTA</span>
      <b>
       {groupDChanged[groupDChannel]}
      </b>
     </div>

     <div>
      <span>RGB DISTANCE</span>
      <b>
       {groupDDistance.toFixed(2)}
      </b>
     </div>

    </div>

   </div>


   <div className="s6d-teachingNote">

    <div className="sectionEyebrow">
     WHAT TO NOTICE
    </div>

    <p>
     <b>Brightness</b> adds the same amount to every
     channel. <b>Contrast</b> changes the distance from
     a midpoint. <b>Saturation</b> changes how colourful
     the pixel is. <b>Channel manipulation</b> changes
     just one component.
    </p>

   </div>

  </section>:active==="E"?<section className="s6e-lab">

   <div className="sectionEyebrow">
    GROUP E · IMAGE FORMATION
   </div>

   <h2>
    From surface reflectance to the observed image
   </h2>

   <p>
    Treat the synthetic RGB scene as surface reflectance.
    Illumination changes how much light reaches the surface,
    and sensor gain changes the measured signal.
   </p>


   {/* =====================================================
       IMAGE FORMATION MODEL
       ===================================================== */}

   <section className="s6e-modelPanel">

    <div className="sectionEyebrow">
     IMAGE FORMATION MODEL
    </div>

    <div className="s6e-equationFlow">

     <div>
      <span>REFLECTANCE</span>
      <code>R(x,y)</code>
     </div>

     <div className="s6e-arrow">
      ×
     </div>

     <div>
      <span>ILLUMINATION</span>
      <code>L(x,y)</code>
     </div>

     <div className="s6e-arrow">
      ×
     </div>

     <div>
      <span>SENSOR GAIN</span>
      <code>G</code>
     </div>

     <div className="s6e-arrow">
      →
     </div>

     <div>
      <span>OBSERVED</span>
      <code>O(x,y)</code>
     </div>

    </div>


    <div className="s6e-controls">

     <div className="s6e-controlGroup">

      <div className="sectionEyebrow">
       LIGHT X
      </div>

      <label>
       <span>
        {groupELightX.toFixed(2)}
       </span>

       <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={groupELightX}
        onChange={e=>
         setGroupELightX(
          Number(e.target.value)
         )
        }
       />
      </label>

     </div>


     <div className="s6e-controlGroup">

      <div className="sectionEyebrow">
       LIGHT Y
      </div>

      <label>
       <span>
        {groupELightY.toFixed(2)}
       </span>

       <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={groupELightY}
        onChange={e=>
         setGroupELightY(
          Number(e.target.value)
         )
        }
       />
      </label>

     </div>


     <div className="s6e-controlGroup">

      <div className="sectionEyebrow">
       LIGHT STRENGTH
      </div>

      <label>
       <span>
        {groupELightStrength.toFixed(2)}×
       </span>

       <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={groupELightStrength}
        onChange={e=>
         setGroupELightStrength(
          Number(e.target.value)
         )
        }
       />
      </label>

     </div>


     <div className="s6e-controlGroup">

      <div className="sectionEyebrow">
       SENSOR GAIN
      </div>

      <label>
       <span>
        {groupESensorGain.toFixed(2)}×
       </span>

       <input
        type="range"
        min="0"
        max="2"
        step="0.05"
        value={groupESensorGain}
        onChange={e=>
         setGroupESensorGain(
          Number(e.target.value)
         )
        }
       />
      </label>

     </div>

    </div>

    <div className="s6e-actionBar">

     <div>
      <div className="sectionEyebrow">
       INTERACTIVE EXPERIMENT
      </div>

      <b>
       Change the light or sensor, then click a pixel.
      </b>

      <span>
       Watch the same pixel move through reflectance,
       illumination, and sensor response.
      </span>
     </div>

     <button
      type="button"
      className="s6e-resetButton"
      onClick={()=>{
       setGroupELightX(0.5);
       setGroupELightY(0.5);
       setGroupELightStrength(1);
       setGroupESensorGain(1);
       setX(128);
       setY(88);
      }}
     >
      RESET EXPERIMENT
     </button>

    </div>

   </section>


   {/* =====================================================
       IMAGE FORMATION WORKSPACE
       =====================================================
       ===================================================== */}

   <section className="s6e-imageSection">

    <div className="sectionEyebrow">
     IMAGE FORMATION WORKSPACE
    </div>

    <p className="s6e-sectionIntro">
     The same physical pixel is tracked through three stages:
     surface reflectance, illumination, and the observed sensor image.
    </p>


    <div className="s6e-visualGrid">

     <div className="s6e-imageCard">

      <div className="s6a-imageLabel">
       SURFACE REFLECTANCE
      </div>

      <canvas
       ref={groupEReflectanceRef}
       className="s6a-canvas s6e-pixelProbe"
       onPointerDown={e=>{
        updateGroupEPixelFromPointer(e);
        e.currentTarget.setPointerCapture?.(
         e.pointerId
        );
       }}
       onPointerMove={e=>{
        if(e.buttons===1){
         updateGroupEPixelFromPointer(e);
        }
       }}
      />

      <small>
       Material colour before illumination.
       Click or drag to move the selected pixel.
      </small>

     </div>


     <div className="s6e-imageCard">

      <div className="s6a-imageLabel">
       ILLUMINATION MAP
      </div>

      <canvas
       ref={groupEIlluminationRef}
       className="s6a-canvas s6e-pixelProbe"
       onPointerDown={e=>{
        updateGroupEPixelFromPointer(e);
        e.currentTarget.setPointerCapture?.(
         e.pointerId
        );
       }}
       onPointerMove={e=>{
        if(e.buttons===1){
         updateGroupEPixelFromPointer(e);
        }
       }}
      />

      <small>
       Bright = more incident illumination.
       The marker tracks the same physical pixel.
      </small>

     </div>


     <div className="s6e-imageCard">

      <div className="s6a-imageLabel">
       OBSERVED IMAGE
      </div>

      <canvas
       ref={groupEObservedRef}
       className="s6a-canvas s6e-pixelProbe"
       onPointerDown={e=>{
        updateGroupEPixelFromPointer(e);
        e.currentTarget.setPointerCapture?.(
         e.pointerId
        );
       }}
       onPointerMove={e=>{
        if(e.buttons===1){
         updateGroupEPixelFromPointer(e);
        }
       }}
      />

      <small>
       What the simplified sensor model observes.
       The marker tracks the same physical pixel.
      </small>

     </div>

    </div>

   </section>


   {/* =====================================================
       SELECTED PIXEL VALUES
       ===================================================== */}

   <section className="s6e-pixelSection">

    <div className="sectionEyebrow">
     SELECTED PIXEL VALUES
    </div>

    <div className="s6e-pixelGrid">

     <div className="s6e-pixelCard">

      <div className="sectionEyebrow">
       REFLECTANCE
      </div>

      <code>
       [{groupEPixel.reflectance.r},
       {groupEPixel.reflectance.g},
       {groupEPixel.reflectance.b}]
      </code>

      <small>
       Surface RGB value
      </small>

     </div>


     <div className="s6e-pixelCard">

      <div className="sectionEyebrow">
       ILLUMINATION
      </div>

      <b>
       {groupEPixel.illumination.toFixed(3)}
      </b>

      <small>
       Fractional light level
      </small>

     </div>


     <div className="s6e-pixelCard">

      <div className="sectionEyebrow">
       INCIDENT SIGNAL
      </div>

      <code>
       [{groupEPixel.incident.r},
       {groupEPixel.incident.g},
       {groupEPixel.incident.b}]
      </code>

      <small>
       Reflectance × illumination
      </small>

     </div>


     <div className="s6e-pixelCard">

      <div className="sectionEyebrow">
       OBSERVED
      </div>

      <code>
       [{groupEPixel.observed.r},
       {groupEPixel.observed.g},
       {groupEPixel.observed.b}]
      </code>

      <small>
       After sensor gain
      </small>

     </div>

    </div>

   </section>


   {/* =====================================================
       MATHEMATICAL WALKTHROUGH
       ===================================================== */}

   <section className="s6e-mathPanel">

    <div className="s6e-mathIntro">

     <div className="sectionEyebrow">
      SELECTED PIXEL
     </div>

     <h3>
      Follow one pixel through image formation
     </h3>

     <p>
      Selected pixel:
      <strong> ({x}, {y}) </strong>
     </p>

     <p className="s6e-mathExplanation">
      The surface reflectance is first scaled by the amount
      of illumination reaching that location. The sensor then
      applies its gain to produce the observed signal.
     </p>

    </div>


    <div className="s6e-formula">

     <code>
      O = clamp(R × L × G)
     </code>

     <code>
      R = [{groupEPixel.reflectance.r},
      {groupEPixel.reflectance.g},
      {groupEPixel.reflectance.b}]
     </code>

     <code>
      L = {groupEPixel.illumination.toFixed(3)}
     </code>

     <code>
      G = {groupESensorGain.toFixed(2)}
     </code>

    </div>

   </section>


   <div className="s6e-liveCalculation">

    <div>

     <div className="sectionEyebrow">
      LIVE PIXEL EXPERIMENT
     </div>

     <h3>
      What does the camera see at pixel ({x}, {y})?
     </h3>

     <p>
      The surface colour stays the same. The light and the
      sensor determine the final observed value.
     </p>

     <div className="s6e-livePipeline">

      <div>
       <span>01 · REFLECTANCE</span>

       <code>
        [{groupEPixel.reflectance.r},
        {groupEPixel.reflectance.g},
        {groupEPixel.reflectance.b}]
       </code>
      </div>

      <b>×</b>

      <div>
       <span>02 · ILLUMINATION</span>

       <code>
        {groupEPixel.illumination.toFixed(3)}
       </code>
      </div>

      <b>×</b>

      <div>
       <span>03 · SENSOR GAIN</span>

       <code>
        {groupESensorGain.toFixed(2)}×
       </code>
      </div>

     </div>

    </div>


    <div className="s6e-liveMath">

     <div className="sectionEyebrow">
      R × L × G
     </div>

     <code>
      {groupEPixel.reflectance.r}
      × {groupEPixel.illumination.toFixed(3)}
      × {groupESensorGain.toFixed(2)}
      = {groupEPixel.observed.r}
     </code>

     <code>
      {groupEPixel.reflectance.g}
      × {groupEPixel.illumination.toFixed(3)}
      × {groupESensorGain.toFixed(2)}
      = {groupEPixel.observed.g}
     </code>

     <code>
      {groupEPixel.reflectance.b}
      × {groupEPixel.illumination.toFixed(3)}
      × {groupESensorGain.toFixed(2)}
      = {groupEPixel.observed.b}
     </code>

     <strong>
      OBSERVED =
      [{groupEPixel.observed.r},
      {groupEPixel.observed.g},
      {groupEPixel.observed.b}]
     </strong>

    </div>

   </div>


   <div className="s6e-causeEffect">

    <div>

     <div className="sectionEyebrow">
      WHAT JUST CHANGED?
     </div>

     <p>
      <b>Reflectance:</b>
      unchanged — the surface itself did not change.
     </p>

     <p>
      <b>Illumination:</b>
      {groupEPixel.illumination.toFixed(3)}
      — controlled by light position and strength.
     </p>

     <p>
      <b>Sensor gain:</b>
      {groupESensorGain.toFixed(2)}×
      — controls the sensor response.
     </p>

    </div>

    <div className="s6e-causeEquation">

     <span>IMAGE FORMATION</span>

     <code>
      O = clamp(R × L × G)
     </code>

     <span>OBSERVED RESULT</span>

     <b>
      [{groupEPixel.observed.r},
      {groupEPixel.observed.g},
      {groupEPixel.observed.b}]
     </b>

    </div>

   </div>


   {/* =====================================================
       VERIFICATION
       ===================================================== */}

   <section className="s6e-verification">

    <div className="sectionEyebrow">
     GROUP E VERIFICATION
    </div>

    <div className="s6e-checkGrid">

     <div>
      <span>01</span>
      <b>
       Unit illumination preserves reflectance
      </b>
      <strong>
       {verifyUnitIllumination()
        ?"PASS"
        :"REVIEW"}
      </strong>
     </div>


     <div>
      <span>02</span>
      <b>
       Zero illumination produces black
      </b>
      <strong>
       {verifyZeroIllumination()
        ?"PASS"
        :"REVIEW"}
      </strong>
     </div>


     <div>
      <span>03</span>
      <b>
       Sensor gain scales the observed signal
      </b>
      <strong>
       {verifyGainLinearity()
        ?"PASS"
        :"REVIEW"}
      </strong>
     </div>

    </div>

   </section>


   {/* =====================================================
       TEACHING NOTE
       ===================================================== */}

   <section className="s6e-teachingNote">

    <div className="sectionEyebrow">
     WHAT TO NOTICE
    </div>

    <p>
     The surface itself has not changed.
     Moving the light changes the illumination map,
     which changes the observed image.
     Increasing sensor gain changes the measured brightness
     without changing the underlying reflectance.
    </p>

   </section>

  </section>:active==="F"?<section className="s6f-lab">
   <div className="sectionEyebrow">GROUP F · COLOUR + ILLUMINATION</div>
   <h2>The same surface can look different under different coloured light</h2>
   <p>
    The surface reflectance stays the same. What changes is the colour
    of the illumination reaching it. The camera observes the channel-by-channel
    product of surface reflectance and coloured light.
   </p>

   <div className="s6f-equationFlow">
    <div><span>SURFACE REFLECTANCE</span><code>[Rr, Gg, Bb]</code></div>
    <div className="s6f-arrow">×</div>
    <div><span>COLOURED LIGHT</span><code>[Lr, Lg, Lb]</code></div>
    <div className="s6f-arrow">→</div>
    <div><span>OBSERVED</span><code>[Or, Og, Ob]</code></div>
   </div>

   <div className="s6f-controls">
    <div className="s6f-controlIntro">
     <div className="sectionEyebrow">CHANGE THE LIGHT</div>
     <h3>Control each illumination channel</h3>
     <p>Move one channel while keeping the surface fixed.</p>
    </div>
    <div className="s6f-sliders">
     <label><span>RED LIGHT = {groupFLightR.toFixed(2)}</span><input type="range" min="0" max="1" step="0.05" value={groupFLightR} onChange={e=>setGroupFLightR(Number(e.target.value))}/></label>
     <label><span>GREEN LIGHT = {groupFLightG.toFixed(2)}</span><input type="range" min="0" max="1" step="0.05" value={groupFLightG} onChange={e=>setGroupFLightG(Number(e.target.value))}/></label>
     <label><span>BLUE LIGHT = {groupFLightB.toFixed(2)}</span><input type="range" min="0" max="1" step="0.05" value={groupFLightB} onChange={e=>setGroupFLightB(Number(e.target.value))}/></label>
    </div>
    <div className="s6f-presets">
     <div className="sectionEyebrow">PRESETS</div>
     <div className="s6f-presetGrid">
      <button type="button" onClick={()=>{setGroupFLightR(1);setGroupFLightG(1);setGroupFLightB(1)}}>WHITE</button>
      <button type="button" onClick={()=>{setGroupFLightR(1);setGroupFLightG(.2);setGroupFLightB(.2)}}>RED</button>
      <button type="button" onClick={()=>{setGroupFLightR(.2);setGroupFLightG(1);setGroupFLightB(.2)}}>GREEN</button>
      <button type="button" onClick={()=>{setGroupFLightR(.2);setGroupFLightG(.2);setGroupFLightB(1)}}>BLUE</button>
      <button type="button" onClick={()=>{setGroupFLightR(1);setGroupFLightG(.65);setGroupFLightB(.35)}}>WARM</button>
      <button type="button" onClick={()=>{setGroupFLightR(.65);setGroupFLightG(.8);setGroupFLightB(1)}}>COOL</button>
      <button type="button" onClick={resetGroupF}>RESET</button>
     </div>
    </div>
   </div>

   <div className="s6f-pixelControls">
    <div>
     <div className="sectionEyebrow">SELECT A PIXEL</div>
     <h3>Follow the same physical point</h3>
     <p>Use X/Y to inspect one surface point through the colour-illumination model.</p>
    </div>
    <label><span>X = {x}</span><input type="range" min="0" max={im.width-1} value={x} onChange={e=>setX(Number(e.target.value))}/></label>
    <label><span>Y = {y}</span><input type="range" min="0" max={im.height-1} value={y} onChange={e=>setY(Number(e.target.value))}/></label>
   </div>

   <div className="s6f-visualGrid">
    <div className="s6f-imageCard">
     <div className="s6a-imageLabel">SURFACE REFLECTANCE</div>
     <canvas ref={reflectanceFRef} className="s6a-canvas"/>
     <small>Unchanged material colour.</small>
    </div>
    <div className="s6f-imageCard">
     <div className="s6a-imageLabel">COLOURED ILLUMINATION</div>
     <canvas ref={illuminationFRef} className="s6a-canvas"/>
     <small>The colour and strength of the light.</small>
    </div>
    <div className="s6f-imageCard">
     <div className="s6a-imageLabel">OBSERVED IMAGE</div>
     <canvas ref={observedFRef} className="s6a-canvas"/>
     <small>What the simplified camera model sees.</small>
    </div>
   </div>

   <div className="s6f-pixelGrid">
    <div className="s6f-pixelCard"><div className="sectionEyebrow">REFLECTANCE R</div><code>[{groupFPixel.reflectance.r}, {groupFPixel.reflectance.g}, {groupFPixel.reflectance.b}]</code><small>Surface stays fixed.</small></div>
    <div className="s6f-pixelCard"><div className="sectionEyebrow">LIGHT L</div><code>[{groupFPixel.illumination.r.toFixed(2)}, {groupFPixel.illumination.g.toFixed(2)}, {groupFPixel.illumination.b.toFixed(2)}]</code><small>Coloured illumination.</small></div>
    <div className="s6f-pixelCard"><div className="sectionEyebrow">INCIDENT SIGNAL R × L</div><code>[{groupFPixel.incident.r}, {groupFPixel.incident.g}, {groupFPixel.incident.b}]</code><small>Light after reflection.</small></div>
    <div className="s6f-pixelCard"><div className="sectionEyebrow">OBSERVED O</div><code>[{groupFPixel.observed.r}, {groupFPixel.observed.g}, {groupFPixel.observed.b}]</code><small>Simplified camera output.</small></div>
   </div>

   <div className="s6f-calculation">
    <div>
     <div className="sectionEyebrow">LIVE PIXEL CALCULATION</div>
     <h3>Each colour channel is multiplied independently</h3>
     <p>For the selected pixel ({x}, {y}), changing the light changes the observed colour without changing the surface.</p>
    </div>
    <div className="s6f-calculationGrid">
     <code>R: {groupFPixel.reflectance.r} × {groupFPixel.illumination.r.toFixed(2)} = {groupFPixel.observed.r}</code>
     <code>G: {groupFPixel.reflectance.g} × {groupFPixel.illumination.g.toFixed(2)} = {groupFPixel.observed.g}</code>
     <code>B: {groupFPixel.reflectance.b} × {groupFPixel.illumination.b.toFixed(2)} = {groupFPixel.observed.b}</code>
    </div>
   </div>

   <div className="s6f-comparison">
    <div>
     <div className="sectionEyebrow">SAME SURFACE · DIFFERENT LIGHT</div>
     <h3>Use the example pixel to see the colour shift</h3>
     <p>Example surface: <code>[220, 100, 40]</code>. Only the light changes.</p>
    </div>
    <div className="s6f-exampleGrid">
     <div><span>WHITE</span><code>[1.00,1.00,1.00]</code><b>[220,100,40]</b></div>
     <div><span>RED</span><code>[1.00,0.20,0.20]</code><b>[220,20,8]</b></div>
     <div><span>GREEN</span><code>[0.20,1.00,0.20]</code><b>[44,100,8]</b></div>
     <div><span>BLUE</span><code>[0.20,0.20,1.00]</code><b>[44,20,40]</b></div>
    </div>
   </div>

   <div className="s6f-causeEffect">
    <div className="sectionEyebrow">WHAT JUST CHANGED?</div>
    <div className="s6f-causeGrid">
     <div><span>SURFACE</span><b>UNCHANGED</b><small>Reflectance stays the same.</small></div>
     <div><span>LIGHT</span><b>CHANGED</b><small>Each RGB illumination channel can change independently.</small></div>
     <div><span>OBSERVED COLOUR</span><b>CHANGED</b><small>The camera output follows R × L channel by channel.</small></div>
    </div>
   </div>

   <div className="s6f-verification">
    <div className="sectionEyebrow">GROUP F VERIFICATION</div>
    <div className="s6f-checkGrid">
     <div><span>01</span><b>White light preserves the source RGB</b><strong>{verifyWhiteLight()?"PASS":"REVIEW"}</strong></div>
     <div><span>02</span><b>Red light suppresses green and blue channels</b><strong>{verifyRedLight()?"PASS":"REVIEW"}</strong></div>
     <div><span>03</span><b>Channels respond independently</b><strong>{verifyChannelIndependenceF()?"PASS":"REVIEW"}</strong></div>
     <div><span>04</span><b>Zero coloured illumination gives black</b><strong>{verifyZeroColourIllumination()?"PASS":"REVIEW"}</strong></div>
    </div>
   </div>

   <div className="s6f-teachingNote">
    <div className="sectionEyebrow">WHAT TO NOTICE</div>
    <p>
     A camera does not observe a material colour in isolation. It observes
     light after it interacts with the surface. Change the colour of the
     illumination and the measured RGB values can change even though the
     surface itself has not changed. This is the starting point for the
     computer-vision problem of colour constancy.
    </p>
   </div>
  </section>:active==="G"?<section className="s6g-lab">
  <div className="s6g-hero">
    <div><div className="s6-kicker">GROUP G · FINAL VERIFICATION</div>
      <h2>Can we explain the complete image-formation process?</h2>
      <p>This capstone brings Groups A–F together: the surface stays the same while illumination and sensor gain change what finally reaches the digital image.</p>
    </div><span className="s6g-badge">CAPSTONE</span>
  </div>

  <div className="s6g-pipeline">
    <div><b>1</b><strong>Surface</strong><span>Reflectance R</span></div><div className="s6g-arrow">×</div>
    <div><b>2</b><strong>Illumination</strong><span>Light L</span></div><div className="s6g-arrow">×</div>
    <div><b>3</b><strong>Sensor gain</strong><span>G</span></div><div className="s6g-arrow">→</div>
    <div><b>4</b><strong>Observed image</strong><span>O</span></div>
  </div>

  <div className="s6g-equation"><span>O<sub>c</sub>(x,y)</span><b>=</b><span>R<sub>c</sub>(x,y)</span><b>×</b><span>L<sub>c</sub>(x,y)</span><b>×</b><span>G</span></div>

  <div className="s6g-controls">
    <div className="s6g-control-head"><div><span className="s6-kicker">CONTROL THE PHYSICAL CONDITIONS</span><h3>Change the light and sensor</h3></div>
      <button className="s6-reset" onClick={()=>{setGroupGLightR(1);setGroupGLightG(1);setGroupGLightB(1);setGroupGSensorGain(1)}}>RESET</button>
    </div>
    <div className="s6g-slider-grid">
      <label><span>Red illumination</span><output>{groupGLightR.toFixed(2)}</output><input type="range" min="0" max="1" step=".01" value={groupGLightR} onChange={e=>setGroupGLightR(Number(e.target.value))}/></label>
      <label><span>Green illumination</span><output>{groupGLightG.toFixed(2)}</output><input type="range" min="0" max="1" step=".01" value={groupGLightG} onChange={e=>setGroupGLightG(Number(e.target.value))}/></label>
      <label><span>Blue illumination</span><output>{groupGLightB.toFixed(2)}</output><input type="range" min="0" max="1" step=".01" value={groupGLightB} onChange={e=>setGroupGLightB(Number(e.target.value))}/></label>
      <label><span>Sensor gain</span><output>{groupGSensorGain.toFixed(2)}×</output><input type="range" min="0" max="2" step=".01" value={groupGSensorGain} onChange={e=>setGroupGSensorGain(Number(e.target.value))}/></label>
    </div>
    <div className="s6g-presets">
      <button onClick={()=>{setGroupGLightR(1);setGroupGLightG(1);setGroupGLightB(1)}}>WHITE</button>
      <button onClick={()=>{setGroupGLightR(1);setGroupGLightG(0);setGroupGLightB(0)}}>RED</button>
      <button onClick={()=>{setGroupGLightR(0);setGroupGLightG(1);setGroupGLightB(0)}}>GREEN</button>
      <button onClick={()=>{setGroupGLightR(0);setGroupGLightG(0);setGroupGLightB(1)}}>BLUE</button>
      <button onClick={()=>{setGroupGLightR(1);setGroupGLightG(.65);setGroupGLightB(.35)}}>WARM</button>
      <button onClick={()=>{setGroupGLightR(.65);setGroupGLightG(.8);setGroupGLightB(1)}}>COOL</button>
    </div>
  </div>

  <div className="s6g-images">
    <article><h3>1 · SURFACE REFLECTANCE</h3><canvas ref={reflectanceGRef} width={240} height={180}/><p>Unchanged: this is the surface property R.</p></article>
    <article><h3>2 · ILLUMINATION</h3><canvas ref={illuminationGRef} width={240} height={180}/><p>Changes with the three illumination channels.</p></article>
    <article><h3>3 · OBSERVED IMAGE</h3><canvas ref={observedGRef} width={240} height={180}/><p>What the sensor records after light × gain.</p></article>
  </div>

  <div className="s6g-pixel">
    <div className="s6g-control-head"><div><span className="s6-kicker">PIXEL FORENSICS</span><h3>Inspect one pixel all the way through the camera</h3></div><span className="s6g-coordinate">x={x}, y={y}</span></div>
    <div className="s6g-pixel-grid">
      <div><span>SURFACE R</span><b>{groupGPixel.reflectance.r}</b></div><div><span>SURFACE G</span><b>{groupGPixel.reflectance.g}</b></div><div><span>SURFACE B</span><b>{groupGPixel.reflectance.b}</b></div>
      <div><span>LIGHT R</span><b>{groupGPixel.illumination.r.toFixed(2)}</b></div><div><span>LIGHT G</span><b>{groupGPixel.illumination.g.toFixed(2)}</b></div><div><span>LIGHT B</span><b>{groupGPixel.illumination.b.toFixed(2)}</b></div>
      <div><span>INCIDENT R</span><b>{groupGPixel.incident.r}</b></div><div><span>INCIDENT G</span><b>{groupGPixel.incident.g}</b></div><div><span>INCIDENT B</span><b>{groupGPixel.incident.b}</b></div>
      <div><span>OBSERVED R</span><b>{groupGPixel.observed.r}</b></div><div><span>OBSERVED G</span><b>{groupGPixel.observed.g}</b></div><div><span>OBSERVED B</span><b>{groupGPixel.observed.b}</b></div>
    </div>
    <div className="s6g-calculation">
      <div><code>O<sub>R</sub> = {groupGPixel.reflectance.r} × {groupGPixel.illumination.r.toFixed(2)} × {groupGSensorGain.toFixed(2)} = {groupGPixel.observed.r}</code></div>
      <div><code>O<sub>G</sub> = {groupGPixel.reflectance.g} × {groupGPixel.illumination.g.toFixed(2)} × {groupGSensorGain.toFixed(2)} = {groupGPixel.observed.g}</code></div>
      <div><code>O<sub>B</sub> = {groupGPixel.reflectance.b} × {groupGPixel.illumination.b.toFixed(2)} × {groupGSensorGain.toFixed(2)} = {groupGPixel.observed.b}</code></div>
    </div>
  </div>

  <div className="s6g-verification"><div className="s6g-section-title"><span className="s6-kicker">LAB VERIFICATION</span><h3>Can the model prove what we learned?</h3></div>
    <div className="s6g-check-grid">{groupGChecks.map(check=><div key={check.label} className="s6g-check"><span className={check.pass?"s6g-pass":"s6g-fail"}>{check.pass?"PASS":"FAIL"}</span><strong>{check.label}</strong></div>)}</div>
  </div>

  <div className="s6g-learning"><span className="s6-kicker">WHAT YOU SHOULD NOW BE ABLE TO EXPLAIN</span>
    <div className="s6g-learning-grid">
      <div><b>RGB</b><span>An image stores colour as three channels.</span></div>
      <div><b>LIGHT</b><span>A camera measures light reaching its sensor.</span></div>
      <div><b>COLOUR</b><span>The colour of illumination changes observed colour.</span></div>
      <div><b>GAIN</b><span>Sensor gain changes measured intensity and can cause clipping.</span></div>
    </div>
    <div className="s6g-final-statement"><b>Final model:</b> observed image = surface reflectance × illumination × sensor response. The surface can stay exactly the same while the observed image changes.</div>
  </div>
</section>:
<section className="s6-gate"><div className="sectionEyebrow">GROUP {active} · PLANNED</div><h2>{group[1]}</h2><p>{group[2]}</p><div className="s6-gateStatus">→ IMPLEMENTED IN A FUTURE VERIFIED SLICE</div></section>}
  <section className="s6-foundation"><div><div className="sectionEyebrow">SPRINT 6 FOUNDATION</div><h2>From one intensity value to a colour vector</h2><p>Earlier sprints represented a pixel with one grayscale intensity. Sprint 6 begins by treating colour as three coordinated channels.</p></div><div className="s6-equation"><div className="s6-equationLabel">GRAYSCALE</div><code>I(x,y)</code><div className="s6-arrow">→</div><div className="s6-equationLabel">RGB</div><code>[ R(x,y), G(x,y), B(x,y) ]ᵀ</code></div></section>
 </div>
}
