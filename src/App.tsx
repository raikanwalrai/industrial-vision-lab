import { useMemo, useState } from "react";
import { filters, stats as kernelStats, type Kernel } from "./filters";
import { makeScene, scenes, type GrayImage } from "./imageScenes";
import { convolve, normalizeForDisplay, patchCalculation, statsImage } from "./math";

function Canvas({image, label}:{image:GrayImage;label:string}) {
  const ref = (node: HTMLCanvasElement | null) => {
    if (!node) return;
    const c=node.getContext("2d")!, w=image.width,h=image.height;
    node.width=w; node.height=h;
    const d=normalizeForDisplay(image).data;
    const id=c.createImageData(w,h);
    for(let i=0;i<d.length;i++){const v=Math.round(Math.max(0,Math.min(255,d[i])));id.data[i*4]=v;id.data[i*4+1]=v;id.data[i*4+2]=v;id.data[i*4+3]=255;}
    c.putImageData(id,0,0);
  };
  return <div className="canvasWrap"><canvas ref={ref}/><div className="caption">{label}</div></div>;
}

function KernelGrid({kernel,onChange}:{kernel:number[][];onChange?:(k:number[][])=>void}) {
  return <div className="kernelGrid" style={{gridTemplateColumns:`repeat(${kernel[0].length},1fr)`}}>
    {kernel.flatMap((row,r)=>row.map((v,c)=>
      <input key={`${r}-${c}`} type="number" step="0.1" value={Number(v.toFixed(3))}
        onChange={e=>{if(!onChange)return; const k=kernel.map(a=>[...a]); k[r][c]=Number(e.target.value); onChange(k);}}/>
    ))}
  </div>;
}

export default function App(){
  const [sceneId,setSceneId]=useState("shapes");
  const [filterName,setFilterName]=useState("Box 3×3");
  const [custom,setCustom]=useState(false);
  const selected=filters.find(f=>f.name===filterName)!;
  const [kernel,setKernel]=useState(selected.values);
  const [normalize,setNormalize]=useState(true);
  const [pixel,setPixel]=useState({x:128,y:128});

  const source=useMemo(()=>makeScene(sceneId),[sceneId]);
  const activeKernel=custom?kernel:selected.values;
  const output=useMemo(()=>convolve(source,activeKernel),[source,activeKernel]);
  const ks=useMemo(()=>kernelStats(activeKernel),[activeKernel]);
  const si=statsImage(source), so=statsImage(output);
  const calc=patchCalculation(source,activeKernel,pixel.x,pixel.y);
  const scene=scenes.find(s=>s.id===sceneId)!;

  function chooseFilter(name:string){setFilterName(name); const f=filters.find(x=>x.name===name)!; setKernel(f.values); setCustom(false);}
  function normalizedKernel(k:number[][]){const s=k.flat().reduce((a,b)=>a+b,0); return s===0?k:k.map(r=>r.map(v=>v/s));}

  return <main>
    <header><div className="eyebrow">ID6004W · INDUSTRIAL VISION</div><h1>The Filter Zoo — Interactive Lab</h1>
      <p>Explore how the <b>same image</b> behaves under different filters, then design your own kernel.</p></header>

    <section className="controls">
      <label>IMAGE<select value={sceneId} onChange={e=>setSceneId(e.target.value)}>{scenes.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <div className="sceneNote">{scene.note}</div>
    </section>

    <section className="filterButtons">
      {filters.map(f=><button className={filterName===f.name&&!custom?"active":""} onClick={()=>chooseFilter(f.name)} key={f.name}>{f.name}</button>)}
      <button className={custom?"active":""} onClick={()=>setCustom(true)}>Custom kernel</button>
    </section>

    <section className="viewer">
      <Canvas image={source} label={`f(m,n) · ${scene.label}`}/>
      <div className="arrow">→</div>
      <Canvas image={output} label={`g(m,n) = f * h · ${custom?"Custom":selected.name}`}/>
    </section>

    <section className="workbench">
      <div className="panel">
        <h2>{custom?"Design your own kernel":selected.name}</h2>
        <p>{custom?"Edit the weights and watch the result update.":"Kernel and interpretation."}</p>
        <KernelGrid kernel={activeKernel} onChange={custom?setKernel:undefined}/>
        {custom && <label className="check"><input type="checkbox" checked={normalize} onChange={e=>{setNormalize(e.target.checked); if(e.target.checked)setKernel(normalizedKernel(kernel));}}/> normalize (divide by Σ weights)</label>}
        <div className="description">{custom?"A sum near 1 tends to preserve the mean/DC component; a sum near 0 rejects constant intensity.":selected.description}</div>
      </div>

      <div className="panel">
        <h2>Kernel mathematics</h2>
        <div className="metric"><span>Σ weights</span><b>{ks.sum.toFixed(4)}</b></div>
        <div className="metric"><span>Σ weights²</span><b>{ks.sumSq.toFixed(4)}</b></div>
        <div className="metric"><span>Noise gain √Σh²</span><b>{ks.noiseGain.toFixed(4)}</b></div>
        <div className="metric"><span>Minimum / maximum</span><b>{ks.min.toFixed(3)} / {ks.max.toFixed(3)}</b></div>
        <div className="metric"><span>Kernel size</span><b>{ks.size}</b></div>
      </div>

      <div className="panel">
        <h2>Image statistics</h2>
        <div className="metric"><span>Input min / max</span><b>{si.min.toFixed(1)} / {si.max.toFixed(1)}</b></div>
        <div className="metric"><span>Input mean</span><b>{si.mean.toFixed(2)}</b></div>
        <div className="metric"><span>Output min / max</span><b>{so.min.toFixed(1)} / {so.max.toFixed(1)}</b></div>
        <div className="metric"><span>Output mean</span><b>{so.mean.toFixed(2)}</b></div>
      </div>
    </section>

    <section className="calculation panel">
      <div className="calcHead"><div><h2>Show the calculation</h2><p>Select an output pixel. We explicitly show every multiplication and the final sum.</p></div>
      <div className="pixel"><label>x <input type="number" min="0" max="255" value={pixel.x} onChange={e=>setPixel(p=>({...p,x:Number(e.target.value)}))}/></label>
      <label>y <input type="number" min="0" max="255" value={pixel.y} onChange={e=>setPixel(p=>({...p,y:Number(e.target.value)}))}/></label></div></div>
      <div className="terms">{calc.terms.map((t,i)=><span key={i}>{t}</span>)}</div>
      <div className="result">Output at ({calc.x},{calc.y}) = <b>{calc.total.toFixed(2)}</b></div>
    </section>

    <section className="concept">
      <h2>Chapter 3 mental model</h2>
      <div className="flow"><span>IMAGE</span><b>×</b><span>KERNEL</span><b>→</b><span>FILTERED IMAGE</span></div>
      <p><b>Σh ≈ 1</b> commonly indicates smoothing/DC preservation. <b>Σh ≈ 0</b> is common for derivative and high-pass operators, but by itself does not prove the derivative order. The CNN connection comes next: classical filters are chosen by people; CNN filters are learned from data.</p>
    </section>

    <footer>Built as a Chapter 3 companion lab · Runs entirely in the browser · No image data is uploaded</footer>
  </main>
}
