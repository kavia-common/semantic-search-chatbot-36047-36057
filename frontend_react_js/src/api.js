import { getApiBase } from "./theme";

const API_BASE = getApiBase();

// Helper to handle JSON responses and errors
async function handleJson(res) {
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    let errDetail = "";
    try {
      if (contentType.includes("application/json")) {
        const data = await res.json();
        errDetail = data.detail || JSON.stringify(data);
      } else {
        errDetail = await res.text();
      }
    } catch {
      // ignore
    }
    throw new Error(errDetail || `Request failed with status ${res.status}`);
  }
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

// PUBLIC_INTERFACE
export async function getHealth() {
  /** Check backend health endpoint if available. */
  try {
    const res = await fetch(`${API_BASE}/health/`, { credentials: "include" });
    return await handleJson(res);
  } catch (e) {
    return { status: "error", detail: e.message };
  }
}

// PUBLIC_INTERFACE
export async function listDocuments() {
  /** List all uploaded documents metadata. */
  const res = await fetch(`${API_BASE}/documents/`, { credentials: "include" });
  return handleJson(res);
}

// PUBLIC_INTERFACE
export async function deleteDocument(docId) {
  /** Delete a document by id. */
  const res = await fetch(`${API_BASE}/documents/${encodeURIComponent(docId)}/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) {
    await handleJson(res);
  }
  return true;
}

// PUBLIC_INTERFACE
export async function uploadDocuments(files, options = {}) {
  /** 
   * Upload one or more files for ingestion.
   * Backend expects: multipart/form-data with fields:
   * - title (string)
   * - file (single file)
   * We send files one-by-one and aggregate results.
   */
  const results = [];
  const errors = [];

  for (const f of files) {
    const form = new FormData();
    const defaultTitle = (f?.name || "Untitled").replace(/\.[^/.]+$/, "") || (f?.name || "Untitled");
    form.append("title", options.title || defaultTitle);
    form.append("file", f);

    try {
      const res = await fetch(`${API_BASE}/documents/upload/`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = await handleJson(res);
      results.push(data);
    } catch (e) {
      errors.push({ file: f?.name || "unknown", error: e?.message || String(e) });
    }
  }

  if (errors.length && !results.length) {
    // If all failed, throw a combined error
    const detail = errors.map(er => `${er.file}: ${er.error}`).join("; ");
    throw new Error(detail);
  }
  // Return combined response to allow caller to refresh list
  return { results, errors };
}

// PUBLIC_INTERFACE
export async function listChats() {
  /** Get chat history (conversations). */
  const res = await fetch(`${API_BASE}/chats/`, { credentials: "include" });
  return handleJson(res);
}

// PUBLIC_INTERFACE
export async function createChat(title) {
  /** Create a new chat session. */
  const res = await fetch(`${API_BASE}/chats/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title }),
  });
  return handleJson(res);
}

// PUBLIC_INTERFACE
export async function getChat(chatId) {
  /** Get messages for a chatId. */
  const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(chatId)}/`, { credentials: "include" });
  return handleJson(res);
}

// PUBLIC_INTERFACE
export async function deleteChat(chatId) {
  /** Delete a chat session */
  const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(chatId)}/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok && res.status !== 204) {
    await handleJson(res);
  }
  return true;
}

// PUBLIC_INTERFACE
export async function renameChat(chatId, title) {
  /** Rename a chat session */
  const res = await fetch(`${API_BASE}/chats/${encodeURIComponent(chatId)}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title }),
  });
  return handleJson(res);
}

// PUBLIC_INTERFACE
export async function sendMessage({ chatId, message, topK = 5, temperature = 0.2, stream = true }) {
  /**
   * Send a message to the RAG chat endpoint.
   * If stream=true, returns a reader that yields incremental tokens.
   * Otherwise returns the final JSON response.
   */
  const url = `${API_BASE}/chat/`;
  const headers = { "Content-Type": "application/json" };
  const body = JSON.stringify({ chat_id: chatId, message, top_k: topK, temperature, stream });

  const res = await fetch(url, {
    method: "POST",
    headers,
    body,
    credentials: "include",
  });

  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    await handleJson(res); // throws
  }

  if (stream && contentType.includes("text/event-stream")) {
    // SSE streaming
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    async function* sseGenerator() {
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          const line = part.trim();
          if (!line) continue;
          // Expect format: "data: {json}"
          const dataLine = line.startsWith("data:") ? line.slice(5).trim() : line;
          try {
            const parsed = JSON.parse(dataLine);
            yield parsed;
          } catch {
            yield { token: dataLine };
          }
        }
      }
      if (buffer) {
        yield { token: buffer };
      }
    }
    return { mode: "sse", stream: sseGenerator() };
  }

  if (stream) {
    // Fallback: server sends text/plain with incremental chunks separated by \n
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    async function* textStream() {
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        acc += chunk;
        const parts = acc.split("\n");
        acc = parts.pop() || "";
        for (const p of parts) yield { token: p };
      }
      if (acc) yield { token: acc };
    }
    return { mode: "text", stream: textStream() };
  }

  return handleJson(res);
}

// PUBLIC_INTERFACE
export async function retrieve(query, topK = 5) {
  /** Explicit semantic retrieve endpoint for previewing results. */
  const res = await fetch(`${API_BASE}/retrieve/?q=${encodeURIComponent(query)}&k=${encodeURIComponent(topK)}`, {
    credentials: "include",
  });
  return handleJson(res);
}
