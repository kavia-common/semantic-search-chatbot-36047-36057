import React from "react";
import { theme } from "../theme";

// PUBLIC_INTERFACE
export default function Sidebar({
  chats = [],
  selectedChatId,
  onSelectChat,
  onCreateChat,
  onDeleteChat,
  onRenameChat,
  onNavigate,
  activeRoute = "chat",
}) {
  /** Sidebar with navigation and chat list. */

  return (
    <aside style={styles.aside}>
      <div style={styles.brand}>
        <div style={styles.logo}>💬</div>
        <div>
          <div style={styles.brandTitle}>RAG Chat</div>
          <div style={styles.brandSub}>Ocean Professional</div>
        </div>
      </div>

      <nav style={styles.nav}>
        <button
          style={{ ...styles.navBtn, ...(activeRoute === "chat" ? styles.navBtnActive : {}) }}
          onClick={() => onNavigate("chat")}
        >
          <span>Chat</span>
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeRoute === "docs" ? styles.navBtnActive : {}) }}
          onClick={() => onNavigate("docs")}
        >
          <span>Documents</span>
        </button>
      </nav>

      <div style={styles.sectionHeader}>
        <span>Conversations</span>
        <button style={styles.addBtn} onClick={onCreateChat} title="New chat">
          ＋
        </button>
      </div>

      <div style={styles.chatList}>
        {chats.length === 0 && <div style={styles.empty}>No chats yet</div>}
        {chats.map((c) => (
          <div
            key={c.id}
            style={{
              ...styles.chatItem,
              ...(selectedChatId === c.id ? styles.chatItemActive : {}),
            }}
            onClick={() => onSelectChat(c.id)}
          >
            <div style={styles.chatTitle} title={c.title || "Untitled chat"}>
              {c.title || "Untitled chat"}
            </div>
            <div style={styles.chatItemActions} onClick={(e) => e.stopPropagation()}>
              <button
                style={styles.iconBtn}
                title="Rename"
                onClick={() => {
                  const name = prompt("Rename chat", c.title || "Untitled chat");
                  if (name != null) onRenameChat(c.id, name);
                }}
              >
                ✎
              </button>
              <button style={styles.iconBtn} title="Delete" onClick={() => onDeleteChat(c.id)}>
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
      <div style={styles.footer}>
        <div style={styles.footerCard}>
          <div style={styles.footerTitle}>Pro tip</div>
          <div style={styles.footerText}>Use Documents to upload PDFs and text files for RAG.</div>
        </div>
      </div>
    </aside>
  );
}

const styles = {
  aside: {
    width: 300,
    background: `linear-gradient(180deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientTo})`,
    borderRight: `1px solid ${theme.colors.border}`,
    display: "flex",
    flexDirection: "column",
    padding: 16,
    gap: 12,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 8,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.full,
    background: theme.colors.primary,
    color: "white",
    display: "grid",
    placeItems: "center",
    boxShadow: theme.shadows.md,
  },
  brandTitle: {
    fontWeight: 700,
    color: theme.colors.text,
  },
  brandSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  nav: {
    display: "grid",
    gap: 8,
  },
  navBtn: {
    padding: "10px 12px",
    borderRadius: theme.radii.md,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.surface,
    color: theme.colors.text,
    cursor: "pointer",
    textAlign: "left",
    transition: theme.transitions.base,
  },
  navBtnActive: {
    borderColor: theme.colors.primary,
    boxShadow: `0 0 0 3px rgba(37,99,235,0.15)`,
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  addBtn: {
    border: "none",
    background: theme.colors.primary,
    color: "#fff",
    width: 24,
    height: 24,
    borderRadius: theme.radii.full,
    cursor: "pointer",
    transition: theme.transitions.base,
  },
  chatList: {
    display: "grid",
    gap: 6,
    overflowY: "auto",
    paddingRight: 6,
  },
  chatItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "10px 12px",
    background: theme.colors.surface,
    borderRadius: theme.radii.md,
    border: `1px solid ${theme.colors.border}`,
    cursor: "pointer",
    transition: theme.transitions.base,
  },
  chatItemActive: {
    borderColor: theme.colors.secondary,
    boxShadow: `0 0 0 3px rgba(245,158,11,0.18)`,
  },
  chatTitle: {
    flex: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  chatItemActions: {
    display: "flex",
    gap: 4,
  },
  iconBtn: {
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.surfaceAlt,
    color: theme.colors.text,
    width: 28,
    height: 28,
    borderRadius: theme.radii.sm,
    cursor: "pointer",
  },
  empty: {
    fontSize: 13,
    color: theme.colors.textMuted,
    padding: "8px 0",
  },
  footer: {
    marginTop: "auto",
  },
  footerCard: {
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.lg,
    padding: 12,
    boxShadow: theme.shadows.sm,
  },
  footerTitle: {
    fontWeight: 600,
    marginBottom: 6,
    color: theme.colors.primary,
    fontSize: 14,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
};
