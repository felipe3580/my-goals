import { useState, useRef, useEffect } from "react";

const AI_CAPABLE = ["write","draft","plan","create","brainstorm","summarize","research","explain","outline","generate","organize","schedule","design","analyze"];
function canAIHelp(t) { return AI_CAPABLE.some(k => t.toLowerCase().includes(k)); }

const DEFAULT_COLUMNS = [
  { id:"daily",   label:"Daily",   icon:"☀️", accent:"#f05a28", glow:"rgba(240,90,40,0.15)",   border:"rgba(240,90,40,0.3)",  ms:86400000 },
  { id:"weekly",  label:"Weekly",  icon:"📅", accent:"#2a7fff", glow:"rgba(42,127,255,0.15)",  border:"rgba(42,127,255,0.3)", ms:604800000 },
  { id:"monthly", label:"Monthly", icon:"🌙", accent:"#8a4aff", glow:"rgba(138,74,255,0.15)",  border:"rgba(138,74,255,0.3)", ms:2592000000 },
  { id:"yearly",  label:"Yearly",  icon:"⭐", accent:"#1daa6a", glow:"rgba(29,170,106,0.15)", border:"rgba(29,170,106,0.3)", ms:31536000000 },
];

const EXPIRY_OPTIONS = [
  {label:"1 hour",ms:3600000},{label:"6 hours",ms:21600000},{label:"12 hours",ms:43200000},
  {label:"1 day",ms:86400000},{label:"3 days",ms:259200000},{label:"1 week",ms:604800000},
  {label:"2 weeks",ms:1209600000},{label:"1 month",ms:2592000000},{label:"3 months",ms:7776000000},
  {label:"6 months",ms:15552000000},{label:"1 year",ms:31536000000},{label:"Never",ms:Infinity},
];
const AI_TONES = ["Motivating","Direct","Friendly","Professional","Concise"];

// ── Reset time helpers ──────────────────────────────────────────────────────
function getNextReset(bucketId) {
  const now = new Date();
  if (bucketId === "daily") {
    const next = new Date(now); next.setDate(now.getDate()+1); next.setHours(0,0,0,0); return next.getTime();
  }
  if (bucketId === "weekly") {
    const next = new Date(now); const day = now.getDay(); const daysUntilMon = day === 0 ? 1 : 8 - day;
    next.setDate(now.getDate() + daysUntilMon); next.setHours(0,0,0,0); return next.getTime();
  }
  if (bucketId === "monthly") {
    const next = new Date(now.getFullYear(), now.getMonth()+1, 1); return next.getTime();
  }
  if (bucketId === "yearly") {
    const next = new Date(now.getFullYear()+1, 0, 1); return next.getTime();
  }
  return Infinity;
}

function cycleLabel(bucketId) {
  return { daily:"day", weekly:"week", monthly:"month", yearly:"year" }[bucketId] || "cycle";
}

function timeUntilReset(bucketId) {
  const next = getNextReset(bucketId);
  if (next === Infinity) return "";
  const ms = next - Date.now();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 48) return `${Math.floor(h/24)}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getTheme(dark) {
  if (dark) return {
    bg:"linear-gradient(135deg,#060610,#0a0a18,#060610)",
    surface:"linear-gradient(135deg,#10102a,#0c0c1f)",
    card:"linear-gradient(135deg,#13132a,#0d0d1e)",
    cardDone:"linear-gradient(135deg,#1a2a1a,#0f1a0f)",
    colBg:"linear-gradient(160deg,#0e0e22,#09091a)",
    colBgHover:"linear-gradient(160deg,#151530,#0f0f28)",
    panelBg:"#0a0a1a", panelBorder:"#2a2a4a", panelSection:"#0f0f22",
    inputBg:"#08081a", border:"#2a2a4a", cardBorder:"#22223a",
    cardBorderDone:"#2a5a2a", colBorder:"#1e1e38",
    text:"#e0e0f0", textMuted:"#5050a0", textCard:"#d0d0e8", textDone:"#4a7a4a",
    inboxBg:"linear-gradient(135deg,#13132a,#0d0d1e)", inboxBorder:"#2a2a4a", inboxText:"#c0c0e0",
    borderWidth:"1px", progressTrack:"#1a1a30",
    titleGradient:"linear-gradient(90deg,#6a5aff,#a06aff)",
    gridColor:"rgba(90,74,255,0.03)", glowOrb:"rgba(90,74,255,0.1)", emptyText:"#2a2a5a",
  };
  return {
    bg:"linear-gradient(135deg,#d8d8ee,#d0d0e8,#d8d8ee)",
    surface:"linear-gradient(135deg,#e2e2f2,#dcdcee)",
    card:"linear-gradient(135deg,#e5e5f5,#dfdff0)",
    cardDone:"linear-gradient(135deg,#d8ece0,#cfe6d8)",
    colBg:"linear-gradient(160deg,#dedeed,#d8d8ec)",
    colBgHover:"linear-gradient(160deg,#d2d2ea,#cccce6)",
    panelBg:"#e0e0f2", panelBorder:"#9090bc", panelSection:"#d8d8ee",
    inputBg:"#e2e2f2", border:"#8888b8", cardBorder:"#9898c8",
    cardBorderDone:"#52a870", colBorder:"#9090bc",
    text:"#16163a", textMuted:"#686898", textCard:"#222244", textDone:"#2a6848",
    inboxBg:"linear-gradient(135deg,#e5e5f5,#dfdff0)", inboxBorder:"#8888b8", inboxText:"#3a3a66",
    borderWidth:"2px", progressTrack:"#c0c0da",
    titleGradient:"linear-gradient(90deg,#6a5aff,#a06aff)",
    gridColor:"rgba(90,74,255,0.05)", glowOrb:"rgba(90,74,255,0.07)", emptyText:"#9898b8",
  };
}

function timeAgo(ts) {
  const s = Math.floor((Date.now()-ts)/1000);
  if(s<60) return `${s}s ago`; if(s<3600) return `${Math.floor(s/60)}m ago`;
  if(s<86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`;
}

// ── Settings Panel ────────────────────────────────────────────────────────────
function SettingsPanel({ open,onClose,dark,setDark,appName,setAppName,tagline,setTagline,columns,setColumns,aiTone,setAiTone,aiVerbosity,setAiVerbosity,notifications,setNotifications,t }) {
  const [localName,setLocalName] = useState(appName);
  const [localTagline,setLocalTagline] = useState(tagline);
  useEffect(()=>setLocalName(appName),[appName]);
  useEffect(()=>setLocalTagline(tagline),[tagline]);
  const ss = { background:t.panelSection, border:`1px solid ${t.panelBorder}`, borderRadius:"14px", padding:"18px 20px", marginBottom:"14px" };
  const ls = { fontSize:"11px",color:t.textMuted,textTransform:"uppercase",letterSpacing:"0.08em",fontFamily:"'DM Sans',sans-serif",marginBottom:"10px",display:"block" };
  const is = { background:t.inputBg,border:`1px solid ${t.panelBorder}`,borderRadius:"8px",padding:"8px 12px",color:t.text,fontSize:"13px",fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%",boxSizing:"border-box" };
  function updateColumn(id,field,value){ setColumns(p=>p.map(c=>c.id===id?{...c,[field]:value}:c)); }
  return (
    <>
      {open && <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",zIndex:800}}/>}
      <div style={{position:"fixed",top:0,right:0,bottom:0,zIndex:900,width:"380px",maxWidth:"95vw",background:t.panelBg,borderLeft:`2px solid ${t.panelBorder}`,boxShadow:open?"-20px 0 60px rgba(0,0,0,0.4)":"none",transform:open?"translateX(0)":"translateX(100%)",transition:"transform 0.35s cubic-bezier(0.4,0,0.2,1)",display:"flex",flexDirection:"column",overflowY:"auto"}}>
        <div style={{padding:"24px 24px 16px",borderBottom:`1px solid ${t.panelBorder}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"20px"}}>⚙️</span>
            <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:"22px",letterSpacing:"0.1em",color:"#8a4aff"}}>SETTINGS</span>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${t.panelBorder}`,borderRadius:"8px",color:t.textMuted,padding:"6px 12px",cursor:"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif"}}>✕ Close</button>
        </div>
        <div style={{padding:"20px 20px 40px",flex:1}}>
          {/* Appearance */}
          <div style={ss}>
            <span style={ls}>🎨 Appearance</span>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:"13px",color:t.text,fontFamily:"'DM Sans',sans-serif"}}>Color Mode</span>
              <button onClick={()=>setDark(d=>!d)} style={{display:"flex",alignItems:"center",gap:"8px",background:dark?"#1a1a3a":"#d8d8ee",border:`1px solid ${t.panelBorder}`,borderRadius:"20px",padding:"5px 12px 5px 8px",cursor:"pointer"}}>
                <div style={{width:"30px",height:"17px",borderRadius:"9px",background:dark?"#5a4aff":"#a8a8c4",position:"relative",transition:"background 0.3s"}}>
                  <div style={{position:"absolute",top:"2px",left:dark?"15px":"2px",width:"13px",height:"13px",borderRadius:"50%",background:"#fff",transition:"left 0.3s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
                </div>
                <span style={{fontSize:"12px",color:t.text,fontFamily:"'DM Sans',sans-serif"}}>{dark?"🌙 Dark":"☀️ Light"}</span>
              </button>
            </div>
          </div>
          {/* Identity */}
          <div style={ss}>
            <span style={ls}>✏️ App Identity</span>
            <div style={{marginBottom:"12px"}}>
              <label style={{fontSize:"12px",color:t.textMuted,fontFamily:"'DM Sans',sans-serif",display:"block",marginBottom:"5px"}}>App Name</label>
              <input value={localName} onChange={e=>setLocalName(e.target.value)} onBlur={()=>setAppName(localName)} onKeyDown={e=>e.key==="Enter"&&setAppName(localName)} style={is}/>
            </div>
            <div>
              <label style={{fontSize:"12px",color:t.textMuted,fontFamily:"'DM Sans',sans-serif",display:"block",marginBottom:"5px"}}>Tagline</label>
              <input value={localTagline} onChange={e=>setLocalTagline(e.target.value)} onBlur={()=>setTagline(localTagline)} onKeyDown={e=>e.key==="Enter"&&setTagline(localTagline)} placeholder="e.g. Stay focused, stay winning" style={is}/>
            </div>
          </div>
          {/* Columns */}
          <div style={ss}>
            <span style={ls}>📋 Column Names & Icons</span>
            {columns.map(col=>(
              <div key={col.id} style={{display:"flex",gap:"8px",marginBottom:"8px",alignItems:"center"}}>
                <input value={col.icon} onChange={e=>updateColumn(col.id,"icon",e.target.value)} style={{...is,width:"48px",textAlign:"center",fontSize:"18px",padding:"6px 4px",flexShrink:0}}/>
                <input value={col.label} onChange={e=>updateColumn(col.id,"label",e.target.value)} style={{...is,flex:1}}/>
                <div style={{width:"12px",height:"12px",borderRadius:"50%",background:col.accent,flexShrink:0}}/>
              </div>
            ))}
          </div>
          {/* Expiry */}
          <div style={ss}>
            <span style={ls}>⏱ Auto-Expiry Times</span>
            <p style={{margin:"0 0 12px",fontSize:"12px",color:t.textMuted,fontFamily:"'DM Sans',sans-serif",lineHeight:"1.5"}}>Incomplete one-time goals move to the recycling bin after this time.</p>
            {columns.map(col=>(
              <div key={col.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
                <span style={{fontSize:"13px",color:t.text,fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:"6px"}}><span>{col.icon}</span>{col.label}</span>
                <select value={col.ms} onChange={e=>updateColumn(col.id,"ms",Number(e.target.value))} style={{...is,width:"130px",cursor:"pointer"}}>
                  {EXPIRY_OPTIONS.map(o=><option key={o.label} value={o.ms}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>
          {/* AI */}
          <div style={ss}>
            <span style={ls}>✦ AI Behavior</span>
            <div style={{marginBottom:"14px"}}>
              <label style={{fontSize:"12px",color:t.textMuted,fontFamily:"'DM Sans',sans-serif",display:"block",marginBottom:"8px"}}>Response Tone</label>
              <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                {AI_TONES.map(tone=>(
                  <button key={tone} onClick={()=>setAiTone(tone)} style={{background:aiTone===tone?"linear-gradient(135deg,#5a4aff,#a06aff)":"transparent",border:`1px solid ${aiTone===tone?"transparent":t.panelBorder}`,borderRadius:"16px",padding:"4px 12px",color:aiTone===tone?"#fff":t.textMuted,fontSize:"12px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",transition:"all 0.2s"}}>{tone}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{fontSize:"12px",color:t.textMuted,fontFamily:"'DM Sans',sans-serif",display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                <span>Response Verbosity</span>
                <span style={{color:"#8a4aff"}}>{aiVerbosity===1?"Brief":aiVerbosity===2?"Balanced":"Detailed"}</span>
              </label>
              <input type="range" min={1} max={3} value={aiVerbosity} onChange={e=>setAiVerbosity(Number(e.target.value))} style={{width:"100%",accentColor:"#8a4aff",cursor:"pointer"}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",color:t.textMuted,fontFamily:"'DM Sans',sans-serif",marginTop:"4px"}}><span>Brief</span><span>Balanced</span><span>Detailed</span></div>
            </div>
          </div>
          {/* Notifications */}
          <div style={ss}>
            <span style={ls}>🔔 Notifications</span>
            {[{key:"expiry",label:"Goal expiry warnings",desc:"Alert before a goal expires"},{key:"daily",label:"Daily reminder",desc:"Morning nudge to review goals"},{key:"completion",label:"Completion celebrations",desc:"Celebrate when you finish goals"}].map(item=>(
              <div key={item.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
                <div>
                  <p style={{margin:0,fontSize:"13px",color:t.text,fontFamily:"'DM Sans',sans-serif"}}>{item.label}</p>
                  <p style={{margin:0,fontSize:"11px",color:t.textMuted,fontFamily:"'DM Sans',sans-serif"}}>{item.desc}</p>
                </div>
                <button onClick={()=>setNotifications(p=>({...p,[item.key]:!p[item.key]}))} style={{width:"40px",height:"22px",borderRadius:"11px",border:"none",background:notifications[item.key]?"#5a4aff":(dark?"#2a2a4a":"#b0b0cc"),position:"relative",cursor:"pointer",transition:"background 0.3s",flexShrink:0}}>
                  <div style={{position:"absolute",top:"3px",left:notifications[item.key]?"21px":"3px",width:"16px",height:"16px",borderRadius:"50%",background:"#fff",transition:"left 0.3s",boxShadow:"0 1px 3px rgba(0,0,0,0.3)"}}/>
                </button>
              </div>
            ))}
            <p style={{margin:"8px 0 0",fontSize:"11px",color:t.textMuted,fontFamily:"'DM Sans',sans-serif",fontStyle:"italic"}}>Note: Browser notifications require permission when deployed.</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Recycle Bin ───────────────────────────────────────────────────────────────
function RecycleBin({ bin,onRestore,onPermanentDelete,onDrop,onDragOver,onDragLeave,isDragOver,dark,columns }) {
  const [open,setOpen] = useState(false);
  const [hovered,setHovered] = useState(false);
  return (
    <>
      <div onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onClick={()=>bin.length>0&&setOpen(o=>!o)}
        style={{position:"fixed",bottom:"28px",right:"28px",zIndex:400,width:"64px",height:"64px",borderRadius:"50%",background:isDragOver?"linear-gradient(135deg,#ff4a4a,#cc2a2a)":dark?"linear-gradient(135deg,#1a1a2e,#0f0f1e)":"linear-gradient(135deg,#dcdcf0,#d0d0e8)",border:isDragOver?"2px solid #ff4a4a":`2px solid ${dark?"#3a2a2a":"#9090bc"}`,boxShadow:isDragOver?"0 0 30px rgba(255,74,74,0.5)":hovered?"0 8px 24px rgba(0,0,0,0.25)":"0 4px 16px rgba(0,0,0,0.15)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:bin.length>0?"pointer":"default",transition:"all 0.2s ease",transform:isDragOver?"scale(1.15)":hovered?"scale(1.05)":"scale(1)"}}>
        <span style={{fontSize:"22px",lineHeight:1}}>{isDragOver?"🗑️":"♻️"}</span>
        {bin.length>0&&<span style={{position:"absolute",top:"-4px",right:"-4px",background:"#ff4a4a",color:"#fff",borderRadius:"50%",width:"20px",height:"20px",fontSize:"11px",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>{bin.length}</span>}
        {hovered&&bin.length>0&&<span style={{position:"absolute",bottom:"-24px",fontSize:"11px",color:dark?"#7070a0":"#7070a0",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap"}}>{open?"close":"view bin"}</span>}
      </div>
      {open&&(
        <div style={{position:"fixed",bottom:"104px",right:"16px",zIndex:450,width:"320px",maxHeight:"400px",background:dark?"linear-gradient(160deg,#0f0f20,#090914)":"linear-gradient(160deg,#dcdcf0,#d4d4ec)",border:`2px solid ${dark?"#3a2a2a":"#9090bc"}`,borderRadius:"20px",overflow:"hidden",boxShadow:"0 16px 48px rgba(0,0,0,0.3)"}}>
          <div style={{padding:"16px 20px 12px",borderBottom:`1px solid ${dark?"#2a1a1a":"#9090bc"}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}><span style={{fontSize:"16px"}}>♻️</span><span style={{fontFamily:"'Bebas Neue',cursive",fontSize:"16px",letterSpacing:"0.1em",color:"#ff6a4a"}}>RECYCLING BIN</span></div>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              {bin.length>0&&<button onClick={()=>bin.forEach(g=>onPermanentDelete(g.id))} style={{background:"transparent",border:`1px solid ${dark?"#4a2a2a":"#c0a0a0"}`,borderRadius:"6px",color:"#ff6a6a",padding:"3px 10px",cursor:"pointer",fontSize:"11px",fontFamily:"'DM Sans',sans-serif"}}>Clear all</button>}
              <button onClick={()=>setOpen(false)} style={{background:"transparent",border:"none",color:dark?"#5050a0":"#7070a0",cursor:"pointer",fontSize:"16px",padding:"0 4px",lineHeight:1}}>✕</button>
            </div>
          </div>
          <div style={{overflowY:"auto",maxHeight:"320px",padding:"10px 12px"}}>
            {bin.map(goal=>{
              const col = columns.find(c=>c.id===goal.bucket)||DEFAULT_COLUMNS.find(c=>c.id===goal.bucket);
              return (
                <div key={goal.id} style={{background:dark?"#13131f":"#d8d8ec",border:`1px solid ${dark?"#2a2030":"#9090bc"}`,borderRadius:"10px",padding:"10px 12px",marginBottom:"8px",display:"flex",alignItems:"flex-start",gap:"10px"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{margin:"0 0 4px",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",color:dark?"#9090b0":"#5050a0",textDecoration:"line-through",lineHeight:"1.4",wordBreak:"break-word"}}>{goal.text}</p>
                    <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                      {col&&<span style={{fontSize:"10px",background:col.accent+"22",color:col.accent,padding:"1px 7px",borderRadius:"8px",fontFamily:"monospace",fontWeight:600}}>{col.label}</span>}
                      <span style={{fontSize:"10px",color:dark?"#4040a0":"#8080a0",fontFamily:"'DM Sans',sans-serif"}}>{timeAgo(goal.deletedAt)}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:"4px",flexShrink:0}}>
                    <button onClick={()=>onRestore(goal.id)} style={{background:"transparent",border:`1px solid ${dark?"#2a4a2a":"#70b070"}`,borderRadius:"6px",color:"#4aaa6a",padding:"3px 8px",cursor:"pointer",fontSize:"10px",fontFamily:"'DM Sans',sans-serif"}}>Restore</button>
                    <button onClick={()=>onPermanentDelete(goal.id)} style={{background:"transparent",border:`1px solid ${dark?"#4a2a2a":"#c09090"}`,borderRadius:"6px",color:"#ff6a6a",padding:"3px 8px",cursor:"pointer",fontSize:"10px",fontFamily:"'DM Sans',sans-serif"}}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({ goal,onToggle,onDelete,onAIHelp,onDragStart,onSelectGoal,onToggleRecurring,isSelected,accent,t,dark }) {
  const [hovered,setHovered] = useState(false);
  const streak = goal.streak||0;
  const isRecurring = goal.recurring;

  return (
    <div draggable onDragStart={onDragStart} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}
      style={{background:isSelected?(dark?"linear-gradient(135deg,#1a1540,#120f30)":"linear-gradient(135deg,#d8d4f8,#d0ccf4)"):goal.done?t.cardDone:t.card,border:isSelected?`${t.borderWidth} solid #8a4aff`:goal.done?`${t.borderWidth} solid ${t.cardBorderDone}`:hovered?`${t.borderWidth} solid ${accent}88`:`${t.borderWidth} solid ${t.cardBorder}`,borderRadius:"12px",padding:"12px 14px",marginBottom:"8px",display:"flex",alignItems:"flex-start",gap:"10px",transition:"all 0.2s ease",boxShadow:isSelected?"0 0 20px rgba(138,74,255,0.25)":hovered&&!goal.done?`0 0 16px ${accent}22`:"0 1px 3px rgba(0,0,0,0.06)",cursor:"grab",position:"relative",overflow:"hidden",userSelect:"none"}}>

      {goal.done&&<div style={{position:"absolute",inset:0,opacity:0.04,background:"repeating-linear-gradient(45deg,#4aff91 0px,transparent 2px,transparent 18px,#4aff91 20px)",pointerEvents:"none"}}/>}

      {/* Checkbox */}
      <button onClick={(e)=>{e.stopPropagation();onToggle(goal.id);}} style={{width:"20px",height:"20px",borderRadius:"6px",flexShrink:0,marginTop:"2px",border:`2px solid ${accent}`,background:goal.done?accent:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s ease",fontSize:"11px"}}>
        {goal.done&&<span style={{color:"#fff",fontWeight:900}}>✓</span>}
      </button>

      {/* Content */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:"6px",flexWrap:"wrap"}}>
          <p onClick={(e)=>{e.stopPropagation();onSelectGoal(goal);}} style={{margin:0,fontSize:"13px",fontFamily:"'DM Sans',sans-serif",color:isSelected?"#a080ff":goal.done?t.textDone:t.textCard,textDecoration:goal.done?"line-through":"none",lineHeight:"1.4",wordBreak:"break-word",cursor:"pointer",flex:1}} title="Click to toggle AI plan">
            {goal.text}
            {isSelected&&<span style={{marginLeft:"6px",fontSize:"10px",opacity:0.7}}>▲ plan</span>}
            {!isSelected&&hovered&&!goal.done&&<span style={{marginLeft:"6px",fontSize:"10px",opacity:0.5}}>▼ plan</span>}
          </p>
          {/* Streak badge */}
          {isRecurring&&streak>0&&(
            <span title={`${streak} ${streak===1?"cycle":"cycles"} completed in a row`} style={{flexShrink:0,background:streak>=7?"linear-gradient(135deg,#f0a020,#e06010)":streak>=3?"linear-gradient(135deg,#8a4aff,#6a2aff)":"linear-gradient(135deg,#2a6aff,#1a4adf)",color:"#fff",fontSize:"10px",fontWeight:700,padding:"2px 7px",borderRadius:"10px",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:"3px",cursor:"default"}}>
              {streak>=7?"🔥":streak>=3?"⚡":"✦"} {streak}
            </span>
          )}
        </div>

        {/* Sub-row: recurring toggle + AI help + reset hint */}
        <div style={{display:"flex",alignItems:"center",gap:"6px",marginTop:"6px",flexWrap:"wrap"}}>
          {/* Recurring toggle */}
          <button onClick={(e)=>{e.stopPropagation();onToggleRecurring(goal.id);}} title={isRecurring?"Switch to one-time goal":"Make this a recurring goal"} style={{background:isRecurring?(dark?"rgba(138,74,255,0.2)":"rgba(138,74,255,0.15)"):"transparent",border:`1px solid ${isRecurring?"#8a4aff":(dark?"#2a2a4a":"#9090bc")}`,borderRadius:"10px",padding:"2px 8px",color:isRecurring?"#a06aff":t.textMuted,fontSize:"10px",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:"3px",transition:"all 0.2s"}}>
            {isRecurring?"🔄 Recurring":"○ One-time"}
          </button>

          {/* Reset countdown for recurring done goals */}
          {isRecurring&&goal.done&&goal.bucket&&(
            <span style={{fontSize:"10px",color:t.textMuted,fontFamily:"'DM Sans',sans-serif"}}>
              resets in {timeUntilReset(goal.bucket)}
            </span>
          )}

          {goal.aiCapable&&!goal.done&&(
            <button onClick={(e)=>{e.stopPropagation();onAIHelp(goal);}} style={{background:"linear-gradient(135deg,#5a4aff,#a06aff)",border:"none",borderRadius:"6px",padding:"2px 8px",color:"#fff",fontSize:"10px",fontFamily:"'DM Sans',sans-serif",cursor:"pointer",fontWeight:600,letterSpacing:"0.04em"}}>✦ AI Help</button>
          )}
        </div>
      </div>

      {hovered&&<button onClick={(e)=>{e.stopPropagation();onDelete(goal.id);}} style={{background:"transparent",border:"none",color:"#c07070",fontSize:"13px",cursor:"pointer",padding:"0 2px",lineHeight:1,flexShrink:0,marginTop:"2px"}}>✕</button>}
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────
function Column({ col,goals,onToggle,onDelete,onAIHelp,onDragStart,onDrop,onDragOver,onDragLeave,isDragOver,onSelectGoal,onToggleRecurring,selectedGoalId,t,dark }) {
  const done = goals.filter(g=>g.done).length;
  return (
    <div onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} style={{flex:1,minWidth:"220px",background:isDragOver?t.colBgHover:t.colBg,border:isDragOver?`2px solid ${col.accent}`:`${t.borderWidth} solid ${t.colBorder}`,borderRadius:"20px",padding:"20px",transition:"all 0.2s ease",boxShadow:isDragOver?`0 0 30px ${col.glow}`:"0 2px 8px rgba(0,0,0,0.05)",display:"flex",flexDirection:"column",minHeight:"300px"}}>
      <div style={{marginBottom:"16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
          <span style={{fontSize:"18px"}}>{col.icon}</span>
          <h2 style={{margin:0,fontFamily:"'Bebas Neue',cursive",fontSize:"22px",letterSpacing:"0.1em",color:col.accent}}>{col.label}</h2>
        </div>
        {goals.length>0&&(
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <div style={{flex:1,height:"2px",background:t.progressTrack,borderRadius:"1px",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${Math.round((done/goals.length)*100)}%`,background:col.accent,borderRadius:"1px",transition:"width 0.5s ease"}}/>
            </div>
            <span style={{fontSize:"11px",color:col.accent,fontFamily:"monospace",flexShrink:0}}>{done}/{goals.length}</span>
          </div>
        )}
      </div>
      <div style={{flex:1}}>
        {goals.length===0&&<div style={{height:"80px",border:`2px dashed ${col.border}`,borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",color:col.accent+"99",fontSize:"14px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,letterSpacing:"0.03em"}}>Drop goals here</div>}
        {goals.map(goal=><GoalCard key={goal.id} goal={goal} accent={col.accent} t={t} dark={dark} onToggle={onToggle} onDelete={onDelete} onAIHelp={onAIHelp} onDragStart={(e)=>onDragStart(e,goal.id)} onSelectGoal={onSelectGoal} onToggleRecurring={onToggleRecurring} isSelected={selectedGoalId===goal.id}/>)}
      </div>
    </div>
  );
}

// ── AI Panel ──────────────────────────────────────────────────────────────────
function AIPanel({ goal,onClose,aiTone,aiVerbosity }) {
  const [messages,setMessages] = useState([]);
  const [input,setInput] = useState("");
  const [loading,setLoading] = useState(false);
  const [started,setStarted] = useState(false);
  const bottomRef = useRef(null);
  useEffect(()=>{if(!started){setStarted(true);kickoff();}},[]);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages,loading]);
  const vm = {1:"Keep responses very brief — 2-3 sentences max.",2:"Keep responses concise but helpful.",3:"Be thorough and detailed."};
  async function kickoff(){setLoading(true);await send(`The user has a goal: "${goal.text}". Greet them (1 sentence), then help. Be ${aiTone.toLowerCase()}. ${vm[aiVerbosity]}`,[]);setLoading(false);}
  async function send(text,history){
    const msgs=[...history,{role:"user",content:text}];
    const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`You are a focused productivity assistant. Tone: ${aiTone}. ${vm[aiVerbosity]} Use markdown for clarity.`,messages:msgs})});
    const data=await res.json();
    const reply=data.content?.map(b=>b.text||"").join("")||"Something went wrong.";
    setMessages(p=>[...p,{role:"assistant",content:reply}]);return reply;
  }
  async function handleSend(){
    if(!input.trim()||loading)return;
    const msg=input.trim();setInput("");
    setMessages(p=>[...p,{role:"user",content:msg}]);setLoading(true);
    await send(msg,messages.map(m=>({role:m.role,content:m.content})));setLoading(false);
  }
  function render(text){return text.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\*(.*?)\*/g,"<em>$1</em>").replace(/^- (.+)$/gm,"• $1").replace(/\n/g,"<br/>");}
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:"20px"}}>
      <div style={{background:"linear-gradient(160deg,#0d0d1f,#0a0a15)",border:"1px solid #3a2aff44",borderRadius:"24px",width:"100%",maxWidth:"580px",height:"78vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 0 60px rgba(90,74,255,0.3),0 40px 80px rgba(0,0,0,0.6)"}}>
        <div style={{padding:"18px 22px",borderBottom:"1px solid #2a2a3e",display:"flex",alignItems:"center",justifyContent:"space-between",background:"linear-gradient(90deg,#1a1a3e,#0d0d1f)"}}>
          <div>
            <span style={{color:"#a06aff",fontFamily:"'Bebas Neue',cursive",fontSize:"16px",letterSpacing:"0.1em"}}>✦ AI ASSISTANT · {aiTone}</span>
            <p style={{margin:"3px 0 0",color:"#5050a0",fontSize:"12px",fontFamily:"'DM Sans',sans-serif"}}>{goal.text.length>55?goal.text.slice(0,55)+"…":goal.text}</p>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:"1px solid #3a2a4a",borderRadius:"8px",color:"#7060a0",padding:"6px 12px",cursor:"pointer",fontSize:"12px",fontFamily:"'DM Sans',sans-serif"}}>Close</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"18px 22px",display:"flex",flexDirection:"column",gap:"14px"}}>
          {messages.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"85%",background:m.role==="user"?"linear-gradient(135deg,#5a4aff,#7a5aff)":"linear-gradient(135deg,#1a1a2e,#15152a)",border:m.role==="user"?"none":"1px solid #2a2a4a",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"11px 14px",color:m.role==="user"?"#fff":"#d0d0f0",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",lineHeight:"1.6"}} dangerouslySetInnerHTML={{__html:render(m.content)}}/>
            </div>
          ))}
          {loading&&<div style={{display:"flex",gap:"5px",alignItems:"center"}}>{[0,1,2].map(i=><div key={i} style={{width:"7px",height:"7px",borderRadius:"50%",background:"#5a4aff",animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}</div>}
          <div ref={bottomRef}/>
        </div>
        <div style={{padding:"14px 18px",borderTop:"1px solid #2a2a3e",display:"flex",gap:"10px"}}>
          <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}} placeholder="Ask for help…" rows={1} style={{flex:1,background:"#0f0f1f",border:"1px solid #3a3a5a",borderRadius:"10px",padding:"10px 14px",color:"#e0e0f0",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",resize:"none",outline:"none",lineHeight:"1.5"}}/>
          <button onClick={handleSend} disabled={loading||!input.trim()} style={{background:loading||!input.trim()?"#2a2a3e":"linear-gradient(135deg,#5a4aff,#a06aff)",border:"none",borderRadius:"10px",padding:"10px 18px",color:loading||!input.trim()?"#5a5a7a":"#fff",cursor:loading||!input.trim()?"not-allowed":"pointer",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,whiteSpace:"nowrap"}}>Send ↑</button>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.3);opacity:1}}`}</style>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark,setDark] = useState(true);
  const [settingsOpen,setSettingsOpen] = useState(false);
  const [appName,setAppName] = useState("MyGoals");
  const [tagline,setTagline] = useState("");
  const [columns,setColumns] = useState(DEFAULT_COLUMNS);
  const [aiTone,setAiTone] = useState("Motivating");
  const [aiVerbosity,setAiVerbosity] = useState(2);
  const [notifications,setNotifications] = useState({expiry:true,daily:false,completion:true});
  const [goals,setGoals] = useState([]);
  const [bin,setBin] = useState([]);
  const [input,setInput] = useState("");
  const [aiGoal,setAiGoal] = useState(null);
  const [dragOverCol,setDragOverCol] = useState(null);
  const [dragOverBin,setDragOverBin] = useState(false);
  const [summaryGoal,setSummaryGoal] = useState(null);
  const [summaryText,setSummaryText] = useState("");
  const [summaryLoading,setSummaryLoading] = useState(false);
  const [selectedGoalId,setSelectedGoalId] = useState(null);
  const dragGoalId = useRef(null);
  const inputRef = useRef(null);
  const summaryRef = useRef(null);
  const t = getTheme(dark);

  // ── Recurring reset check ──
  useEffect(()=>{
    function checkResets(){
      const now = Date.now();
      setGoals(prev=>prev.map(g=>{
        if(!g.recurring||!g.done||!g.bucket) return g;
        if(!g.nextReset||now>=g.nextReset){
          const newStreak = (g.streak||0)+1;
          return {...g,done:false,streak:newStreak,nextReset:getNextReset(g.bucket)};
        }
        return g;
      }));
    }
    checkResets();
    const interval = setInterval(checkResets, 30000);
    return ()=>clearInterval(interval);
  },[]);

  // ── Expiry check for one-time goals ──
  useEffect(()=>{
    const interval=setInterval(()=>{
      const now=Date.now();
      setGoals(prev=>{
        const expired=prev.filter(g=>{
          if(!g.bucket||g.done||g.recurring) return false;
          const col=columns.find(c=>c.id===g.bucket);
          if(!col||!g.assignedAt||col.ms===Infinity) return false;
          return now-g.assignedAt>col.ms;
        });
        if(expired.length>0){
          setBin(b=>[...b,...expired.map(g=>({...g,deletedAt:now}))]);
          return prev.filter(g=>!expired.find(e=>e.id===g.id));
        }
        return prev;
      });
    },10000);
    return ()=>clearInterval(interval);
  },[columns]);

  function addGoal(){
    if(!input.trim()) return;
    setGoals(prev=>[...prev,{id:Date.now(),text:input.trim(),bucket:null,done:false,recurring:false,streak:0,aiCapable:canAIHelp(input.trim())}]);
    setInput(""); inputRef.current?.focus();
  }

  function toggleGoal(id){
    setGoals(prev=>prev.map(g=>{
      if(g.id!==id) return g;
      if(g.recurring&&!g.done&&g.bucket){
        return {...g,done:true,nextReset:getNextReset(g.bucket)};
      }
      return {...g,done:!g.done};
    }));
  }

  function toggleRecurring(id){
    setGoals(prev=>prev.map(g=>{
      if(g.id!==id) return g;
      const nowRecurring=!g.recurring;
      return {...g,recurring:nowRecurring,streak:nowRecurring?g.streak:0,nextReset:nowRecurring&&g.done&&g.bucket?getNextReset(g.bucket):undefined};
    }));
  }

  function deleteGoal(id){
    const goal=goals.find(g=>g.id===id);
    if(goal) setBin(p=>[...p,{...goal,deletedAt:Date.now()}]);
    setGoals(p=>p.filter(g=>g.id!==id));
    if(selectedGoalId===id){setSummaryGoal(null);setSelectedGoalId(null);}
  }

  function restoreGoal(id){
    const goal=bin.find(g=>g.id===id);
    if(goal){const{deletedAt,...rest}=goal;setGoals(p=>[...p,{...rest,assignedAt:Date.now()}]);setBin(p=>p.filter(g=>g.id!==id));}
  }

  function permanentDelete(id){setBin(p=>p.filter(g=>g.id!==id));}

  async function handleSelectGoal(goal){
    if(selectedGoalId===goal.id){setSelectedGoalId(null);setSummaryGoal(null);return;}
    const col=columns.find(c=>c.id===goal.bucket);
    setSelectedGoalId(goal.id);setSummaryGoal({...goal,colLabel:col?.label});
    setSummaryText("");setSummaryLoading(true);
    setTimeout(()=>summaryRef.current?.scrollIntoView({behavior:"smooth",block:"start"}),100);
    const vm={1:"Keep it under 100 words.",2:"Keep it under 200 words.",3:"Be thorough, up to 300 words."};
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:`You are a ${aiTone.toLowerCase()} productivity coach. ${vm[aiVerbosity]} Use bold headers and bullet points.`,messages:[{role:"user",content:`Goal: "${goal.text}"\nTime horizon: ${col?.label||"general"}\n\nGive me a clear, actionable plan.`}]})});
      const data=await res.json();setSummaryText(data.content?.map(b=>b.text||"").join("")||"Could not generate a plan.");
    }catch{setSummaryText("Sorry, could not generate a plan right now.");}
    setSummaryLoading(false);
  }

  function handleDragStart(e,goalId){dragGoalId.current=goalId;e.dataTransfer.effectAllowed="move";}
  function handleDrop(e,colId){
    e.preventDefault();const id=dragGoalId.current;if(!id)return;
    setGoals(p=>p.map(g=>g.id===id?{...g,bucket:colId,assignedAt:Date.now(),nextReset:g.recurring&&g.done?getNextReset(colId):g.nextReset}:g));
    setDragOverCol(null);dragGoalId.current=null;
  }
  function handleDropBin(e){
    e.preventDefault();const id=dragGoalId.current;if(!id)return;
    const goal=goals.find(g=>g.id===id);
    if(goal) setBin(p=>[...p,{...goal,deletedAt:Date.now()}]);
    setGoals(p=>p.filter(g=>g.id!==id));
    if(selectedGoalId===id){setSummaryGoal(null);setSelectedGoalId(null);}
    setDragOverBin(false);dragGoalId.current=null;
  }
  function handleDragOver(e,colId){e.preventDefault();setDragOverCol(colId);}
  function handleDragLeave(){setDragOverCol(null);}

  const inbox=goals.filter(g=>!g.bucket);
  const totalDone=goals.filter(g=>g.done).length;
  const totalPct=goals.length?Math.round((totalDone/goals.length)*100):0;

  return (
    <div style={{minHeight:"100vh",background:t.bg,fontFamily:"'DM Sans',sans-serif",color:t.text,position:"relative",transition:"background 0.4s ease,color 0.3s ease"}}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",backgroundImage:`linear-gradient(${t.gridColor} 1px,transparent 1px),linear-gradient(90deg,${t.gridColor} 1px,transparent 1px)`,backgroundSize:"40px 40px"}}/>
      <div style={{position:"fixed",top:"-80px",right:"-80px",width:"350px",height:"350px",borderRadius:"50%",background:`radial-gradient(circle,${t.glowOrb} 0%,transparent 70%)`,pointerEvents:"none"}}/>

      {/* Theme switch */}
      <button onClick={()=>setDark(d=>!d)} style={{position:"fixed",top:"20px",left:"24px",zIndex:500,display:"flex",alignItems:"center",gap:"8px",background:dark?"#1a1a3a":"#d4d4ec",border:dark?"1px solid #3a3a5a":"1px solid #9090bc",borderRadius:"30px",padding:"7px 14px 7px 10px",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",transition:"all 0.25s ease"}}>
        <div style={{width:"36px",height:"20px",borderRadius:"10px",background:dark?"#5a4aff":"#a8a8c4",position:"relative",transition:"background 0.3s ease",flexShrink:0}}>
          <div style={{position:"absolute",top:"3px",left:dark?"19px":"3px",width:"14px",height:"14px",borderRadius:"50%",background:"#fff",transition:"left 0.3s ease",boxShadow:"0 1px 4px rgba(0,0,0,0.2)"}}/>
        </div>
        <span style={{fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:500,color:dark?"#a0a0d0":"#5a5a7a"}}>{dark?"Dark":"Light"}</span>
        <span style={{fontSize:"14px"}}>{dark?"🌙":"☀️"}</span>
      </button>

      {/* Settings icon */}
      <button onClick={()=>setSettingsOpen(true)} title="Settings" style={{position:"fixed",top:"20px",right:"24px",zIndex:500,width:"42px",height:"42px",borderRadius:"50%",background:dark?"#1a1a3a":"#d4d4ec",border:dark?"1px solid #3a3a5a":"1px solid #9090bc",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",transition:"all 0.2s ease"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1) rotate(30deg)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1) rotate(0deg)"}>⚙️</button>

      <div style={{maxWidth:"1300px",margin:"0 auto",padding:"40px 24px",position:"relative"}}>
        {/* Header */}
        <div style={{marginBottom:"36px",textAlign:"center",position:"relative"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:"10px",justifyContent:"center"}}>
            <h1 style={{margin:0,fontFamily:"'Bebas Neue',cursive",fontSize:"clamp(42px,7vw,68px)",letterSpacing:"0.05em",lineHeight:1,background:t.titleGradient,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{appName}</h1>
            <span style={{color:"#8a4aff",fontFamily:"'Bebas Neue',cursive",fontSize:"22px"}}>✦</span>
          </div>
          {tagline&&<p style={{margin:"4px 0 0",color:"#8a4aff",fontSize:"12px",fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.06em",textTransform:"uppercase"}}>{tagline}</p>}
          <p style={{margin:"6px 0 0",color:t.textMuted,fontSize:"13px",letterSpacing:"0.05em",textTransform:"uppercase"}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
          {goals.length>0&&(
            <div style={{position:"absolute",right:0,top:0,textAlign:"right"}}>
              <div style={{fontSize:"28px",fontFamily:"'Bebas Neue',cursive",color:totalPct===100?"#1daa6a":"#8a4aff",letterSpacing:"0.05em"}}>{totalPct}%</div>
              <div style={{fontSize:"12px",color:t.textMuted}}>{totalDone} of {goals.length} done</div>
            </div>
          )}
        </div>

        {/* Add goal */}
        <div style={{background:t.surface,border:`${t.borderWidth} solid ${t.border}`,borderRadius:"18px",padding:"18px",marginBottom:"28px",display:"flex",gap:"10px",alignItems:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",transition:"background 0.3s"}}>
          <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addGoal()} placeholder="Write a new goal… then drag it into a time bucket" style={{flex:1,background:t.inputBg,border:`${t.borderWidth} solid ${t.border}`,borderRadius:"10px",padding:"11px 15px",color:t.text,fontSize:"14px",fontFamily:"'DM Sans',sans-serif",outline:"none",transition:"background 0.3s,color 0.3s"}}/>
          <button onClick={addGoal} style={{background:"linear-gradient(135deg,#5a4aff,#a06aff)",border:"none",borderRadius:"10px",padding:"11px 20px",color:"#fff",fontSize:"18px",cursor:"pointer"}}>+</button>
        </div>

        {/* Inbox */}
        {inbox.length>0&&(
          <div style={{marginBottom:"24px"}}>
            <p style={{margin:"0 0 10px",fontSize:"12px",color:t.textMuted,textTransform:"uppercase",letterSpacing:"0.08em"}}>📥 Inbox — drag goals into a bucket below</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
              {inbox.map(goal=>(
                <div key={goal.id} draggable onDragStart={(e)=>handleDragStart(e,goal.id)} style={{background:t.inboxBg,border:`${t.borderWidth} solid ${t.inboxBorder}`,borderRadius:"10px",padding:"8px 14px",fontSize:"13px",color:t.inboxText,fontFamily:"'DM Sans',sans-serif",cursor:"grab",userSelect:"none",display:"flex",alignItems:"center",gap:"8px",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",transition:"background 0.3s"}}>
                  <span style={{opacity:0.4,fontSize:"11px"}}>⠿</span>
                  {goal.text}
                  {goal.aiCapable&&<span style={{fontSize:"10px",color:"#8a4aff"}}>✦</span>}
                  <button onClick={()=>deleteGoal(goal.id)} style={{background:"none",border:"none",color:"#c07070",cursor:"pointer",padding:0,fontSize:"12px",marginLeft:"2px"}}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Columns */}
        <div style={{display:"flex",gap:"16px",flexWrap:"wrap"}}>
          {columns.map(col=>(
            <Column key={col.id} col={col} goals={goals.filter(g=>g.bucket===col.id)} t={t} dark={dark}
              onToggle={toggleGoal} onDelete={deleteGoal} onAIHelp={setAiGoal}
              onDragStart={handleDragStart} onDrop={(e)=>handleDrop(e,col.id)}
              onDragOver={(e)=>handleDragOver(e,col.id)} onDragLeave={handleDragLeave}
              isDragOver={dragOverCol===col.id} onSelectGoal={handleSelectGoal}
              onToggleRecurring={toggleRecurring} selectedGoalId={selectedGoalId}/>
          ))}
        </div>

        {goals.length===0&&(
          <div style={{textAlign:"center",padding:"80px 20px",color:t.emptyText}}>
            <div style={{fontSize:"52px",marginBottom:"16px"}}>◌</div>
            <p style={{fontSize:"15px",margin:0}}>Add your first goal above, then drag it into a time bucket</p>
          </div>
        )}

        {/* AI Summary */}
        {summaryGoal&&(
          <div ref={summaryRef} style={{marginTop:"32px",background:dark?"linear-gradient(135deg,#0e0e2a,#0a0a1e)":"linear-gradient(135deg,#d8d8f0,#d0d0ec)",border:"2px solid #6a4aff44",borderRadius:"20px",padding:"28px 32px",boxShadow:"0 0 40px rgba(106,74,255,0.12)",transition:"all 0.3s ease"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"20px",gap:"16px"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
                  <span style={{fontSize:"16px"}}>✦</span>
                  <span style={{fontFamily:"'Bebas Neue',cursive",fontSize:"18px",letterSpacing:"0.1em",color:"#8a4aff"}}>AI ACTION PLAN</span>
                  <span style={{background:columns.find(c=>c.id===summaryGoal.bucket)?.accent,color:"#fff",fontSize:"10px",fontWeight:700,padding:"2px 8px",borderRadius:"10px",fontFamily:"'DM Sans',sans-serif",letterSpacing:"0.05em"}}>{summaryGoal.colLabel?.toUpperCase()}</span>
                  {summaryGoal.recurring&&<span style={{background:"rgba(138,74,255,0.2)",color:"#a06aff",fontSize:"10px",fontWeight:600,padding:"2px 8px",borderRadius:"10px",fontFamily:"'DM Sans',sans-serif"}}>🔄 Recurring</span>}
                </div>
                <p style={{margin:0,fontSize:"15px",fontFamily:"'DM Sans',sans-serif",color:t.text,fontWeight:500}}>{summaryGoal.text}</p>
              </div>
              <button onClick={()=>{setSummaryGoal(null);setSelectedGoalId(null);}} style={{background:"transparent",border:`1px solid ${dark?"#3a2a5a":"#9090bc"}`,borderRadius:"8px",color:t.textMuted,padding:"6px 12px",cursor:"pointer",fontSize:"12px",fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>Dismiss</button>
            </div>
            {summaryLoading?(
              <div style={{display:"flex",gap:"6px",alignItems:"center",padding:"8px 0"}}>
                {[0,1,2].map(i=><div key={i} style={{width:"8px",height:"8px",borderRadius:"50%",background:"#8a4aff",animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>)}
                <span style={{marginLeft:"8px",color:t.textMuted,fontSize:"13px",fontFamily:"'DM Sans',sans-serif"}}>Generating your plan…</span>
              </div>
            ):(
              <div style={{fontSize:"14px",fontFamily:"'DM Sans',sans-serif",color:t.textCard,lineHeight:"1.7"}} dangerouslySetInnerHTML={{__html:summaryText.replace(/\*\*(.*?)\*\*/g,`<strong style="color:${dark?"#c0a0ff":"#6a4aff"}">$1</strong>`).replace(/\*(.*?)\*/g,"<em>$1</em>").replace(/^- (.+)$/gm,`<div style="display:flex;gap:8px;margin:4px 0"><span style="color:#8a4aff;flex-shrink:0">•</span><span>$1</span></div>`).replace(/\n/g,"<br/>")}}/>
            )}
            <div style={{marginTop:"20px"}}>
              <button onClick={()=>setAiGoal(summaryGoal)} style={{background:"linear-gradient(135deg,#5a4aff,#a06aff)",border:"none",borderRadius:"10px",padding:"9px 18px",color:"#fff",fontSize:"13px",fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:"pointer"}}>✦ Chat with AI about this goal</button>
            </div>
          </div>
        )}

        <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.3);opacity:1}}`}</style>
      </div>

      {aiGoal&&<AIPanel goal={aiGoal} onClose={()=>setAiGoal(null)} aiTone={aiTone} aiVerbosity={aiVerbosity}/>}

      <SettingsPanel open={settingsOpen} onClose={()=>setSettingsOpen(false)} dark={dark} setDark={setDark} appName={appName} setAppName={setAppName} tagline={tagline} setTagline={setTagline} columns={columns} setColumns={setColumns} aiTone={aiTone} setAiTone={setAiTone} aiVerbosity={aiVerbosity} setAiVerbosity={setAiVerbosity} notifications={notifications} setNotifications={setNotifications} t={t}/>

      <RecycleBin bin={bin} dark={dark} columns={columns} onRestore={restoreGoal} onPermanentDelete={permanentDelete} onDrop={handleDropBin} onDragOver={(e)=>{e.preventDefault();setDragOverBin(true);}} onDragLeave={()=>setDragOverBin(false)} isDragOver={dragOverBin}/>
    </div>
  );
}
