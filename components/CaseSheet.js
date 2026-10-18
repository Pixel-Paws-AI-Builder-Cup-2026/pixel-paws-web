"use client";
import { useState } from "react";
import { api, mapsUrl, severityClass, timeAgo } from "../lib/api";
import { useAuth } from "./AuthProvider";
import { CheckIcon, CloseIcon, PawIcon, PinIcon, SparkleIcon } from "./Icons";

export default function CaseSheet({ data, onClose, onClaimed }) {
  const { requireAuth } = useAuth();
  const [animal, setAnimal] = useState(data);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState("");
  const [imgFailed, setImgFailed] = useState(false);

  const id = animal.id ?? animal.animal_id;
  const claimed = animal.status === "CLAIMED";

  function claim() {
    setError("");
    requireAuth(
      "Sign in to claim this case",
      "We show your name to the person who reported this animal, so they know help is on the way.",
      async (user) => {
        setClaiming(true);
        try {
          const updated = await api.claimCase(id, user.displayName || user.email || "Volunteer");
          setAnimal({ ...animal, ...updated });
          onClaimed(updated);
        } catch (e) {
          setError(e.message);
        } finally {
          setClaiming(false);
        }
      }
    );
  }

  return (
    <div className="sheet-layer">
      <button className="sheet-backdrop" aria-label="Close case details" onClick={onClose} />
      <div className="sheet sheet-tall" role="dialog" aria-label="Case details">
        <div className="sheet-handle" />
        <div className="case-photo">
          {imgFailed ? (
            <PawIcon size={56} />
          ) : (
            <img src={api.animalImageUrl(id)} alt={`Reported ${animal.species || "animal"}`} onError={() => setImgFailed(true)} />
          )}
          <button className="icon-btn photo-close" aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="row-between">
          <span className="sheet-title">{animal.species}</span>
          <span className={`badge ${severityClass(animal.severity_level)}`}>
            {animal.severity_level} SEVERITY{animal.severity_score ? ` · ${animal.severity_score}/10` : ""}
          </span>
        </div>

        {animal.status && (
          <div className="row gap muted small">
            Status
            <span className={`badge ${claimed ? "status-claimed" : "status-reported"}`}>{animal.status}</span>
            {animal.created_at && <span>· {timeAgo(animal.created_at)}</span>}
          </div>
        )}

        <div className="divider" />

        <div className="stack-xs">
          <span className="overline">Description</span>
          <p>{animal.description || "No description provided."}</p>
        </div>

        {animal.triage_notes && (
          <div className="triage-box">
            <span className="row strong small">
              <SparkleIcon size={16} /> Gemini AI triage notes
            </span>
            <p>{animal.triage_notes}</p>
          </div>
        )}

        {animal.latitude != null && animal.longitude != null && (
          <div className="stack-xs">
            <span className="overline">Location</span>
            <a className="link" href={mapsUrl(animal.latitude, animal.longitude)} target="_blank" rel="noreferrer">
              <PinIcon /> Lat: {Number(animal.latitude).toFixed(4)}, Lng: {Number(animal.longitude).toFixed(4)} · Open in Maps
            </a>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        {claimed ? (
          <div className="claimed-box">
            <CheckIcon /> Claimed{animal.claimed_by_volunteer_name ? ` by ${animal.claimed_by_volunteer_name}` : ""}
          </div>
        ) : (
          <button className="btn btn-primary btn-lg" onClick={claim} disabled={claiming}>
            {claiming ? "Claiming…" : "Claim case for rescue"}
          </button>
        )}
      </div>
    </div>
  );
}
