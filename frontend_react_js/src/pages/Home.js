import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatView from "../components/Chat";
import DocumentManager from "../components/DocumentManager";
import { theme } from "../theme";
import { createChat, deleteChat, getChat, listChats, renameChat } from "../api";

// PUBLIC_INTERFACE
export default function Home() {
  /** Main layout with sidebar and main content (chat/docs). */
  const [route, setRoute] = useState("chat"); // "chat" | "docs"
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messagesByChat, setMessagesByChat] = useState({});
  const [loadingChat, setLoadingChat] = useState(false);

  // Load chat list on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await listChats();
        const items = Array.isArray(data) ? data : data?.results || [];
        setChats(items);
        if (items.length > 0) {
          setSelectedChatId(items[0].id);
        } else {
          // Auto-create first chat for UX
          const created = await createChat("New Chat");
          setChats([created]);
          setSelectedChatId(created.id);
        }
      } catch (e) {
        console.error("Failed to load chats", e);
      }
    })();
  }, []);

  // Load messages when a chat is selected
  useEffect(() => {
    if (!selectedChatId) return;
    (async () => {
      setLoadingChat(true);
      try {
        const data = await getChat(selectedChatId);
        const msgs = data?.messages || [];
        setMessagesByChat((prev) => ({ ...prev, [selectedChatId]: msgs }));
      } catch (e) {
        console.error("Failed to load chat messages", e);
      } finally {
        setLoadingChat(false);
      }
    })();
  }, [selectedChatId]);

  const currentChat = useMemo(() => {
    const base = chats.find((c) => c.id === selectedChatId);
    return {
      ...(base || { id: selectedChatId, title: "New Chat" }),
      messages: messagesByChat[selectedChatId] || [],
    };
  }, [chats, selectedChatId, messagesByChat]);

  async function handleCreateChat() {
    try {
      const created = await createChat("New Chat");
      setChats((prev) => [created, ...prev]);
      setSelectedChatId(created.id);
    } catch (e) {
      alert(`Create chat failed: ${e.message}`);
    }
  }

  async function handleDeleteChat(id) {
    try {
      await deleteChat(id);
      setChats((prev) => prev.filter((c) => c.id !== id));
      setSelectedChatId((prev) => {
        if (prev === id) {
          const remaining = chats.filter((c) => c.id !== id);
          return remaining[0]?.id || null;
        }
        return prev;
      });
    } catch (e) {
      alert(`Delete chat failed: ${e.message}`);
    }
  }

  async function handleRenameChat(id, title) {
    try {
      const updated = await renameChat(id, title);
      setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title: updated.title || title } : c)));
    } catch (e) {
      alert(`Rename chat failed: ${e.message}`);
    }
  }

  function handleSelectChat(id) {
    setSelectedChatId(id);
  }

  function handleStreamingStart() {
    // Optionally show typing indicator
  }

  function handleStreamingEnd(finalText) {
    // When streaming ends, append assistant message if needed
    if (!selectedChatId) return;
    setMessagesByChat((prev) => {
      const list = prev[selectedChatId] || [];
      // Ensure we don't append duplicates; UI displayed streamed text already; backend should persist.
      // For now, append as assistant message to keep local state consistent.
      return { ...prev, [selectedChatId]: [...list, { role: "assistant", content: finalText }] };
    });
  }

  function handleSendLocal(message) {
    // Append local message into view
    if (!selectedChatId) return;
    setMessagesByChat((prev) => {
      const list = prev[selectedChatId] || [];
      return { ...prev, [selectedChatId]: [...list, message] };
    });
  }

  return (
    <div style={styles.wrapper}>
      <Sidebar
        chats={chats}
        selectedChatId={selectedChatId}
        onSelectChat={handleSelectChat}
        onCreateChat={handleCreateChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onNavigate={setRoute}
        activeRoute={route}
      />
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.headerTitle}>Semantic Search RAG Chatbot</div>
          <div style={styles.headerActions}>
            <span style={styles.healthBadge}>Ocean Professional</span>
          </div>
        </header>
        <section style={styles.content}>
          {route === "chat" && (
            <ChatView
              chat={currentChat}
              onSend={handleSendLocal}
              onStreamingStart={handleStreamingStart}
              onStreamingEnd={handleStreamingEnd}
              disabled={loadingChat}
            />
          )}
          {route === "docs" && <DocumentManager />}
        </section>
      </main>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "grid",
    gridTemplateColumns: "300px 1fr",
    height: "100vh",
    background: theme.colors.background,
    color: theme.colors.text,
  },
  main: {
    display: "grid",
    gridTemplateRows: "auto 1fr",
    height: "100%",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: `1px solid ${theme.colors.border}`,
    background: `linear-gradient(90deg, ${theme.colors.gradientFrom}, ${theme.colors.gradientTo})`,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  healthBadge: {
    background: theme.colors.secondary,
    color: "#111827",
    padding: "6px 10px",
    borderRadius: theme.radii.full,
    fontWeight: 700,
    fontSize: 12,
  },
  content: {
    padding: 16,
    height: "100%",
  },
};
