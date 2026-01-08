import { useEffect, useMemo, useState } from "react";
import { fetchFindings } from "./api";
import type { Finding } from "./api";
import "./App.css";

type Severity = Finding["severity"];

function colorFor(sev: Severity) {
  if (sev === "CRITICAL") return "#dc2626";
  if (sev === "HIGH") return "#f97316";
  if (sev === "MEDIUM") return "#eab308";
  return "#6b7280";
}

function severityRank(sev: Severity): number {
  return { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }[sev] ?? 9;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function App() {
  const [items, setItems] = useState<Finding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFindings();
      data.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
      setItems(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((x) => (x.status || "OPEN").toUpperCase() === filter);
  }, [items, filter]);

  const apiUrl = `${import.meta.env.VITE_API_BASE}/findings`;

  return (
    <div className="page">
      <header className="header">
        <div className="title">
          {/* Align 🐊 with the title baseline */}
          <div className="logo" aria-hidden="true">
            🐊
          </div>

          <div className="titleText">
            <h1 className="h1">Black Caiman</h1>
            <div className="subtitle">AWS Security Findings Dashboard</div>
            <div className="meta">API: {apiUrl}</div>
          </div>
        </div>

        <div className="actions">
          <select
            className="select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            aria-label="Filter findings"
          >
            <option value="ALL">All</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>

          <button className="btn" onClick={load}>
            Refresh
          </button>
        </div>
      </header>

      {loading && <p className="note">Loading findings…</p>}

      {error && (
        <div className="error">
          <b>Error:</b> {error}
          <div className="hint">
            If you see 401 Unauthorized: make sure <code>VITE_API_TOKEN</code> in{" "}
            <code>.env</code> matches Lambda <code>API_TOKEN</code>, then restart{" "}
            <code>npm run dev</code>.
          </div>
        </div>
      )}

      <main className="grid">
        {!loading && !error && filtered.length === 0 && (
          <div className="empty">
            No findings found.
            <div className="hint">
              If you expect findings: run a scan (Lambda Test or EventBridge schedule)
              and refresh.
            </div>
          </div>
        )}

        {filtered.map((f) => {
          const statusUpper = String(f.status || "OPEN").toUpperCase();
          const isClosed = statusUpper === "CLOSED";

          return (
            <article key={f.findingId} className="card">
              <div className="cardTop">
                <span className="pill" style={{ background: colorFor(f.severity) }}>
                  {f.severity}
                </span>

                <div className="cardTitle">{f.title || "(Untitled finding)"}</div>

                <span className={`status ${isClosed ? "closed" : "open"}`}>
                  {statusUpper}
                </span>
              </div>

              {/* KEY FIX: rows never overlap because label/value are in a 2-col grid */}
              <div className="rows">
                <div className="row">
                  <span className="k">Resource</span>
                  <span className="v">
                    {f.resourceType} / <code>{f.resourceId}</code>
                  </span>
                </div>

                <div className="row">
                  <span className="k">Region</span>
                  <span className="v">{f.region}</span>
                </div>

                <div className="row">
                  <span className="k">First seen</span>
                  <span className="v">{formatDate(f.firstSeenAt)}</span>
                </div>

                <div className="row">
                  <span className="k">Last seen</span>
                  <span className="v">{formatDate(f.lastSeenAt)}</span>
                </div>

                <div className="row">
                  <span className="k">Recommendation</span>
                  <span className="v vWrap">{f.recommendation}</span>
                </div>
              </div>

              <details className="details">
                <summary>Show Terraform fix</summary>
                <pre className="code">{f.terraformHint}</pre>
              </details>
            </article>
          );
        })}
      </main>
    </div>
  );
}
