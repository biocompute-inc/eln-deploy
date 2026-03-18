import { useState, useRef, useCallback, useEffect } from "react";

/* ── Fonts ── */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');`;

/* ── Design tokens ── */
const T = {
  bg:        "#F5F4F0",
  surface:   "#FFFFFF",
  sidebar:   "#111110",
  sidebarB:  "#1A1A18",
  border:    "#E2E0D8",
  borderDk:  "#2A2A28",
  text:      "#1A1A18",
  textMid:   "#666660",
  textLight: "#9A9A94",
  textInv:   "#F5F4F0",
  green:     "#1A5C3A",
  greenL:    "#EAF4EE",
  blue:      "#1D3A6B",
  blueL:     "#EAF0FA",
  purple:    "#6B2D5E",
  purpleL:   "#F5EAF3",
  amber:     "#B45309",
  amberL:    "#FEF3C7",
  red:       "#991B1B",
};

const BLOCK_COLORS = {
  text:        { fg: T.text,   bg: "#FAFAF8", bar: T.text   },
  protocol:    { fg: T.green,  bg: T.greenL,  bar: T.green  },
  observation: { fg: T.blue,   bg: T.blueL,   bar: T.blue   },
  measurement: { fg: T.purple, bg: T.purpleL, bar: T.purple },
  image:       { fg: T.amber,  bg: T.amberL,  bar: T.amber  },
  table:       { fg: "#1A3A4A",bg: "#EAF2F5", bar: "#1A3A4A"},
  tag:         { fg: "#444",   bg: "#F0F0EE", bar: "#888"   },
};

/* ── Sample data ── */
const EXPERIMENTS = [
  { id: "exp-1", title: "PCR Optimization — Round 3", tag: "PCR", status: "active",   updated: "Today, 11:42 AM",  blocks: 5, collaborators: ["SR","MT"] },
  { id: "exp-2", title: "Western Blot — p53 Antibody Titration", tag: "Western", status: "review",   updated: "Yesterday",         blocks: 8, collaborators: ["SR"] },
  { id: "exp-3", title: "CRISPR Screen — BRCA1 Guide RNA Library", tag: "CRISPR",  status: "complete", updated: "Mar 12",            blocks: 12, collaborators: ["SR","AB","MT"] },
  { id: "exp-4", title: "Cell Culture — HEK293T Passage 24", tag: "Culture", status: "active",   updated: "Today, 09:15 AM",  blocks: 3, collaborators: ["SR"] },
];

const TEMPLATES = [
  { id: "t1", name: "PCR Protocol",        icon: "›", color: T.green,  desc: "Master mix, thermocycler program, gel analysis", blocks: 6 },
  { id: "t2", name: "Western Blot",        icon: "◎", color: T.blue,   desc: "Sample prep, SDS-PAGE, transfer, antibody incubation", blocks: 9 },
  { id: "t3", name: "CRISPR Screen",       icon: "#", color: T.purple, desc: "Guide RNA design, transfection, selection, sequencing", blocks: 11 },
  { id: "t4", name: "Cell Culture",        icon: "⊞", color: T.amber,  desc: "Passage record, confluence, media change log", blocks: 5 },
  { id: "t5", name: "Cloning",             icon: "¶", color: "#2A5C6B",desc: "Digest, ligation, transformation, colony PCR", blocks: 8 },
  { id: "t6", name: "Flow Cytometry",      icon: "◈", color: "#5C2A1A",desc: "Panel design, gating strategy, acquisition settings", blocks: 7 },
];

const CANVAS_BLOCKS = [
  { id:"b1", type:"text",        x:48,  y:60,  w:310, content:"PCR Optimization — Round 3\n\nTrying lower annealing temp (58→54°C) after yesterday's faint bands. Also reducing extension time to 30s." },
  { id:"b2", type:"protocol",    x:400, y:48,  w:300, steps:[{id:1,text:"Prepare master mix (25µL total)",done:true},{id:2,text:"Add 1µL template DNA (12.4 ng/µL)",done:true},{id:3,text:"Run gradient PCR: 52–58°C annealing",done:false},{id:4,text:"Run 1.5% agarose gel, 120V 25min",done:false}] },
  { id:"b3", type:"measurement", x:48,  y:290, w:260, rows:[{id:1,key:"Template DNA",value:"12.4",unit:"ng/µL"},{id:2,key:"Primer F",value:"10",unit:"µM"},{id:3,key:"Primer R",value:"10",unit:"µM"},{id:4,key:"MgCl₂",value:"2.5",unit:"mM"}] },
  { id:"b4", type:"observation", x:358, y:290, w:300, certainty:"high", content:"54°C lane shows strong single band ~800bp. 52°C has non-specific bands ~400bp. Will proceed with 54°C." },
  { id:"b5", type:"tag",         x:706, y:48,  w:180, tags:["PCR","primer-optimization","round-3","agarose-gel"] },
];

/* ── Tiny shared atoms ── */
const mono   = { fontFamily: "'DM Mono', monospace" };
const serif  = { fontFamily: "'Fraunces', serif" };

function Avatar({ initials, size = 22, color = T.text }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color + "18",
      border: `1px solid ${color}30`, display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'DM Mono',monospace", fontSize: size * 0.36, fontWeight:600, color, flexShrink:0 }}>
      {initials}
    </div>
  );
}

function StatusPip({ status }) {
  const map = { active:{ color:"#2D9D5C", label:"Active" }, review:{ color:T.amber, label:"In review" }, complete:{ color:T.textLight, label:"Complete" } };
  const s = map[status] || map.active;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
      <div style={{ width:6, height:6, borderRadius:"50%", background: s.color }} />
      <span style={{ ...mono, fontSize:10, color: s.color }}>{s.label}</span>
    </div>
  );
}

function Tag({ label, color = T.text }) {
  return (
    <span style={{ ...mono, fontSize:9.5, padding:"2px 7px", borderRadius:2,
      background: color + "14", color, border:`1px solid ${color}25`, letterSpacing:0.4 }}>
      {label}
    </span>
  );
}

/* ── New experiment modal ── */
function NewExperimentModal({ onClose, onCreate, templates }) {
  const [title, setTitle] = useState("");
  const [mode, setMode]   = useState("blank"); // blank | template
  const [picked, setPicked] = useState(null);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:560, background:T.surface,
        borderRadius:6, boxShadow:"0 24px 64px rgba(0,0,0,0.18)", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"20px 24px 16px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ ...mono, fontSize:10, color:T.textLight, letterSpacing:1.2, textTransform:"uppercase", marginBottom:6 }}>New experiment</div>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Experiment title…"
            autoFocus
            style={{ width:"100%", border:"none", outline:"none", background:"transparent",
              fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:300, color:T.text,
              letterSpacing:-0.3 }} />
          <div style={{ ...mono, fontSize:10, color:T.textLight, marginTop:6 }}>
            {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{ display:"flex", borderBottom:`1px solid ${T.border}` }}>
          {[["blank","Start blank"],["template","From template"]].map(([m,l])=>(
            <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:"10px 0",
              background: mode===m ? T.bg : "transparent",
              border:"none", borderBottom: mode===m ? `2px solid ${T.text}` : "2px solid transparent",
              ...mono, fontSize:11, color: mode===m ? T.text : T.textLight, cursor:"pointer",
              marginBottom:-1 }}>{l}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding:"16px 24px 20px", maxHeight:300, overflowY:"auto" }}>
          {mode==="blank" ? (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ ...mono, fontSize:10, color:T.textLight, letterSpacing:1, textTransform:"uppercase", marginBottom:4 }}>Canvas starts empty</div>
              <div style={{ border:`1.5px dashed ${T.border}`, borderRadius:4, padding:"28px 0",
                textAlign:"center", background:T.bg }}>
                <div style={{ fontSize:22, marginBottom:6, opacity:0.2 }}>⊡</div>
                <div style={{ ...mono, fontSize:11, color:T.textLight }}>Blank dot-grid canvas</div>
                <div style={{ ...mono, fontSize:10, color:T.textLight, marginTop:3 }}>Add any block type freely</div>
              </div>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {templates.map(tmpl=>(
                <button key={tmpl.id} onClick={()=>setPicked(tmpl.id)}
                  style={{ padding:"12px 14px", border:`1.5px solid ${picked===tmpl.id ? tmpl.color : T.border}`,
                    borderRadius:4, background: picked===tmpl.id ? tmpl.color+"0e" : T.surface,
                    cursor:"pointer", textAlign:"left", transition:"all 0.12s" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                    <span style={{ fontSize:14, color:tmpl.color }}>{tmpl.icon}</span>
                    <span style={{ ...mono, fontSize:11, fontWeight:600, color: picked===tmpl.id ? tmpl.color : T.text }}>{tmpl.name}</span>
                  </div>
                  <div style={{ ...mono, fontSize:9.5, color:T.textMid, lineHeight:1.5 }}>{tmpl.desc}</div>
                  <div style={{ ...mono, fontSize:9, color:T.textLight, marginTop:6 }}>{tmpl.blocks} blocks pre-filled</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"12px 24px", borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"flex-end", gap:10 }}>
          <button onClick={onClose} style={{ ...mono, fontSize:11, padding:"8px 16px", border:`1px solid ${T.border}`,
            borderRadius:3, background:"transparent", color:T.textMid, cursor:"pointer" }}>Cancel</button>
          <button onClick={()=>{ if(title.trim()) onCreate(title, mode, picked); }}
            disabled={!title.trim()}
            style={{ ...mono, fontSize:11, padding:"8px 18px", border:"none", borderRadius:3,
              background: title.trim() ? T.text : T.border, color:"#fff", cursor: title.trim()?"pointer":"default" }}>
            Create experiment →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard ── */
function Dashboard({ experiments, onOpen, onNew }) {
  const [filter, setFilter] = useState("all");
  const filters = ["all","active","review","complete"];
  const shown = filter==="all" ? experiments : experiments.filter(e=>e.status===filter);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Top bar */}
      <div style={{ height:52, borderBottom:`1px solid ${T.border}`, display:"flex",
        alignItems:"center", padding:"0 28px", gap:16, flexShrink:0, background:T.surface }}>
        <div style={{ flex:1 }}>
          <div style={{ ...serif, fontSize:18, fontWeight:300, color:T.text, letterSpacing:-0.3 }}>Experiments</div>
        </div>
        {/* Filter tabs */}
        <div style={{ display:"flex", gap:2 }}>
          {filters.map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{ ...mono, fontSize:10.5, padding:"5px 12px",
              border:`1px solid ${filter===f ? T.text : "transparent"}`, borderRadius:20,
              background: filter===f ? T.text : "transparent",
              color: filter===f ? "#fff" : T.textLight, cursor:"pointer", textTransform:"capitalize" }}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={onNew} style={{ ...mono, fontSize:11, padding:"7px 16px",
          background:T.text, color:"#fff", border:"none", borderRadius:3, cursor:"pointer",
          display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:16, lineHeight:1 }}>+</span> New experiment
        </button>
      </div>

      {/* Grid */}
      <div style={{ flex:1, overflowY:"auto", padding:"28px", background:T.bg }}>
        {/* Stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:28 }}>
          {[
            { label:"Total experiments", value: experiments.length, color: T.text },
            { label:"Active",  value: experiments.filter(e=>e.status==="active").length,   color: "#2D9D5C" },
            { label:"In review", value: experiments.filter(e=>e.status==="review").length, color: T.amber },
            { label:"Complete", value: experiments.filter(e=>e.status==="complete").length, color: T.textLight },
          ].map(stat=>(
            <div key={stat.label} style={{ background:T.surface, border:`1px solid ${T.border}`,
              borderRadius:4, padding:"14px 18px" }}>
              <div style={{ ...mono, fontSize:22, fontWeight:500, color:stat.color, letterSpacing:-0.5 }}>{stat.value}</div>
              <div style={{ ...mono, fontSize:10, color:T.textLight, marginTop:3 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Experiment cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
          {shown.map((exp,i)=>(
            <div key={exp.id} onClick={()=>onOpen(exp)}
              style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:4,
                padding:"18px 20px", cursor:"pointer", transition:"all 0.15s",
                animation:`fadeUp 0.3s ease ${i*0.05}s both` }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.text; e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.07)"; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>

              {/* Card header */}
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:10 }}>
                <Tag label={exp.tag} color={T.text} />
                <StatusPip status={exp.status} />
              </div>

              {/* Title */}
              <div style={{ ...serif, fontSize:16, fontWeight:300, color:T.text, letterSpacing:-0.2,
                lineHeight:1.35, marginBottom:12 }}>{exp.title}</div>

              {/* Footer */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", gap:-4 }}>
                  {exp.collaborators.map((c,ci)=>(
                    <div key={ci} style={{ marginLeft: ci>0?-6:0 }}>
                      <Avatar initials={c} size={22} />
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ ...mono, fontSize:10, color:T.textLight }}>{exp.blocks} blocks</span>
                  <span style={{ ...mono, fontSize:10, color:T.textLight }}>{exp.updated}</span>
                </div>
              </div>
            </div>
          ))}

          {/* New experiment ghost card */}
          <div onClick={onNew}
            style={{ border:`1.5px dashed ${T.border}`, borderRadius:4, padding:"18px 20px",
              cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
              flexDirection:"column", gap:8, minHeight:120, transition:"border-color 0.15s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.text}
            onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            <div style={{ fontSize:20, color:T.textLight }}>+</div>
            <div style={{ ...mono, fontSize:11, color:T.textLight }}>New experiment</div>
          </div>
        </div>

        {/* Template shelf */}
        <div style={{ marginTop:32 }}>
          <div style={{ ...mono, fontSize:10, color:T.textLight, letterSpacing:1.2,
            textTransform:"uppercase", marginBottom:14 }}>Quick-start templates</div>
          <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:4 }}>
            {TEMPLATES.map(tmpl=>(
              <div key={tmpl.id}
                style={{ flexShrink:0, width:160, background:T.surface, border:`1px solid ${T.border}`,
                  borderRadius:4, padding:"14px 16px", cursor:"pointer", transition:"all 0.14s" }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=tmpl.color; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; }}>
                <div style={{ fontSize:18, color:tmpl.color, marginBottom:7 }}>{tmpl.icon}</div>
                <div style={{ ...mono, fontSize:11, fontWeight:600, color:T.text, marginBottom:4 }}>{tmpl.name}</div>
                <div style={{ ...mono, fontSize:9.5, color:T.textLight }}>{tmpl.blocks} blocks</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Canvas block renderers ── */
function BlockNote({ data, onChange }) {
  return <textarea value={data.content||""} onChange={e=>onChange({...data,content:e.target.value})}
    placeholder="Write your note…" rows={Math.max(3,(data.content||"").split("\n").length+1)}
    style={{ width:"100%", padding:"10px 12px", border:"none", outline:"none", background:"transparent",
      ...mono, fontSize:12, lineHeight:1.75, color:T.text, resize:"none", display:"block" }} />;
}

function BlockProtocol({ data, onChange }) {
  const steps = data.steps||[{id:1,text:"",done:false}];
  const upd  = (id,p) => onChange({...data, steps: steps.map(s=>s.id===id?{...s,...p}:s)});
  const add  = ()     => onChange({...data, steps:[...steps,{id:Date.now(),text:"",done:false}]});
  const del  = id     => onChange({...data, steps: steps.filter(s=>s.id!==id)});
  return (
    <div style={{padding:"8px 12px"}}>
      {steps.map((s,i)=>(
        <div key={s.id} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6}}>
          <button onClick={()=>upd(s.id,{done:!s.done})} style={{
            width:14,height:14,marginTop:2,flexShrink:0,border:`1.5px solid ${s.done?T.green:"#ccc"}`,
            borderRadius:2,background:s.done?T.green:"transparent",cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            {s.done&&<span style={{color:"#fff",fontSize:8}}>✓</span>}
          </button>
          <span style={{...mono,fontSize:9.5,color:"#bbb",marginTop:2,width:14,flexShrink:0}}>{i+1}.</span>
          <textarea value={s.text} onChange={e=>upd(s.id,{text:e.target.value})}
            placeholder={`Step ${i+1}…`} rows={Math.max(1,s.text.split("\n").length)}
            style={{...mono,fontSize:12,flex:1,border:"none",outline:"none",background:"transparent",
              lineHeight:1.6,color:s.done?"#aaa":T.text,textDecoration:s.done?"line-through":"none",
              resize:"none",padding:0}} />
          {steps.length>1&&<button onClick={()=>del(s.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ccc",fontSize:10,padding:0}}>✕</button>}
        </div>
      ))}
      <button onClick={add} style={{...mono,fontSize:10.5,color:"#bbb",background:"none",border:"none",cursor:"pointer",marginTop:2}}>+ step</button>
    </div>
  );
}

const CERT = ["low","medium","high"];
const CERT_C = {low:"#C0622A",medium:T.blue,high:T.green};
function BlockObservation({ data, onChange }) {
  return (
    <div>
      <textarea value={data.content||""} onChange={e=>onChange({...data,content:e.target.value})}
        placeholder="Describe what you observed…" rows={Math.max(3,(data.content||"").split("\n").length+1)}
        style={{width:"100%",padding:"10px 12px",border:"none",outline:"none",background:"transparent",...mono,fontSize:12,lineHeight:1.75,color:T.text,resize:"none",display:"block"}} />
      <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px 9px",borderTop:`1px solid #f0f0f0`}}>
        <span style={{...mono,fontSize:9.5,color:"#bbb"}}>certainty</span>
        {CERT.map(c=>(
          <button key={c} onClick={()=>onChange({...data,certainty:c})} style={{
            ...mono,fontSize:9.5,padding:"2px 8px",border:"1px solid",
            borderColor:(data.certainty||"medium")===c?CERT_C[c]:"#e0e0e0",borderRadius:2,
            background:(data.certainty||"medium")===c?CERT_C[c]:"transparent",
            color:(data.certainty||"medium")===c?"#fff":"#aaa",cursor:"pointer"}}>{c}</button>
        ))}
      </div>
    </div>
  );
}

function BlockMeasurement({ data, onChange }) {
  const rows = data.rows||[{id:1,key:"",value:"",unit:""}];
  const upd=(id,p)=>onChange({...data,rows:rows.map(r=>r.id===id?{...r,...p}:r)});
  const add=()=>onChange({...data,rows:[...rows,{id:Date.now(),key:"",value:"",unit:""}]});
  const del=id=>onChange({...data,rows:rows.filter(r=>r.id!==id)});
  const ci={width:"100%",border:"none",borderBottom:"1px solid #f0f0f0",outline:"none",background:"transparent",...mono,fontSize:11.5,color:T.text,padding:"2px 3px"};
  return (
    <div style={{padding:"8px 12px"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 72px 52px 16px",gap:4,marginBottom:4}}>
        {["parameter","value","unit",""].map(h=><span key={h} style={{...mono,fontSize:9,color:"#ccc",textTransform:"uppercase",letterSpacing:0.8}}>{h}</span>)}
      </div>
      {rows.map(r=>(
        <div key={r.id} style={{display:"grid",gridTemplateColumns:"1fr 72px 52px 16px",gap:4,marginBottom:4}}>
          <input value={r.key}   onChange={e=>upd(r.id,{key:e.target.value})}   placeholder="e.g. DNA conc." style={ci}/>
          <input value={r.value} onChange={e=>upd(r.id,{value:e.target.value})} placeholder="12.4" style={{...ci,textAlign:"right"}}/>
          <input value={r.unit}  onChange={e=>upd(r.id,{unit:e.target.value})}  placeholder="ng/µL" style={ci}/>
          {rows.length>1?<button onClick={()=>del(r.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#ccc",fontSize:9,padding:0}}>✕</button>:<span/>}
        </div>
      ))}
      <button onClick={add} style={{...mono,fontSize:10.5,color:"#bbb",background:"none",border:"none",cursor:"pointer",marginTop:2}}>+ row</button>
    </div>
  );
}

function BlockTag({ data, onChange }) {
  const tags=data.tags||[];
  const [inp,setInp]=useState("");
  const add=()=>{const v=inp.trim().replace(/\s+/g,"-").toLowerCase();if(v&&!tags.includes(v))onChange({...data,tags:[...tags,v]});setInp("");};
  return (
    <div style={{padding:"8px 12px"}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:tags.length?8:0}}>
        {tags.map(tg=>(
          <span key={tg} style={{...mono,fontSize:10.5,padding:"3px 8px",borderRadius:2,background:"#f0f0ee",color:"#444",display:"flex",alignItems:"center",gap:5}}>
            {tg}<button onClick={()=>onChange({...data,tags:tags.filter(x=>x!==tg)})} style={{background:"none",border:"none",cursor:"pointer",fontSize:8,color:"#aaa",padding:0}}>✕</button>
          </span>
        ))}
      </div>
      <div style={{display:"flex",gap:6}}>
        <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"||e.key===","){e.preventDefault();add();}}} placeholder="type tag + enter…"
          style={{flex:1,border:"none",borderBottom:`1px solid #f0f0f0`,outline:"none",background:"transparent",...mono,fontSize:11.5,color:T.text,padding:"2px 3px"}}/>
        <button onClick={add} style={{...mono,fontSize:10,color:"#bbb",background:"none",border:"none",cursor:"pointer"}}>+</button>
      </div>
    </div>
  );
}

/* ── Canvas block ── */
const BTYPE_META = {
  text:        { label:"Note",        icon:"¶" },
  protocol:    { label:"Protocol",    icon:"›" },
  observation: { label:"Observation", icon:"◎" },
  measurement: { label:"Measurement", icon:"#" },
  image:       { label:"Image/Gel",   icon:"⬚" },
  table:       { label:"Data Table",  icon:"⊞" },
  tag:         { label:"Tags",        icon:"◈" },
};

function CanvasBlock({ block, onMove, onChange, onSelect, isSelected, zoom }) {
  const c = BLOCK_COLORS[block.type] || BLOCK_COLORS.text;
  const meta = BTYPE_META[block.type] || BTYPE_META.text;

  const onMD = e => {
    if(["TEXTAREA","INPUT","BUTTON"].includes(e.target.tagName)) return;
    e.preventDefault();
    const sx=e.clientX/zoom-block.x, sy=e.clientY/zoom-block.y;
    const mv=me=>onMove(block.id,me.clientX/zoom-sx,me.clientY/zoom-sy);
    const up=()=>{window.removeEventListener("mousemove",mv);window.removeEventListener("mouseup",up);};
    window.addEventListener("mousemove",mv); window.addEventListener("mouseup",up);
    onSelect(block.id);
  };

  const inner = () => {
    const p = {data:block, onChange:u=>onChange(block.id,u)};
    if(block.type==="protocol")    return <BlockProtocol    {...p}/>;
    if(block.type==="observation") return <BlockObservation {...p}/>;
    if(block.type==="measurement") return <BlockMeasurement {...p}/>;
    if(block.type==="tag")         return <BlockTag         {...p}/>;
    return <BlockNote {...p}/>;
  };

  return (
    <div onMouseDown={onMD} style={{position:"absolute",left:block.x,top:block.y,width:block.w,userSelect:"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,cursor:"grab"}}>
        <span style={{...mono,fontSize:9.5,color:c.fg,fontWeight:700,letterSpacing:1.4,textTransform:"uppercase",opacity:0.65}}>{meta.icon} {meta.label}</span>
        {isSelected&&<div style={{marginLeft:"auto",width:5,height:5,borderRadius:"50%",background:c.fg}}/>}
      </div>
      <div style={{border:`1.5px solid ${isSelected?c.fg:"rgba(0,0,0,0.08)"}`,borderLeft:`3px solid ${c.bar}`,
        borderRadius:3,background:isSelected?c.bg:T.surface,overflow:"hidden",
        boxShadow:isSelected?`0 4px 20px rgba(0,0,0,0.08)`:`0 1px 4px rgba(0,0,0,0.04)`,
        transition:"border-color 0.15s,box-shadow 0.15s"}}>
        {inner()}
      </div>
    </div>
  );
}

/* ── Canvas view ── */
function CanvasView({ experiment, onBack }) {
  const [blocks, setBlocks]   = useState(CANVAS_BLOCKS);
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom]       = useState(1);
  const [pan, setPan]         = useState({x:0,y:0});
  const [panning, setPanning] = useState(false);
  const panRef = useRef(null);
  const canvasRef = useRef(null);

  const moveBlock   = useCallback((id,x,y)=>setBlocks(p=>p.map(b=>b.id===id?{...b,x:Math.max(0,x),y:Math.max(0,y)}:b)),[]);
  const updateBlock = useCallback((id,u)=>setBlocks(p=>p.map(b=>b.id===id?{...b,...u}:b)),[]);

  const onWheel = useCallback(e=>{e.preventDefault();setZoom(z=>Math.min(2,Math.max(0.35,z*(e.deltaY>0?0.92:1.08))));},[]);
  useEffect(()=>{const el=canvasRef.current;if(el)el.addEventListener("wheel",onWheel,{passive:false});return()=>el?.removeEventListener("wheel",onWheel);},[onWheel]);

  const onCMD = e=>{if(e.target===canvasRef.current||e.target.classList.contains("cvs")){setSelected(null);setPanning(true);panRef.current={x:e.clientX-pan.x,y:e.clientY-pan.y};}};
  const onCMV = e=>{if(panning&&panRef.current)setPan({x:e.clientX-panRef.current.x,y:e.clientY-panRef.current.y});};
  const onCMU = ()=>setPanning(false);

  const addBlock = type=>{
    const b={id:"b"+Date.now(),type,x:(200-pan.x)/zoom,y:(120-pan.y)/zoom,w:280};
    setBlocks(p=>[...p,b]); setSelected(b.id);
  };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Canvas topbar */}
      <div style={{height:52,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",
        padding:"0 20px",gap:14,flexShrink:0,background:T.surface}}>
        <button onClick={onBack} style={{...mono,fontSize:11,color:T.textMid,background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:5,padding:"4px 8px",borderRadius:2}}
          onMouseEnter={e=>e.currentTarget.style.background=T.bg} onMouseLeave={e=>e.currentTarget.style.background="none"}>
          ← Back
        </button>
        <div style={{width:1,height:20,background:T.border}}/>
        <div style={{flex:1}}>
          <div style={{...serif,fontSize:16,fontWeight:300,color:T.text,letterSpacing:-0.2}}>{experiment.title}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <StatusPip status={experiment.status}/>
          <div style={{...mono,fontSize:10,color:T.textLight}}>{experiment.updated}</div>
        </div>
        <div style={{width:1,height:20,background:T.border}}/>
        {/* Zoom */}
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {[["−",()=>setZoom(z=>Math.max(0.35,z-0.1))],[`${Math.round(zoom*100)}%`,null],
            ["+",()=>setZoom(z=>Math.min(2,z+0.1))],["⊡",()=>{setZoom(1);setPan({x:0,y:0});}]].map(([l,fn],i)=>(
            fn ? <button key={i} onClick={fn} style={{...mono,fontSize:i===1?10:13,color:T.textMid,background:"none",
              border:`1px solid ${T.border}`,borderRadius:2,width:26,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{l}</button>
            : <span key={i} style={{...mono,fontSize:10,color:T.textLight,width:34,textAlign:"center"}}>{l}</span>
          ))}
        </div>
        <div style={{width:1,height:20,background:T.border}}/>
        {/* Add block */}
        <div style={{position:"relative"}}>
          <BlockPicker onAdd={addBlock}/>
        </div>
        {selected&&<button onClick={()=>{setBlocks(p=>p.filter(b=>b.id!==selected));setSelected(null);}}
          style={{...mono,fontSize:10.5,padding:"5px 10px",border:`1px solid ${T.border}`,borderRadius:2,background:"none",color:T.textLight,cursor:"pointer"}}>
          ✕ delete</button>}
        <div style={{width:1,height:20,background:T.border}}/>
        <button style={{...mono,fontSize:11,padding:"7px 14px",background:"none",border:`1px solid ${T.border}`,borderRadius:3,color:T.textMid,cursor:"pointer"}}>Share</button>
      </div>

      {/* Canvas */}
      <div ref={canvasRef} onMouseDown={onCMD} onMouseMove={onCMV} onMouseUp={onCMU} onMouseLeave={onCMU}
        style={{flex:1,position:"relative",overflow:"hidden",cursor:panning?"grabbing":"default",
          backgroundImage:`radial-gradient(circle, rgba(0,0,0,0.10) 1px, transparent 1px)`,
          backgroundSize:`${20*zoom}px ${20*zoom}px`,backgroundPosition:`${pan.x}px ${pan.y}px`,
          background:T.bg}}>
        {/* dot grid overlay */}
        <div style={{position:"absolute",inset:0,backgroundImage:`radial-gradient(circle, rgba(26,26,24,0.09) 1px, transparent 1px)`,backgroundSize:`${20*zoom}px ${20*zoom}px`,backgroundPosition:`${pan.x}px ${pan.y}px`,pointerEvents:"none"}}/>
        <div className="cvs" style={{position:"absolute",transformOrigin:"0 0",transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,width:4000,height:4000}}>
          {blocks.map(b=><CanvasBlock key={b.id} block={b} onMove={moveBlock} onChange={updateBlock} onSelect={setSelected} isSelected={selected===b.id} zoom={zoom}/>)}
        </div>
      </div>

      {/* Hint bar */}
      <div style={{height:28,borderTop:`1px solid ${T.border}`,background:T.surface,display:"flex",alignItems:"center",padding:"0 20px",gap:20,flexShrink:0}}>
        {[["drag","move"],["scroll","pan"],["wheel","zoom"]].map(([k,v])=>(
          <span key={k} style={{...mono,fontSize:9.5,color:T.textLight}}><span style={{color:T.textMid}}>{k}</span> — {v}</span>
        ))}
        <div style={{flex:1}}/>
        <span style={{...mono,fontSize:9.5,color:T.textLight}}>{blocks.length} blocks · auto-saved</span>
      </div>
    </div>
  );
}

function BlockPicker({ onAdd }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={()=>setOpen(o=>!o)} style={{...mono,fontSize:11,padding:"7px 14px",
        background:T.text,color:"#fff",border:"none",borderRadius:3,cursor:"pointer",
        display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:15}}>+</span> Add Block
      </button>
      {open&&(
        <div style={{position:"absolute",top:"110%",right:0,background:T.surface,
          border:`1.5px solid ${T.border}`,borderRadius:3,boxShadow:"0 8px 30px rgba(0,0,0,0.1)",
          padding:"6px 0",zIndex:1000,minWidth:170}}>
          {Object.entries(BTYPE_META).map(([type,{label,icon}])=>(
            <button key={type} onClick={()=>{onAdd(type);setOpen(false);}}
              style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:"none",
                border:"none",padding:"7px 14px",cursor:"pointer",...mono,fontSize:11.5,color:T.text,textAlign:"left"}}
              onMouseEnter={e=>e.currentTarget.style.background=T.bg}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <span style={{color:BLOCK_COLORS[type]?.fg||T.text,fontWeight:700,width:14}}>{icon}</span>{label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Sidebar ── */
function Sidebar({ view, onNav, user }) {
  const navItems = [
    { id:"dashboard", icon:"⊟", label:"Experiments" },
    { id:"templates", icon:"⊞", label:"Templates" },
    { id:"shared",    icon:"◈", label:"Shared with me" },
  ];
  return (
    <div style={{width:200,background:T.sidebar,display:"flex",flexDirection:"column",flexShrink:0,borderRight:`1px solid ${T.borderDk}`}}>
      {/* Logo */}
      <div style={{height:52,display:"flex",alignItems:"center",padding:"0 18px",borderBottom:`1px solid ${T.borderDk}`,gap:10}}>
        <div style={{width:22,height:22,background:T.textInv,borderRadius:2,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{...mono,fontSize:10,fontWeight:700,color:T.sidebar}}>ℕ</span>
        </div>
        <span style={{...serif,fontSize:15,fontWeight:300,color:T.textInv,letterSpacing:-0.2}}>notebook</span>
        <span style={{...mono,fontSize:8.5,color:"#555552",marginLeft:"auto",padding:"2px 5px",border:"1px solid #333330",borderRadius:2}}>beta</span>
      </div>

      {/* Nav */}
      <nav style={{flex:1,padding:"12px 10px",display:"flex",flexDirection:"column",gap:2}}>
        {navItems.map(item=>{
          const active = view===item.id;
          return (
            <button key={item.id} onClick={()=>onNav(item.id)}
              style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:3,
                background: active?"rgba(245,244,240,0.1)":"transparent",
                border: active?`1px solid rgba(245,244,240,0.08)`:"1px solid transparent",
                cursor:"pointer",...mono,fontSize:11.5,
                color: active?T.textInv:"#666660",textAlign:"left",width:"100%",transition:"all 0.12s"}}
              onMouseEnter={e=>{if(!active)e.currentTarget.style.color="#999994";}}
              onMouseLeave={e=>{if(!active)e.currentTarget.style.color="#666660";}}>
              <span style={{fontSize:12,width:14,textAlign:"center"}}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}

        <div style={{height:1,background:T.borderDk,margin:"10px 0"}}/>
        <div style={{...mono,fontSize:9,color:"#444440",letterSpacing:0.8,textTransform:"uppercase",padding:"0 10px",marginBottom:4}}>Recent</div>
        {EXPERIMENTS.slice(0,3).map(exp=>(
          <button key={exp.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:3,
            background:"transparent",border:"1px solid transparent",cursor:"pointer",...mono,fontSize:10.5,
            color:"#555552",textAlign:"left",width:"100%",overflow:"hidden"}}
            onMouseEnter={e=>e.currentTarget.style.color="#999994"}
            onMouseLeave={e=>e.currentTarget.style.color="#555552"}>
            <div style={{width:4,height:4,borderRadius:"50%",background:"#333330",flexShrink:0}}/>
            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{exp.title.split("—")[0].trim()}</span>
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{padding:"12px 14px",borderTop:`1px solid ${T.borderDk}`,display:"flex",alignItems:"center",gap:10}}>
        <Avatar initials="SR" size={28} color={T.textInv}/>
        <div style={{flex:1,overflow:"hidden"}}>
          <div style={{...mono,fontSize:11,color:T.textInv,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>S. Rajan</div>
          <div style={{...mono,fontSize:9.5,color:"#444440"}}>IISc · Bangalore</div>
        </div>
        <button style={{background:"none",border:"none",cursor:"pointer",color:"#444440",fontSize:12,padding:0}}>⋯</button>
      </div>
    </div>
  );
}

/* ── App root ── */
export default function App() {
  const [view, setView]       = useState("dashboard");
  const [activeExp, setActiveExp] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [experiments, setExperiments] = useState(EXPERIMENTS);

  const openExp = exp => { setActiveExp(exp); setView("canvas"); };
  const goBack  = ()  => { setView("dashboard"); setActiveExp(null); };

  const createExp = (title, mode, templateId) => {
    const newExp = { id:`exp-${Date.now()}`, title, tag:"New", status:"active",
      updated:"Just now", blocks: mode==="template" ? (TEMPLATES.find(t=>t.id===templateId)?.blocks||0) : 0,
      collaborators:["SR"] };
    setExperiments(p=>[newExp,...p]);
    setShowNew(false);
    openExp(newExp);
  };

  return (
    <div style={{width:"100vw",height:"100vh",overflow:"hidden",display:"flex",background:T.sidebar}}>
      <style>{`
        ${FONTS}
        *{box-sizing:border-box}
        textarea,input{font-family:'DM Mono',monospace}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      `}</style>

      <Sidebar view={view==="canvas"?"canvas":"dashboard"} onNav={v=>{if(v==="dashboard")goBack();else setView(v);}} />

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {view==="canvas" && activeExp
          ? <CanvasView experiment={activeExp} onBack={goBack}/>
          : <Dashboard experiments={experiments} onOpen={openExp} onNew={()=>setShowNew(true)}/>
        }
      </div>

      {showNew&&<NewExperimentModal onClose={()=>setShowNew(false)} onCreate={createExp} templates={TEMPLATES}/>}
    </div>
  );
}
