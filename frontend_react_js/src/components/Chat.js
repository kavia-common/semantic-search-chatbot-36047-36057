import React, { useEffect, useMemo, useRef, useState } from "react";
import { theme } from "../theme";
import { sendMessage } from "../api";

// Message bubble component
function Bubble({ role, content, sources = [] }) {
  const isUser = role === "user";
  return (
    <div style={{ ...styles.bubbleRow, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div
        style={{
          ...styles.bubble,
          ...(isUser ? styles.userBubble : styles.assistantBubble),
        }}
      >
        <div style={styles.bubbleContent}>{content}</div>
        {!isUser && sources && sources.length > 0 && (
          <div style={styles.sources}>
            {sources.map((s, i) => (
              <a
                key={i}
                href={s.url || "#"}
                title={s.snippet || s.title || "Reference"}
                style={styles.sourceTag}
                target="_blank"
                rel="noreferrer"
              >
                {s.title || s.id || `Ref ${i + 1}`}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function ChatView({
  chat,
  onSend,
  onStreamingStart,
  onStreamingEnd,
  disabled = false,
}) {
  /**
   * Chat UI for a single chat session.
   * chat = { id, messages: [{role, content, sources?}] }
   */
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [partial, setPartial] = useState("");
  const endRef = useRef(null);

  const canSend = input.trim().length > 0 && !streaming && !disabled;
  const messages = useMemo(() => chat?.messages || [], [chat]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, partial, streaming]);

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!canSend) return;
    const text = input.trim();
    setInput("");
    setPartial("");
    setStreaming(true);
    onStreamingStart?.();

    // Optimistic local user message
    onSend?.({ role: "user", content: text });

    try {
      const result = await sendMessage({
        chatId: chat?.id,
        message: text,
        stream: true,
      });
      if (result?.stream) {
        for await (const chunk of result.stream) {
          const token = chunk?.token || chunk?.delta || chunk?.content || "";
          if (chunk?.error) throw new Error(chunk.error);
          setPartial((p) => (token ? p + token : p));
        }
      } else if (result?.answer) {
        setPartial(result.answer);
      }
    } catch (err) {
      setPartial(`Error: ${err.message}`);
    } finally {
      setStreaming(false);
      onStreamingEnd?.(partial);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerCard}>
        <div>
          <div style={styles.title}>Chat</div>
          <div style={styles.subtitle}>Ask anything about your uploaded documents.</div>
        </div>
      </div>

      <div style={styles.messages}>
        {messages.map((m, idx) => (
          <Bubble key={idx} role={m.role} content={m.content} sources={m.sources} />
        ))}
        {streaming && partial && <Bubble role="assistant" content={partial} />}
        <div ref={endRef} style={{ height: 1 }} />
      </div>

      <form style={styles.inputRow} onSubmit={handleSubmit}>
        <input
          style={styles.input}
          placeholder="Ask a question..."
          value={input}
          disabled={streaming || disabled}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          style={{
            ...styles.sendBtn,
            ...(canSend ? {} : styles.sendBtnDisabled),
          }}
          disabled={!canSend}
          type="submit"
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    gridTemplateRows: "auto 1fr auto",
    height: "100%",
    gap: 12,
  },
  headerCard: {
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.lg,
    padding: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: theme.shadows.sm,
  },
  title: {
    fontWeight: 700,
    fontSize: 18,
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  messages: {
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "4px 2px",
  },
  bubbleRow: {
    width: "100%",
    display: "flex",
  },
  bubble: {
    maxWidth: "75%",
    padding: "10px 12px",
    borderRadius: theme.radii.lg,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.sm,
    fontSize: 15,
    lineHeight: 1.4,
  },
  userBubble: {
    alignSelf: "flex-end",
    background: theme.colors.primary,
    color: "#fff",
    borderColor: "transparent",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    background: theme.colors.surface,
  },
  bubbleContent: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  sources: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  sourceTag: {
    fontSize: 12,
    padding: "4px 8px",
    background: theme.colors.surfaceAlt,
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.text,
    borderRadius: theme.radii.full,
    textDecoration: "none",
  },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: 6,
    background: theme.colors.surface,
    borderRadius: theme.radii.lg,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.sm,
  },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    padding: "12px 14px",
    borderRadius: theme.radii.md,
    background: theme.colors.surfaceAlt,
  },
  sendBtn: {
    padding: "0 16px",
    borderRadius: theme.radii.md,
    border: "none",
    background: theme.colors.secondary,
    color: "#111827",
    fontWeight: 700,
    cursor: "pointer",
    transition: theme.transitions.base,
  },
  sendBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};
