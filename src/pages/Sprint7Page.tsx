import { useEffect, useMemo, useRef, useState } from "react";
import { makeScene } from "../imageScenes";
import { normalizeForDisplay } from "../math";
import { derivativeDisplayImages, derivativePixel, verifyConstantImageDerivatives, verifyRampDerivative, type DerivativeMethod } from "../derivativeMath";

type ImageLike={width:number;height:number;data:Float32Array};

function drawGray(canvas:HTMLCanvasElement|null,image:ImageLike){
  if(!canvas)return;
  canvas.width=image.width; canvas.height=image.height;
  const ctx=canvas.getContext("2d"); if(!ctx)return;
  const id=ctx.createImageData(image.width,image.height);
  for(let i=0;i<image.data.length;i++){
    const v=Math.max(0,Math.min(255,Math.round(image.data[i])));
    id.data[i*4]=v; id.data[i*4+1]=v; id.data[i*4+2]=v; id.data[i*4+3]=255;
  }
  ctx.putImageData(id,0,0);
}

function LabCanvas({label,image}:{label:string;image:ImageLike}){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>drawGray(ref.current,image),[image]);
  return <div className="s7a-imageCard"><div className="s7a-imageLabel">{label}</div><canvas ref={ref} className="s7a-canvas"/></div>;
}

export default function Sprint7Page(){
  const [method,setMethod]=useState<DerivativeMethod>("central");
  const [sceneName,setSceneName]=useState("step");
  const [x,setX]=useState(128),[y,setY]=useState(128);
  const image=useMemo(()=>makeScene(sceneName),[sceneName]);
  const display=useMemo(()=>derivativeDisplayImages(image,method),[image,method]);
  const pixel=useMemo(()=>derivativePixel(image,x,y,method),[image,x,y,method]);
  const sourceDisplay=useMemo(()=>normalizeForDisplay(image),[image]);
  const verification=[
    {label:"Constant image → zero derivatives",pass:verifyConstantImageDerivatives()},
    {label:"Horizontal ramp → Ix ≈ 1, Iy ≈ 0",pass:verifyRampDerivative()},
  ];

  return <main className="s7a-page">
    <section className="s7a-hero">
      <div className="sectionEyebrow">SPRINT 7 · GROUP A</div>
      <h1>Derivatives &amp; Gradients</h1>
      <p>An edge is a place where image intensity changes rapidly. This laboratory turns that idea into numbers.</p>
      <div className="s7a-meta"><span className="statusPill statusCurrent">● CURRENT</span><span>First derivatives</span><span>Gradient magnitude</span><span>Gradient orientation</span></div>
    </section>

    <section className="s7a-roadmap panel"><div className="sectionEyebrow">GROUP A LEARNING PATH</div>
      <div className="s7a-flow"><span>IMAGE</span><b>→</b><span>CHANGE IN X</span><b>→</b><span>CHANGE IN Y</span><b>→</b><span>GRADIENT</span><b>→</b><span>EDGE EVIDENCE</span></div>
    </section>

    <section className="s7a-controls panel">
      <div><div className="sectionEyebrow">EXPERIMENT CONTROLS</div><h2>Change the scene and derivative operator</h2>
      <p>Central difference shows the finite-difference idea. Sobel adds weighted smoothing while measuring directional change.</p></div>
      <label>IMAGE<select value={sceneName} onChange={e=>setSceneName(e.target.value)}>
        <option value="step">Step edge</option><option value="ramp">Horizontal ramp</option><option value="checker">Checkerboard</option><option value="corner">Corner</option><option value="shapes">Synthetic scene</option><option value="noisy">Noisy scene</option><option value="constant">Constant image</option>
      </select></label>
      <div className="s7a-methodButtons">
        <button className={method==="central"?"active":""} onClick={()=>setMethod("central")}>Central Difference</button>
        <button className={method==="sobel"?"active":""} onClick={()=>setMethod("sobel")}>Sobel</button>
      </div>
    </section>

    <section className="s7a-mainGrid">
      <div className="s7a-imageCard">
        <div className="s7a-imageLabel">INPUT IMAGE · CLICK TO PROBE</div>
        <canvas className="s7a-canvas s7a-clickable" ref={node=>{
          if(!node)return; drawGray(node,sourceDisplay);
          node.onpointerdown=e=>{
            const r=node.getBoundingClientRect();
            const px=Math.round(((e.clientX-r.left)/r.width)*(node.width-1));
            const py=Math.round(((e.clientY-r.top)/r.height)*(node.height-1));
            setX(Math.max(0,Math.min(node.width-1,px))); setY(Math.max(0,Math.min(node.height-1,py)));
          };
        }}/>
        <div className="s7a-coordinate">Selected pixel: ({x}, {y})</div>
      </div>
      <LabCanvas label="Ix · HORIZONTAL DERIVATIVE" image={display.ix}/>
      <LabCanvas label="Iy · VERTICAL DERIVATIVE" image={display.iy}/>
      <LabCanvas label="|∇I| · GRADIENT MAGNITUDE" image={display.magnitude}/>
      <LabCanvas label="θ · GRADIENT ORIENTATION" image={display.orientation}/>
    </section>

    <section className="s7a-equation panel"><div className="sectionEyebrow">THE MATHEMATICS</div><h2>From two directional changes to one gradient</h2>
      <div className="s7a-equationGrid">
        <div><code>I_x = ∂I/∂x</code><span>Horizontal intensity change.</span></div>
        <div><code>I_y = ∂I/∂y</code><span>Vertical intensity change.</span></div>
        <div><code>∇I = [ I_x, I_y ]ᵀ</code><span>The gradient points toward greatest increase.</span></div>
        <div><code>|∇I| = √(I_x² + I_y²)</code><span>Large magnitude means strong local change.</span></div>
        <div><code>θ = atan2(I_y, I_x)</code><span>Orientation of the gradient.</span></div>
      </div>
    </section>

    <section className="s7a-pixel panel"><div className="sectionEyebrow">PIXEL-BY-PIXEL INSPECTOR</div><h2>What happened at ({x}, {y})?</h2>
      <p>These are raw values. The images above are normalized separately for display, so visualization does not change the underlying calculation.</p>
      <div className="s7a-pixelGrid">
        <div><span>INPUT</span><b>{pixel.center.toFixed(2)}</b></div><div><span>Ix</span><b>{pixel.ix.toFixed(4)}</b></div><div><span>Iy</span><b>{pixel.iy.toFixed(4)}</b></div>
        <div><span>|∇I|</span><b>{pixel.magnitude.toFixed(4)}</b></div><div><span>θ (rad)</span><b>{pixel.orientation.toFixed(4)}</b></div><div><span>θ (deg)</span><b>{(pixel.orientation*180/Math.PI).toFixed(2)}°</b></div>
      </div>
    </section>

    <section className="s7a-finite panel"><div className="sectionEyebrow">FINITE-DIFFERENCE INTUITION</div><h2>The derivative compares nearby pixels</h2>
      <div className="s7a-finiteGrid">
        <div><code>Ix ≈ [ I(x+1,y) − I(x−1,y) ] / 2</code><p>Compare the pixel to its left and right neighbours.</p></div>
        <div><code>Iy ≈ [ I(x,y+1) − I(x,y−1) ] / 2</code><p>Compare the pixel to its upper and lower neighbours.</p></div>
      </div>
      <div className="s7a-takeaway"><b>KEY IDEA</b><span>A derivative filter asks how quickly brightness is changing here.</span></div>
    </section>

    <section className="s7a-verification panel"><div className="sectionEyebrow">GROUP A VERIFICATION</div>
      <div className="s7a-checkGrid">{verification.map((item,index)=><div key={item.label}><span>{String(index+1).padStart(2,"0")}</span><b>{item.label}</b><strong>{item.pass?"PASS":"REVIEW"}</strong></div>)}</div>
    </section>

    <section className="s7a-next panel"><div className="sectionEyebrow">GROUP A → GROUP B</div><h2>Next: second derivatives and the Laplacian</h2>
      <p>First derivatives tell us how intensity changes. Group B will measure change of change, leading to the Laplacian, zero crossings, and LoG.</p>
    </section>
  </main>;
}
