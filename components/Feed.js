"use client";
import { useCallback, useEffect, useState } from "react";
import { api, severityClass, timeAgo } from "../lib/api";
import { ChevronIcon, PawIcon, RefreshIcon } from "./Icons";

const FILTERS = [
  { id: "", label: "All" },
  { id: "REPORTED", label: "Unclaimed" },
  { id: "CLAIMED", label: "Claimed" },
];

export default function Feed({ onOpenCase, refreshKey }) {
  const [filter, setFilter] = useState("");
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setCases(await api.getCases(filter));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load();
    const timer = setInterval(load, 30000); // keep the feed fresh
    return () => clearInterval(timer);
  }, [load, refreshKey]);

  const openCount = cases.filter((c) => c.status === "REPORTED").length;

  return (
    <section className="stack-sm">
      <div className="row-between">
        <div>
          <h1 className="page-title">Active rescue cases</h1>
          <p className="muted">{loading ? "Loading…" : `${cases.length} cases · ${openCount} unclaimed`}</p>
        </div>
        <button className="icon-btn" aria-label="Refresh" onClick={load}>
          <RefreshIcon />
        </button>
      </div>

      <div className="row gap wrap">
        {FILTERS.map((f) => (
          <button
            key={f.id || "all"}
            className={`chip ${filter === f.id ? "chip-active" : ""}`}
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}

      {!loading && !error && cases.length === 0 && (
        <div className="card center muted">No cases here right now.</div>
      )}

      {cases.map((c) => (
        <button key={c.id} className="card case-card" onClick={() => onOpenCase(c)}>
          <CaseThumb id={c.id} />
          <span className="stack-xs flex-1 min-0">
            <span className="row-between">
              <span className="strong">{c.species}</span>
              <span className="muted small">{timeAgo(c.created_at)}</span>
            </span>
            <span className="row gap wrap">
              <span className={`badge ${severityClass(c.severity_level)}`}>{c.severity_level}</span>
              <span className={`badge ${c.status === "CLAIMED" ? "status-claimed" : "status-reported"}`}>{c.status}</span>
            </span>
            <span className="muted small ellipsis">{c.description || "No description"}</span>
          </span>
          <ChevronIcon />
        </button>
      ))}
    </section>
  );
}

function CaseThumb({ id }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="thumb">
      {failed ? <PawIcon size={26} /> : <img src={api.animalImageUrl(id)} alt="" loading="lazy" onError={() => setFailed(true)} />}
    </span>
  );
}
