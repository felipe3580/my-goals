import { useState, useRef, useEffect } from "react";

const AI_CAPABLE = ["write", "draft", "plan", "create", "brainstorm", "summarize", "research", "explain", "outline", "generate", "organize", "schedule", "design", "analyze"];
function canAIHelp(text) {
  return AI_CAPABLE.some(k => text.toLowerCase().includes(k));
}

const COLUMNS = [
  { id: "daily",   label: "Daily",   icon: "☀️", accent: "#f05a28", glow: "rgba(240,90,40,0.15)",   border: "rgba(240,90,40,0.3)",  ms: 86400000 },
  { id: "weekly",  label: "Weekly",  icon: "📅", accent: "#2a7fff", glow: "rgba(42,127,255,0.15)",  border: "rgba(42,127,255,0.3)", ms: 604800000 },
  { id: "monthly", label: "Monthly", icon: "🌙", accent: "#8a4aff", glow: "rgba(138,74,255,0.15)",  border: "rgba(138,74,255,0.3)", ms: 2592000000 },
  { id: "yearly",  label: "Yearly",  icon: "⭐", accent: "#1daa6a", glow: "rgba(29,170,106,0.15)", border: "rgba(29,170,106,0.3)", ms: 31536000000 },
];

// Theme tokens
function getTheme(dark) {
  if (dark) return {
    bg: "linear-gradient(135deg, #060610, #0a0a18, #060610)",
    surface: "linear-gradient(135deg, #10102a, #0c0c1f)",
    card: "linear-gradient(135deg, #13132a, #0d0d1e)",
    cardDone: "linear-gradient(135deg, #1a2a1a, #0f1a0f)",
    colBg: "linear-gradient(160deg, #0e0e22, #09091a)",
    colBgHover: "linear-gradient(160deg, #151530, #0f0f28)",
    inputBg: "#08081a",
    border: "#2a2a4a",
    cardBorder: "#22223a",
    cardBorderDone: "#2a5a2a",
    colBorder: "#1e1e38",
    text: "#e0e0f0",
    textMuted: "#5050a0",
    textCard: "#d0d0e8",
    textDone: "#4a7a4a",
    inboxBg: "linear-gradient(135deg, #13132a, #0d0d1e)",
    inboxBorder: "#2a2a4a",
    inboxText: "#c0c0e0",
    borderWidth: "1px",
    progressTrack: "#1a1a30",
    titleGradient: "linear-gradient(90deg, #6a5aff, #a06aff)",
    gridColor: "rgba(90,74,255,0.03)",
    glowOrb: "rgba(90,74,255,0.1)",
    switchBg: (on) => on ? "#5a4aff" : "#2a2a4a",
    switchKnob: "#fff",
    switchIcon: on => on ? "🌙" : "☀️",
    emptyText: "#2a2a5a",
  };
  return {
    bg: "linear-gradient(135deg, #d8d8ee, #d0d0e8, #d8d8ee)",
    surface: "linear-gradient(135deg, #e2e2f2, #dcdcee)",
    card: "linear-gradient(135deg, #e5e5f5, #dfdff0)",
    cardDone: "linear-gradient(135deg, #d8ece0, #cfe6d8)",
    colBg: "linear-gradient(160deg, #dededf0, #d8d8ec)",
    colBgHover: "linear-gradient(160deg, #d2d2ea, #ccccE6)",
    inputBg: "#e2e2f2",
    border: "#8888b8",
    cardBorder: "#9898c8",
    cardBorderDone: "#52a870",
    colBorder: "#9090bc",
    text: "#16163a",
    textMuted: "#686898",
    textCard: "#222244",
    textDone: "#2a6848",
    inboxBg: "linear-gradient(135deg, #e5e5f5, #dfdff0)",
    inboxBorder: "#8888b8",
    inboxText: "#3a3a66",
    borderWidth: "2px",
    progressTrack: "#c0c0da",
    emptyText: "#9898b8",
    titleGradient: "linear-gradient(90deg, #6a5aff, #a06aff)",
    gridColor: "rgba(90,74,255,0.05)",
    glowOrb: "rgba(90,74,255,0.07)",
    switchBg: (on) => on ? "#5a4aff" : "#a8a8c4",
    switchKnob: "#fff",
    switchIcon: on => on ? "🌙" : "☀️",
  };
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}

function RecycleBin({ bin, onRestore, onPermanentDelete, onDrop, onDragOver, onDragLeave, isDragOver, dark }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <>
      {/* Floating bin button */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => bin.length > 0 && setOpen(o => !o)}
        style={{
          position: "fixed", bottom: "28px", right: "28px", zIndex: 400,
          width: "64px", height: "64px", borderRadius: "50%",
          background: isDragOver
            ? "linear-gradient(135deg, #ff4a4a, #cc2a2a)"
            : dark ? "linear-gradient(135deg, #1a1a2e, #0f0f1e)" : "linear-gradient(135deg, #fff, #f0f0ff)",
          border: isDragOver ? "2px solid #ff4a4a" : `2px solid ${dark ? "#3a2a2a" : "#d0c0c0"}`,
          boxShadow: isDragOver
            ? "0 0 30px rgba(255,74,74,0.5)"
            : hovered ? "0 8px 24px rgba(0,0,0,0.25)" : "0 4px 16px rgba(0,0,0,0.15)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          cursor: bin.length > 0 ? "pointer" : "default",
          transition: "all 0.2s ease",
          transform: isDragOver ? "scale(1.15)" : hovered ? "scale(1.05)" : "scale(1)",
        }}
      >
        <span style={{ fontSize: "22px", lineHeight: 1 }}>{isDragOver ? "🗑️" : "♻️"}</span>
        {bin.length > 0 && (
          <span style={{
            position: "absolute", top: "-4px", right: "-4px",
            background: "#ff4a4a", color: "#fff", borderRadius: "50%",
            width: "20px", height: "20px", fontSize: "11px", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'DM Sans', sans-serif",
          }}>{bin.length}</span>
        )}
        {hovered && bin.length > 0 && (
          <span style={{ position: "absolute", bottom: "-24px", fontSize: "11px", color: dark ? "#7070a0" : "#9090b0", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
            {open ? "close" : "view bin"}
          </span>
        )}
      </div>

      {/* Bin drawer */}
      {open && (
        <div style={{
          position: "fixed", bottom: "104px", right: "16px", zIndex: 450,
          width: "320px", maxHeight: "400px",
          background: dark ? "linear-gradient(160deg, #0f0f20, #090914)" : "linear-gradient(160deg, #fff, #f8f8ff)",
          border: `2px solid ${dark ? "#3a2a2a" : "#d0c0e0"}`,
          borderRadius: "20px", overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
        }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${dark ? "#2a1a1a" : "#e8d8e8"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>♻️</span>
              <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "16px", letterSpacing: "0.1em", color: "#ff6a4a" }}>RECYCLING BIN</span>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {bin.length > 0 && (
                <button onClick={() => { bin.forEach(g => onPermanentDelete(g.id)); }} style={{ background: "transparent", border: `1px solid ${dark ? "#4a2a2a" : "#e0c0c0"}`, borderRadius: "6px", color: "#ff6a6a", padding: "3px 10px", cursor: "pointer", fontSize: "11px", fontFamily: "'DM Sans', sans-serif" }}>
                  Clear all
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: "transparent", border: "none", color: dark ? "#5050a0" : "#a090c0", cursor: "pointer", fontSize: "16px", padding: "0 4px", lineHeight: 1 }}>✕</button>
            </div>
          </div>
          <div style={{ overflowY: "auto", maxHeight: "320px", padding: "10px 12px" }}>
            {bin.map(goal => {
              const col = COLUMNS.find(c => c.id === goal.bucket);
              return (
                <div key={goal.id} style={{
                  background: dark ? "#13131f" : "#f8f8ff",
                  border: `1px solid ${dark ? "#2a2030" : "#ddd8ee"}`,
                  borderRadius: "10px", padding: "10px 12px", marginBottom: "8px",
                  display: "flex", alignItems: "flex-start", gap: "10px",
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", color: dark ? "#9090b0" : "#6060a0", textDecoration: "line-through", lineHeight: "1.4", wordBreak: "break-word" }}>{goal.text}</p>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {col && <span style={{ fontSize: "10px", background: col.accent + "22", color: col.accent, padding: "1px 7px", borderRadius: "8px", fontFamily: "monospace", fontWeight: 600 }}>{col.label}</span>}
                      <span style={{ fontSize: "10px", color: dark ? "#4040a0" : "#a0a0c0", fontFamily: "'DM Sans', sans-serif" }}>{timeAgo(goal.deletedAt)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0 }}>
                    <button onClick={() => onRestore(goal.id)} style={{ background: "transparent", border: `1px solid ${dark ? "#2a4a2a" : "#a0c8a0"}`, borderRadius: "6px", color: "#4aaa6a", padding: "3px 8px", cursor: "pointer", fontSize: "10px", fontFamily: "'DM Sans', sans-serif" }}>Restore</button>
                    <button onClick={() => onPermanentDelete(goal.id)} style={{ background: "transparent", border: `1px solid ${dark ? "#4a2a2a" : "#e0b0b0"}`, borderRadius: "6px", color: "#ff6a6a", padding: "3px 8px", cursor: "pointer", fontSize: "10px", fontFamily: "'DM Sans', sans-serif" }}>Delete</button>
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

// Theme tokens
function getTheme(dark) {
  if (dark) return {
    bg: "linear-gradient(135deg, #060610, #0a0a18, #060610)",
    surface: "linear-gradient(135deg, #10102a, #0c0c1f)",
    card: "linear-gradient(135deg, #13132a, #0d0d1e)",
    cardDone: "linear-gradient(135deg, #1a2a1a, #0f1a0f)",
    colBg: "linear-gradient(160deg, #0e0e22, #09091a)",
    colBgHover: "linear-gradient(160deg, #151530, #0f0f28)",
    inputBg: "#08081a",
    border: "#2a2a4a",
    cardBorder: "#22223a",
    cardBorderDone: "#2a5a2a",
    colBorder: "#1e1e38",
    text: "#e0e0f0",
    textMuted: "#5050a0",
    textCard: "#d0d0e8",
    textDone: "#4a7a4a",
    inboxBg: "linear-gradient(135deg, #13132a, #0d0d1e)",
    inboxBorder: "#2a2a4a",
    inboxText: "#c0c0e0",
    borderWidth: "1px",
    progressTrack: "#1a1a30",
    titleGradient: "linear-gradient(90deg, #6a5aff, #a06aff)",
    gridColor: "rgba(90,74,255,0.03)",
    glowOrb: "rgba(90,74,255,0.1)",
    switchBg: (on) => on ? "#5a4aff" : "#2a2a4a",
    switchKnob: "#fff",
    switchIcon: on => on ? "🌙" : "☀️",
  };
  return {
    bg: "linear-gradient(135deg, #f0f0fa, #e8e8f8, #f0f0fa)",
    surface: "linear-gradient(135deg, #ffffff, #f4f4fc)",
    card: "linear-gradient(135deg, #ffffff, #f8f8ff)",
    cardDone: "linear-gradient(135deg, #f0faf4, #e8f5ee)",
    colBg: "linear-gradient(160deg, #fafaff, #f2f2fc)",
    colBgHover: "linear-gradient(160deg, #ededff, #e5e5fa)",
    inputBg: "#f8f8ff",
    border: "#a0a0cc",
    cardBorder: "#b0b0d8",
    cardBorderDone: "#6abf8a",
    colBorder: "#a8a8d0",
    text: "#1a1a3a",
    textMuted: "#8080a0",
    textCard: "#2a2a4a",
    textDone: "#3a7a4a",
    inboxBg: "linear-gradient(135deg, #ffffff, #f8f8ff)",
    inboxBorder: "#a0a0cc",
    inboxText: "#4a4a6a",
    borderWidth: "2px",
    progressTrack: "#e0e0f0",
    emptyText: "#c0c0d8",
    titleGradient: "linear-gradient(90deg, #6a5aff, #a06aff)",
    gridColor: "rgba(90,74,255,0.04)",
    glowOrb: "rgba(90,74,255,0.06)",
    switchBg: (on) => on ? "#5a4aff" : "#c0c0d8",
    switchKnob: "#fff",
    switchIcon: on => on ? "🌙" : "☀️",
  };
}

function ThemeSwitch({ dark, onToggle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      style={{
        position: "fixed", top: "20px", left: "24px", zIndex: 500,
        display: "flex", alignItems: "center", gap: "8px",
        background: dark ? "#1a1a3a" : "#ffffff",
        border: dark ? "1px solid #3a3a5a" : "1px solid #d0d0e8",
        borderRadius: "30px", padding: "7px 14px 7px 10px",
        cursor: "pointer", boxShadow: hovered ? "0 4px 20px rgba(90,74,255,0.2)" : "0 2px 8px rgba(0,0,0,0.1)",
        transition: "all 0.25s ease",
      }}
    >
      {/* Track */}
      <div style={{
        width: "36px", height: "20px", borderRadius: "10px",
        background: dark ? "#5a4aff" : "#c0c0d8",
        position: "relative", transition: "background 0.3s ease", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", top: "3px",
          left: dark ? "19px" : "3px",
          width: "14px", height: "14px", borderRadius: "50%",
          background: "#fff", transition: "left 0.3s ease",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }} />
      </div>
      <span style={{ fontSize: "13px", fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: dark ? "#a0a0d0" : "#5a5a7a", letterSpacing: "0.02em" }}>
        {dark ? "Dark" : "Light"}
      </span>
      <span style={{ fontSize: "14px" }}>{dark ? "🌙" : "☀️"}</span>
    </button>
  );
}

function GoalCard({ goal, onToggle, onDelete, onAIHelp, onDragStart, onSelectGoal, isSelected, accent, t }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected ? (t.card === "linear-gradient(135deg, #ffffff, #f8f8ff)" ? "linear-gradient(135deg, #f0edff, #e8e4ff)" : "linear-gradient(135deg, #1a1540, #120f30)") : goal.done ? t.cardDone : t.card,
        border: isSelected ? `${t.borderWidth} solid #8a4aff` : goal.done ? `${t.borderWidth} solid ${t.cardBorderDone}` : hovered ? `${t.borderWidth} solid ${accent}88` : `${t.borderWidth} solid ${t.cardBorder}`,
        borderRadius: "12px", padding: "12px 14px", marginBottom: "8px",
        display: "flex", alignItems: "flex-start", gap: "10px",
        transition: "all 0.2s ease",
        boxShadow: isSelected ? `0 0 20px rgba(138,74,255,0.25)` : hovered && !goal.done ? `0 0 16px ${accent}22` : "0 1px 3px rgba(0,0,0,0.06)",
        cursor: "grab", position: "relative", overflow: "hidden", userSelect: "none",
      }}
    >
      {goal.done && (
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, background: "repeating-linear-gradient(45deg, #4aff91 0px, transparent 2px, transparent 18px, #4aff91 20px)", pointerEvents: "none" }} />
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(goal.id); }}
        style={{
          width: "20px", height: "20px", borderRadius: "6px", flexShrink: 0, marginTop: "1px",
          border: `2px solid ${accent}`,
          background: goal.done ? accent : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s ease", fontSize: "11px",
        }}
      >
        {goal.done && <span style={{ color: "#fff", fontWeight: 900 }}>✓</span>}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          onClick={(e) => { e.stopPropagation(); onSelectGoal(goal); }}
          style={{ margin: 0, fontSize: "13px", fontFamily: "'DM Sans', sans-serif", color: isSelected ? "#a080ff" : goal.done ? t.textDone : t.textCard, textDecoration: goal.done ? "line-through" : "none", lineHeight: "1.4", wordBreak: "break-word", cursor: "pointer" }}
          title="Click to toggle AI plan"
        >
          {goal.text}
          {isSelected && <span style={{ marginLeft: "6px", fontSize: "10px", opacity: 0.7 }}>▲ plan</span>}
          {!isSelected && hovered && !goal.done && <span style={{ marginLeft: "6px", fontSize: "10px", opacity: 0.5 }}>▼ plan</span>}
        </p>
        {goal.aiCapable && !goal.done && (
          <button
            onClick={(e) => { e.stopPropagation(); onAIHelp(goal); }}
            style={{ marginTop: "6px", background: "linear-gradient(135deg, #5a4aff, #a06aff)", border: "none", borderRadius: "6px", padding: "3px 8px", color: "#fff", fontSize: "10px", fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 600, letterSpacing: "0.04em" }}
          >✦ AI Help</button>
        )}
      </div>
      {hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(goal.id); }}
          style={{ background: "transparent", border: "none", color: "#c07070", fontSize: "13px", cursor: "pointer", padding: "0 2px", lineHeight: 1, flexShrink: 0 }}
        >✕</button>
      )}
    </div>
  );
}

function Column({ col, goals, onToggle, onDelete, onAIHelp, onDragStart, onDrop, onDragOver, onDragLeave, isDragOver, onSelectGoal, selectedGoalId, t }) {
  const done = goals.filter(g => g.done).length;
  return (
    <div
      onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
      style={{
        flex: 1, minWidth: "220px",
        background: isDragOver ? t.colBgHover : t.colBg,
        border: isDragOver ? `2px solid ${col.accent}` : `${t.borderWidth} solid ${t.colBorder}`,
        borderRadius: "20px", padding: "20px",
        transition: "all 0.2s ease",
        boxShadow: isDragOver ? `0 0 30px ${col.glow}` : "0 2px 8px rgba(0,0,0,0.05)",
        display: "flex", flexDirection: "column", minHeight: "300px",
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "18px" }}>{col.icon}</span>
          <h2 style={{ margin: 0, fontFamily: "'Bebas Neue', cursive", fontSize: "22px", letterSpacing: "0.1em", color: col.accent }}>{col.label}</h2>
        </div>
        {goals.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ flex: 1, height: "2px", background: t.progressTrack, borderRadius: "1px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.round((done / goals.length) * 100)}%`, background: col.accent, borderRadius: "1px", transition: "width 0.5s ease" }} />
            </div>
            <span style={{ fontSize: "11px", color: col.accent, fontFamily: "monospace", flexShrink: 0 }}>{done}/{goals.length}</span>
          </div>
        )}
      </div>
      <div style={{ flex: 1 }}>
        {goals.length === 0 && (
          <div style={{ height: "80px", border: `2px dashed ${col.border}`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: col.accent + "99", fontSize: "14px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, letterSpacing: "0.03em" }}>
            Drop goals here
          </div>
        )}
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} accent={col.accent} t={t} onToggle={onToggle} onDelete={onDelete} onAIHelp={onAIHelp} onDragStart={(e) => onDragStart(e, goal.id)} onSelectGoal={onSelectGoal} isSelected={selectedGoalId === goal.id} />
        ))}
      </div>
    </div>
  );
}

function AIPanel({ goal, onClose, t }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { if (!started) { setStarted(true); kickoff(); } }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function kickoff() {
    setLoading(true);
    await streamMessage(`The user has a goal: "${goal.text}". Greet them warmly (1 sentence), then immediately start helping. Be proactive, practical, and concise.`, []);
    setLoading(false);
  }

  async function streamMessage(userText, history) {
    const msgs = [...history, { role: "user", content: userText }];
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: "You are a focused, warm productivity assistant. Help the user accomplish their specific goal. Be practical and actionable. Use markdown (bold, lists) for clarity. Keep responses concise.", messages: msgs }),
    });
    const data = await res.json();
    const reply = data.content?.map(b => b.text || "").join("") || "Sorry, something went wrong.";
    setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    return reply;
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    await streamMessage(userMsg, history);
    setLoading(false);
  }

  function renderContent(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/^- (.+)$/gm, '• $1').replace(/\n/g, '<br/>');
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: "linear-gradient(160deg, #0d0d1f, #0a0a15)", border: "1px solid #3a2aff44", borderRadius: "24px", width: "100%", maxWidth: "580px", height: "78vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 0 60px rgba(90,74,255,0.3), 0 40px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #2a2a3e", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(90deg, #1a1a3e, #0d0d1f)" }}>
          <div>
            <span style={{ color: "#a06aff", fontFamily: "'Bebas Neue', cursive", fontSize: "16px", letterSpacing: "0.1em" }}>✦ AI ASSISTANT</span>
            <p style={{ margin: "3px 0 0", color: "#5050a0", fontSize: "12px", fontFamily: "'DM Sans', sans-serif" }}>{goal.text.length > 55 ? goal.text.slice(0, 55) + "…" : goal.text}</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #3a2a4a", borderRadius: "8px", color: "#7060a0", padding: "6px 12px", cursor: "pointer", fontSize: "12px", fontFamily: "'DM Sans', sans-serif" }}>Close</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "85%", background: m.role === "user" ? "linear-gradient(135deg, #5a4aff, #7a5aff)" : "linear-gradient(135deg, #1a1a2e, #15152a)", border: m.role === "user" ? "none" : "1px solid #2a2a4a", borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", padding: "11px 14px", color: m.role === "user" ? "#fff" : "#d0d0f0", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", lineHeight: "1.6" }}
                dangerouslySetInnerHTML={{ __html: renderContent(m.content) }} />
            </div>
          ))}
          {loading && <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>{[0,1,2].map(i => <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#5a4aff", animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />)}</div>}
          <div ref={bottomRef} />
        </div>
        <div style={{ padding: "14px 18px", borderTop: "1px solid #2a2a3e", display: "flex", gap: "10px" }}>
          <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Ask for help…" rows={1} style={{ flex: 1, background: "#0f0f1f", border: "1px solid #3a3a5a", borderRadius: "10px", padding: "10px 14px", color: "#e0e0f0", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", resize: "none", outline: "none", lineHeight: "1.5" }} />
          <button onClick={handleSend} disabled={loading || !input.trim()} style={{ background: loading || !input.trim() ? "#2a2a3e" : "linear-gradient(135deg, #5a4aff, #a06aff)", border: "none", borderRadius: "10px", padding: "10px 18px", color: loading || !input.trim() ? "#5a5a7a" : "#fff", cursor: loading || !input.trim() ? "not-allowed" : "pointer", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>Send ↑</button>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.3);opacity:1} }`}</style>
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(true);
  const [goals, setGoals] = useState([]);
  const [bin, setBin] = useState([]);
  const [input, setInput] = useState("");
  const [aiGoal, setAiGoal] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dragOverBin, setDragOverBin] = useState(false);
  const [summaryGoal, setSummaryGoal] = useState(null);
  const [summaryText, setSummaryText] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const dragGoalId = useRef(null);
  const inputRef = useRef(null);
  const summaryRef = useRef(null);
  const t = getTheme(dark);

  // Check for expired goals every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setGoals(prev => {
        const expired = prev.filter(g => {
          if (!g.bucket || g.done) return false;
          const col = COLUMNS.find(c => c.id === g.bucket);
          if (!col || !g.assignedAt) return false;
          return now - g.assignedAt > col.ms;
        });
        if (expired.length > 0) {
          setBin(b => [...b, ...expired.map(g => ({ ...g, deletedAt: now }))]);
          return prev.filter(g => !expired.find(e => e.id === g.id));
        }
        return prev;
      });
    }, 10000); // check every 10s for demo responsiveness
    return () => clearInterval(interval);
  }, []);

  function addGoal() {
    if (!input.trim()) return;
    setGoals(prev => [...prev, { id: Date.now(), text: input.trim(), bucket: null, done: false, aiCapable: canAIHelp(input.trim()) }]);
    setInput("");
    inputRef.current?.focus();
  }

  function toggleGoal(id) { setGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g)); }

  function deleteGoal(id) {
    const goal = goals.find(g => g.id === id);
    if (goal) setBin(prev => [...prev, { ...goal, deletedAt: Date.now() }]);
    setGoals(prev => prev.filter(g => g.id !== id));
    if (selectedGoalId === id) { setSummaryGoal(null); setSelectedGoalId(null); }
  }

  function restoreGoal(id) {
    const goal = bin.find(g => g.id === id);
    if (goal) {
      const { deletedAt, ...rest } = goal;
      setGoals(prev => [...prev, { ...rest, assignedAt: Date.now() }]);
      setBin(prev => prev.filter(g => g.id !== id));
    }
  }

  function permanentDelete(id) { setBin(prev => prev.filter(g => g.id !== id)); }

  async function handleSelectGoal(goal) {
    if (selectedGoalId === goal.id) {
      setSelectedGoalId(null);
      setSummaryGoal(null);
      return;
    }
    const col = COLUMNS.find(c => c.id === goal.bucket);
    setSelectedGoalId(goal.id);
    setSummaryGoal({ ...goal, colLabel: col?.label });
    setSummaryText("");
    setSummaryLoading(true);
    setTimeout(() => summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: "You are a concise productivity coach. Given a goal and a time horizon, provide a practical action plan. Use bold headers and bullet points. Be motivating but direct. Keep it under 200 words.",
          messages: [{ role: "user", content: `Goal: "${goal.text}"\nTime horizon: ${col?.label || "general"} goal\n\nGive me a clear, actionable plan to achieve this goal within the ${col?.label?.toLowerCase() || "given"} timeframe.` }],
        }),
      });
      const data = await res.json();
      setSummaryText(data.content?.map(b => b.text || "").join("") || "Could not generate a plan.");
    } catch {
      setSummaryText("Sorry, could not generate a plan right now.");
    }
    setSummaryLoading(false);
  }

  function handleDragStart(e, goalId) { dragGoalId.current = goalId; e.dataTransfer.effectAllowed = "move"; }

  function handleDrop(e, colId) {
    e.preventDefault();
    const id = dragGoalId.current;
    if (!id) return;
    setGoals(prev => prev.map(g => g.id === id ? { ...g, bucket: colId, assignedAt: Date.now() } : g));
    setDragOverCol(null);
    dragGoalId.current = null;
  }

  function handleDropBin(e) {
    e.preventDefault();
    const id = dragGoalId.current;
    if (!id) return;
    const goal = goals.find(g => g.id === id);
    if (goal) setBin(prev => [...prev, { ...goal, deletedAt: Date.now() }]);
    setGoals(prev => prev.filter(g => g.id !== id));
    if (selectedGoalId === id) { setSummaryGoal(null); setSelectedGoalId(null); }
    setDragOverBin(false);
    dragGoalId.current = null;
  }

  function handleDragOver(e, colId) { e.preventDefault(); setDragOverCol(colId); }
  function handleDragLeave() { setDragOverCol(null); }

  const inbox = goals.filter(g => !g.bucket);
  const totalDone = goals.filter(g => g.done).length;
  const totalPct = goals.length ? Math.round((totalDone / goals.length) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: "'DM Sans', sans-serif", color: t.text, position: "relative", transition: "background 0.4s ease, color 0.3s ease" }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

      {/* Grid overlay */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: `linear-gradient(${t.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${t.gridColor} 1px, transparent 1px)`, backgroundSize: "40px 40px", transition: "opacity 0.4s" }} />
      {/* Glow orb */}
      <div style={{ position: "fixed", top: "-80px", right: "-80px", width: "350px", height: "350px", borderRadius: "50%", background: `radial-gradient(circle, ${t.glowOrb} 0%, transparent 70%)`, pointerEvents: "none" }} />

      {/* Theme Switch */}
      <ThemeSwitch dark={dark} onToggle={() => setDark(d => !d)} />

      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "40px 24px", position: "relative" }}>

        {/* Header */}
        <div style={{ marginBottom: "36px", textAlign: "center", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", justifyContent: "center" }}>
            <h1 style={{ margin: 0, fontFamily: "'Bebas Neue', cursive", fontSize: "clamp(42px, 7vw, 68px)", letterSpacing: "0.05em", lineHeight: 1, background: t.titleGradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>MyGoals</h1>
            <span style={{ color: "#8a4aff", fontFamily: "'Bebas Neue', cursive", fontSize: "22px" }}>✦</span>
          </div>
          <p style={{ margin: "6px 0 0", color: t.textMuted, fontSize: "13px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          {goals.length > 0 && (
            <div style={{ position: "absolute", right: 0, top: 0, textAlign: "right" }}>
              <div style={{ fontSize: "28px", fontFamily: "'Bebas Neue', cursive", color: totalPct === 100 ? "#1daa6a" : "#8a4aff", letterSpacing: "0.05em" }}>{totalPct}%</div>
              <div style={{ fontSize: "12px", color: t.textMuted }}>{totalDone} of {goals.length} done</div>
            </div>
          )}
        </div>

        {/* Add Goal */}
        <div style={{ background: t.surface, border: `${t.borderWidth} solid ${t.border}`, borderRadius: "18px", padding: "18px", marginBottom: "28px", display: "flex", gap: "10px", alignItems: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", transition: "background 0.3s" }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addGoal()}
            placeholder="Write a new goal… then drag it into a time bucket below"
            style={{ flex: 1, background: t.inputBg, border: `${t.borderWidth} solid ${t.border}`, borderRadius: "10px", padding: "11px 15px", color: t.text, fontSize: "14px", fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "background 0.3s, color 0.3s" }}
          />
          <button onClick={addGoal} style={{ background: "linear-gradient(135deg, #5a4aff, #a06aff)", border: "none", borderRadius: "10px", padding: "11px 20px", color: "#fff", fontSize: "18px", cursor: "pointer" }}>+</button>
        </div>

        {/* Inbox */}
        {inbox.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "12px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              📥 Inbox — drag goals into a bucket below
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {inbox.map(goal => (
                <div key={goal.id} draggable onDragStart={(e) => handleDragStart(e, goal.id)}
                  style={{ background: t.inboxBg, border: `${t.borderWidth} solid ${t.inboxBorder}`, borderRadius: "10px", padding: "8px 14px", fontSize: "13px", color: t.inboxText, fontFamily: "'DM Sans', sans-serif", cursor: "grab", userSelect: "none", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "background 0.3s" }}
                >
                  <span style={{ opacity: 0.4, fontSize: "11px" }}>⠿</span>
                  {goal.text}
                  {goal.aiCapable && <span style={{ fontSize: "10px", color: "#8a4aff" }}>✦</span>}
                  <button onClick={() => deleteGoal(goal.id)} style={{ background: "none", border: "none", color: "#c07070", cursor: "pointer", padding: 0, fontSize: "12px", marginLeft: "2px" }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4 Columns */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {COLUMNS.map(col => (
            <Column key={col.id} col={col} goals={goals.filter(g => g.bucket === col.id)} t={t}
              onToggle={toggleGoal} onDelete={deleteGoal} onAIHelp={setAiGoal}
              onDragStart={handleDragStart}
              onDrop={(e) => handleDrop(e, col.id)}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              isDragOver={dragOverCol === col.id}
              onSelectGoal={handleSelectGoal}
              selectedGoalId={selectedGoalId}
            />
          ))}
        </div>

        {goals.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 20px", color: t.emptyText }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>◌</div>
            <p style={{ fontSize: "15px", margin: 0 }}>Add your first goal above, then drag it into a time bucket</p>
          </div>
        )}

        {/* AI Summary Panel */}
        {summaryGoal && (
          <div ref={summaryRef} style={{
            marginTop: "32px",
            background: dark ? "linear-gradient(135deg, #0e0e2a, #0a0a1e)" : "linear-gradient(135deg, #f4f4ff, #eeeeff)",
            border: `2px solid #6a4aff44`,
            borderRadius: "20px", padding: "28px 32px",
            boxShadow: "0 0 40px rgba(106,74,255,0.12)",
            transition: "all 0.3s ease",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", gap: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "16px" }}>✦</span>
                  <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: "18px", letterSpacing: "0.1em", color: "#8a4aff" }}>AI ACTION PLAN</span>
                  <span style={{ background: COLUMNS.find(c => c.id === summaryGoal.bucket)?.accent, color: "#fff", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em" }}>
                    {summaryGoal.colLabel?.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "15px", fontFamily: "'DM Sans', sans-serif", color: t.text, fontWeight: 500 }}>
                  {summaryGoal.text}
                </p>
              </div>
              <button onClick={() => { setSummaryGoal(null); setSelectedGoalId(null); }} style={{ background: "transparent", border: `1px solid ${dark ? "#3a2a5a" : "#c0b0e0"}`, borderRadius: "8px", color: t.textMuted, padding: "6px 12px", cursor: "pointer", fontSize: "12px", fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
                Dismiss
              </button>
            </div>

            {summaryLoading ? (
              <div style={{ display: "flex", gap: "6px", alignItems: "center", padding: "8px 0" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#8a4aff", animation: `pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
                ))}
                <span style={{ marginLeft: "8px", color: t.textMuted, fontSize: "13px", fontFamily: "'DM Sans', sans-serif" }}>Generating your plan…</span>
              </div>
            ) : (
              <div style={{ fontSize: "14px", fontFamily: "'DM Sans', sans-serif", color: t.textCard, lineHeight: "1.7" }}
                dangerouslySetInnerHTML={{ __html: summaryText
                  .replace(/\*\*(.*?)\*\*/g, `<strong style="color:${dark ? "#c0a0ff" : "#6a4aff"}">$1</strong>`)
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/^- (.+)$/gm, `<div style="display:flex;gap:8px;margin:4px 0"><span style="color:#8a4aff;flex-shrink:0">•</span><span>$1</span></div>`)
                  .replace(/\n/g, '<br/>')
                }} />
            )}

            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button
                onClick={() => setAiGoal(summaryGoal)}
                style={{ background: "linear-gradient(135deg, #5a4aff, #a06aff)", border: "none", borderRadius: "10px", padding: "9px 18px", color: "#fff", fontSize: "13px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer" }}
              >
                ✦ Chat with AI about this goal
              </button>
            </div>
          </div>
        )}

        <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:0.5} 50%{transform:scale(1.3);opacity:1} }`}</style>
      </div>

      {aiGoal && <AIPanel goal={aiGoal} onClose={() => setAiGoal(null)} t={t} />}

      <RecycleBin
        bin={bin}
        dark={dark}
        onRestore={restoreGoal}
        onPermanentDelete={permanentDelete}
        onDrop={handleDropBin}
        onDragOver={(e) => { e.preventDefault(); setDragOverBin(true); }}
        onDragLeave={() => setDragOverBin(false)}
        isDragOver={dragOverBin}
      />
    </div>
  );
}
