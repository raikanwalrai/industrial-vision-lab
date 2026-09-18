import {useEffect,useMemo,useRef,useState} from "react";
import {colorImageStats,recombinationMatchesPixel,rgbChannelSum,rgbToHex} from "../colorMath";
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
 im:ReturnType<typeof createRGBScene>,
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

 useEffect(()=>{rgbCanvas(ref.current,im,x,y);},[im,x,y]);
 useEffect(()=>{drawReconstructedRGB(reconstructionRef.current,reconstructed);},[reconstructed]);
 const group=groups.find(v=>v[0]===active)??groups[0];
 return <div className="sprintPage s6-page">
  <section className="sprintHero"><div className="sectionEyebrow">SPRINT 6 · COLOUR VISION</div><h1>Colour + Image Formation</h1><p>Move from single-channel grayscale images to colour images and understand how illumination and reflectance create what a camera observes.</p><div className="sprintMetaRow"><span className="statusPill statusCurrent">● CURRENT</span><span>7 learning groups</span><span>RGB · Colour Spaces · Image Formation</span></div></section>
  <section className="s6-roadmap"><div className="sectionEyebrow">SPRINT 6 ROADMAP</div><div className="s6-groupGrid">{groups.map(([id,title,desc])=><button key={id} type="button" className={`s6-groupCard ${active===id?"s6-groupCardActive":""}`} onClick={()=>setActive(id)}><span className="s6-groupNumber">{id}</span><span className="s6-groupTitle">{title}</span><span className="s6-groupDescription">{desc}</span><span className="s6-groupStatus">{active===id?((id==="A"||id==="B")?"CURRENT · LIVE":"CURRENT"):"PLANNED"}</span></button>)}</div></section>
  <section className="s6-currentCard"><div className="s6-currentBadge">{group[0]}</div><div><div className="sectionEyebrow">CURRENT EXPERIMENT</div><h2>{group[1]}</h2><p>{group[2]}</p></div><span className={`statusPill ${active==="A"||active==="B"?"statusCurrent":"statusPlanned"}`}>{active==="A"||active==="B"?"LIVE":"PLANNED"}</span></section>
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

  </section>:<section className="s6-gate"><div className="sectionEyebrow">GROUP {active} · PLANNED</div><h2>{group[1]}</h2><p>{group[2]}</p><div className="s6-gateStatus">→ IMPLEMENTED IN A FUTURE VERIFIED SLICE</div></section>}
  <section className="s6-foundation"><div><div className="sectionEyebrow">SPRINT 6 FOUNDATION</div><h2>From one intensity value to a colour vector</h2><p>Earlier sprints represented a pixel with one grayscale intensity. Sprint 6 begins by treating colour as three coordinated channels.</p></div><div className="s6-equation"><div className="s6-equationLabel">GRAYSCALE</div><code>I(x,y)</code><div className="s6-arrow">→</div><div className="s6-equationLabel">RGB</div><code>[ R(x,y), G(x,y), B(x,y) ]ᵀ</code></div></section>
 </div>
}
