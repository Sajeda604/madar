import { useState, useRef, useEffect } from "react";

/**
 * MadarChatBot — Chat bubble widget
 * يندمج مع تطبيق Laravel + React/TS
 *
 * Props:
 *   apiUrl  — رابط الـ FastAPI endpoint
 *   lang    — "ar" | "en"  (default: "ar")
 */

const SUGGESTED = [
  "كيف أنشئ مشروع جديد؟",
  "كيف أضيف مهمة جديدة؟",
  "كيف أضيف مستخدم؟",
  "كيف أفتح التقارير؟",
  "كيف أعدّل الإعدادات؟",
  "كيف أنشئ فريقاً؟",
];

const GREETINGS = ["مرحبا","أهلاً","أهلا","هاي","السلام عليكم","صباح الخير","مساء الخير"];

function isGreeting(text) {
  return GREETINGS.some((g) => text.trim().includes(g));
}

function greetingReply(text) {
  if (text.includes("صباح الخير")) return "صباح النور! 🌸 كيف يمكنني مساعدتك اليوم؟";
  if (text.includes("مساء الخير")) return "مساء النور! 🌸 كيف يمكنني مساعدتك اليوم؟";
  return "مرحباً! 👋 أنا مساعد نظام Madar. كيف يمكنني مساعدتك؟";
}

const S = {
  fab: {
    position: "fixed",
    bottom: "28px",
    right: "28px",
    width: "58px",
    height: "58px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #c2185b 0%, #e91e8c 100%)",
    boxShadow: "0 6px 24px rgba(194,24,91,.45)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    transition: "transform .2s, box-shadow .2s",
  },
  fabHover: {
    transform: "scale(1.1)",
    boxShadow: "0 10px 30px rgba(194,24,91,.55)",
  },
  window: {
    position: "fixed",
    bottom: "96px",
    right: "28px",
    width: "370px",
    maxHeight: "580px",
    borderRadius: "20px",
    background: "#fff",
    boxShadow: "0 20px 60px rgba(0,0,0,.18)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 9998,
    fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
    animation: "madarSlideUp .25s ease",
  },
  header: {
    background: "linear-gradient(135deg, #c2185b 0%, #e91e8c 100%)",
    padding: "16px 18px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#fff",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "rgba(255,255,255,.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },
  headerTitle: { fontWeight: 700, fontSize: "15px", marginBottom: "2px" },
  headerSub: { fontSize: "11px", opacity: 0.85 },
  closeBtn: {
    marginLeft: "auto",
    background: "rgba(255,255,255,.2)",
    border: "none",
    color: "#fff",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestions: {
    padding: "10px 14px 6px",
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    borderBottom: "1px solid #f0f0f0",
    background: "#fafafa",
  },
  chip: {
    background: "#fce4ec",
    color: "#c2185b",
    border: "1px solid #f8bbd0",
    borderRadius: "20px",
    padding: "4px 10px",
    fontSize: "11px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background .15s",
    fontFamily: "inherit",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    direction: "rtl",
  },
  bubble: (role) => ({
    maxWidth: "82%",
    padding: "10px 14px",
    borderRadius: role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
    background: role === "user"
      ? "linear-gradient(135deg, #c2185b, #e91e8c)"
      : "#f5f5f5",
    color: role === "user" ? "#fff" : "#333",
    fontSize: "13.5px",
    lineHeight: "1.55",
    alignSelf: role === "user" ? "flex-start" : "flex-end",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    boxShadow: role === "user"
      ? "0 2px 8px rgba(194,24,91,.25)"
      : "0 2px 6px rgba(0,0,0,.07)",
  }),
  time: {
    fontSize: "10px",
    color: "#bbb",
    textAlign: "center",
    margin: "2px 0",
  },
  typing: {
    display: "flex",
    gap: "4px",
    alignSelf: "flex-end",
    padding: "10px 14px",
    background: "#f5f5f5",
    borderRadius: "18px 18px 18px 4px",
  },
  dot: (i) => ({
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#c2185b",
    animation: `madarBounce .9s ${i * 0.15}s infinite`,
  }),
  inputArea: {
    padding: "12px 14px",
    borderTop: "1px solid #f0f0f0",
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
    background: "#fff",
  },
  textarea: {
    flex: 1,
    border: "1.5px solid #e0e0e0",
    borderRadius: "14px",
    padding: "9px 13px",
    fontSize: "13px",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    direction: "rtl",
    maxHeight: "90px",
    transition: "border-color .2s",
    lineHeight: 1.5,
  },
  sendBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #c2185b, #e91e8c)",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 3px 10px rgba(194,24,91,.35)",
    transition: "transform .15s",
  },
};

// ── Component ────────────────────────────────────────────────────────────────
// ✅ تم تغيير الرابط الافتراضي من localhost إلى HuggingFace
export default function MadarChatBot({
  apiUrl = "https://sajeddda-chatbot3.hf.space/chat",
  lang = "ar",
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "مرحباً بك في مساعد نظام **Madar** 🌸\nكيف يمكنني مساعدتك اليوم؟",
      ts: now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [fabHover, setFabHover] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const id = "madar-keyframes";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes madarSlideUp {
        from { opacity:0; transform:translateY(16px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes madarBounce {
        0%,80%,100% { transform:translateY(0); }
        40%          { transform:translateY(-6px); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  function now() {
    return new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
  }

  async function send(text) {
    const q = (text || input).trim();
    if (!q || loading) return;
    setInput("");

    const userMsg = { role: "user", text: q, ts: now() };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);

    if (isGreeting(q)) {
      setTimeout(() => {
        setMessages((m) => [...m, { role: "assistant", text: greetingReply(q), ts: now() }]);
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: "assistant", text: data.answer || "عذراً، لم أجد إجابة.", ts: now() },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: "⚠️ تعذّر الاتصال بالخادم.\nتحقق من تشغيل الـ API على HuggingFace.",
          ts: now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function renderText(txt) {
    const parts = txt.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p
    );
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        style={{ ...S.fab, ...(fabHover ? S.fabHover : {}) }}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setFabHover(true)}
        onMouseLeave={() => setFabHover(false)}
        title="مساعد Madar"
        aria-label="Open Madar chatbot"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div style={S.window} role="dialog" aria-label="Madar Chat Assistant">
          <div style={S.header}>
            <div style={S.avatar}>🤖</div>
            <div>
              <div style={S.headerTitle}>مساعد Madar الذكي</div>
              <div style={S.headerSub}>● متصل الآن</div>
            </div>
            <button style={S.closeBtn} onClick={() => setOpen(false)} aria-label="Close">✕</button>
          </div>

          <div style={S.suggestions}>
            {SUGGESTED.map((q) => (
              <button
                key={q}
                style={S.chip}
                onClick={() => send(q)}
                onMouseEnter={(e) => (e.target.style.background = "#f48fb1")}
                onMouseLeave={(e) => (e.target.style.background = "#fce4ec")}
              >
                {q}
              </button>
            ))}
          </div>

          <div style={S.messages}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column" }}>
                <div style={S.bubble(m.role)}>{renderText(m.text)}</div>
                <span
                  style={{
                    ...S.time,
                    textAlign: m.role === "user" ? "right" : "left",
                    paddingRight: m.role === "user" ? "4px" : 0,
                    paddingLeft: m.role === "assistant" ? "4px" : 0,
                  }}
                >
                  {m.ts}
                </span>
              </div>
            ))}

            {loading && (
              <div style={S.typing}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={S.dot(i)} />
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={S.inputArea}>
            <button
              style={S.sendBtn}
              onClick={() => send()}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              disabled={loading}
              aria-label="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
            <textarea
              ref={textareaRef}
              style={S.textarea}
              rows={1}
              placeholder="اكتب سؤالك هنا..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              onFocus={(e) => (e.target.style.borderColor = "#c2185b")}
              onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
              disabled={loading}
            />
          </div>
        </div>
      )}
    </>
  );
}
