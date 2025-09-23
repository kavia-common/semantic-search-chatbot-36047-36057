import React, { useEffect, useState } from "react";
import { theme } from "../theme";
import { deleteDocument, listDocuments, retrieve, uploadDocuments } from "../api";

// PUBLIC_INTERFACE
export default function DocumentManager() {
  /** UI for uploading, listing, deleting documents and trying a retrieve query. */
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  async function refresh() {
    setBusy(true);
    try {
      const data = await listDocuments();
      setDocs(Array.isArray(data) ? data : data?.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setBusy(true);
    try {
      const resp = await uploadDocuments(files);
      if (resp?.errors?.length) {
        const msg = resp.errors.map(e => `${e.file}: ${e.error}`).join("\n");
        alert(`Some files failed to upload:\n${msg}`);
      }
      await refresh();
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this document?")) return;
    setBusy(true);
    try {
      await deleteDocument(id);
      await refresh();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function onRetrieve() {
    if (!query.trim()) return;
    setBusy(true);
    try {
      const r = await retrieve(query, 5);
      setResults(Array.isArray(r) ? r : r?.results || []);
    } catch (err) {
      alert(`Retrieve failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerCard}>
        <div>
          <div style={styles.title}>Documents</div>
          <div style={styles.subtitle}>Manage your corpus for retrieval-augmented chat.</div>
        </div>
        <label style={styles.uploadBtn}>
          <input multiple type="file" style={{ display: "none" }} onChange={onUpload} />
          Upload
        </label>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>Library</div>
          <div style={styles.docList}>
            {busy && docs.length === 0 && <div style={styles.empty}>Loading...</div>}
            {!busy && docs.length === 0 && <div style={styles.empty}>No documents</div>}
            {docs.map((d) => (
              <div key={d.id || d.pk || d.path} style={styles.docItem}>
                <div style={styles.docMeta}>
                  <div style={styles.docTitle}>{d.name || d.title || d.filename || "Document"}</div>
                  <div style={styles.docSub}>{d.size ? `${Math.round(d.size / 1024)} KB` : (d.mime_type || d.created_at || d.id)}</div>
                </div>
                <button style={styles.deleteBtn} onClick={() => onDelete(d.id || d.pk)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>Try Retrieval</div>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={styles.inputRow}>
              <input
                style={styles.input}
                placeholder="Enter a semantic query..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button style={styles.secondaryBtn} onClick={onRetrieve} disabled={!query.trim() || busy}>
                Search
              </button>
            </div>
            <div style={styles.results}>
              {results.length === 0 && <div style={styles.empty}>No results yet</div>}
              {results.map((r, idx) => (
                <div key={idx} style={styles.resultItem}>
                  <div style={styles.resultTitle}>{r.title || r.id || `Result ${idx + 1}`}</div>
                  <div style={styles.resultMeta}>
                    Score: {typeof r.score === "number" ? r.score.toFixed(3) : r.score || "n/a"}
                  </div>
                  {r.snippet && <div style={styles.snippet}>{r.snippet}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "grid",
    gap: 12,
    height: "100%",
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
  uploadBtn: {
    padding: "10px 14px",
    background: theme.colors.primary,
    color: "#fff",
    borderRadius: theme.radii.md,
    cursor: "pointer",
    border: "none",
    boxShadow: theme.shadows.sm,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  card: {
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.lg,
    padding: 16,
    boxShadow: theme.shadows.sm,
    display: "grid",
    gap: 10,
  },
  cardHeader: {
    fontWeight: 600,
    color: theme.colors.text,
    marginBottom: 4,
  },
  docList: {
    display: "grid",
    gap: 8,
    maxHeight: 360,
    overflowY: "auto",
  },
  docItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.md,
    padding: "10px 12px",
    background: theme.colors.surface,
  },
  docMeta: {
    display: "grid",
    gap: 2,
  },
  docTitle: {
    fontWeight: 600,
    color: theme.colors.text,
  },
  docSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  deleteBtn: {
    border: "none",
    background: theme.colors.error,
    color: "#fff",
    padding: "8px 10px",
    borderRadius: theme.radii.sm,
    cursor: "pointer",
  },
  inputRow: {
    display: "flex",
    gap: 8,
  },
  input: {
    flex: 1,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.md,
    padding: "10px 12px",
    background: theme.colors.surfaceAlt,
  },
  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: theme.radii.md,
    background: theme.colors.secondary,
    color: "#111827",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
  },
  results: {
    display: "grid",
    gap: 8,
    maxHeight: 360,
    overflowY: "auto",
  },
  resultItem: {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radii.md,
    padding: 12,
    background: theme.colors.surface,
  },
  resultTitle: {
    fontWeight: 600,
    color: theme.colors.text,
  },
  resultMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  snippet: {
    fontSize: 14,
    color: theme.colors.text,
    whiteSpace: "pre-wrap",
  },
  empty: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
};
