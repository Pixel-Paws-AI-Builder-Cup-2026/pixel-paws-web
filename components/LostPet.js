"use client";
import { useEffect, useState } from "react";
import { api, mapsUrl, severityClass, timeAgo } from "../lib/api";
import { useAuth } from "./AuthProvider";
import PhotoPicker from "./PhotoPicker";
import { CheckIcon, LockIcon, PawIcon, PinIcon, SearchIcon, UserIcon } from "./Icons";

export default function LostPet({ onOpenCase }) {
  const { user, requireAuth } = useAuth();
  const [photo, setPhoto] = useState(null);
  const [petName, setPetName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Prefill the owner's name from their Google account
  useEffect(() => {
    if (user && !ownerName) setOwnerName(user.displayName || "");
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <section className="stack">
        <div>
          <h1 className="page-title">Report a lost pet</h1>
          <p className="muted">We compare your pet's photo with every stray reported nearby.</p>
        </div>
        <div className="card stack-sm center">
          <span className="icon-circle icon-circle-lg">
            <LockIcon size={24} />
          </span>
          <h2 className="section-title">Sign in to register your pet</h2>
          <p className="muted">Signing in keeps your phone number private and lets us reach you when there's a match.</p>
          <button
            className="btn btn-google"
            onClick={() =>
              requireAuth("Sign in to register a lost pet", "We'll use your Google account to keep your contact details private.", () => {})
            }
          >
            <UserIcon /> Continue with Google
          </button>
        </div>
      </section>
    );
  }

  async function submit() {
    setError("");
    if (!photo) return setError("Add a clear photo of your pet.");
    if (!ownerName.trim() || !contact.trim()) return setError("Add your name and a contact number.");

    const form = new FormData();
    form.append("pet_name", petName.trim() || "Unknown");
    form.append("owner_name", ownerName.trim());
    form.append("owner_contact", contact.trim());
    form.append("file", photo);

    setSubmitting(true);
    try {
      setResult(await api.reportLostPet(form));
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const matches = (result && result.potential_rescue_matches) || [];

  return (
    <section className="stack">
      <div>
        <h1 className="page-title">Report a lost pet</h1>
        <p className="muted">We compare your pet's photo with every stray reported nearby.</p>
      </div>

      {!result && (
        <>
          <PhotoPicker file={photo} onChange={setPhoto} label="Upload missing pet photo" capture={false} height={150} />
          <div className="field">
            <label htmlFor="petName" className="label">Pet name</label>
            <input id="petName" className="input" value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="Max" />
          </div>
          <div className="field">
            <label htmlFor="ownerName" className="label">Owner name</label>
            <input id="ownerName" className="input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="field">
            <label htmlFor="contact" className="label">Contact number</label>
            <input id="contact" type="tel" className="input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="+91 98765 43210" />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary btn-lg" onClick={submit} disabled={submitting}>
            {submitting ? "Checking for matches…" : "Broadcast lost notice & check matches"}
          </button>
          {submitting && (
            <div className="card row">
              <span className="icon-circle">
                <SearchIcon size={18} />
              </span>
              <span className="muted">Comparing your photo with recent stray reports…</span>
            </div>
          )}
        </>
      )}

      {result && (
        <div className="stack-sm">
          <div className="banner-success">
            <CheckIcon /> {petName.trim() || "Your pet"} is registered as lost
          </div>

          <div className="row-between">
            <h2 className="section-title">Potential matches ({matches.length})</h2>
            <span className="muted small">Visual similarity</span>
          </div>

          {matches.length === 0 && (
            <div className="card">
              <p className="muted">No similar strays reported yet. Your pet stays registered, so new reports will be checked against it.</p>
            </div>
          )}

          {matches.map((m) => (
            <div key={m.animal_id} className="card row match-card">
              <MatchThumb id={m.animal_id} />
              <div className="stack-xs flex-1 min-0">
                <div className="row-between">
                  <span className="strong">{m.species}</span>
                  {m.similarity_percent != null && <span className="similarity">{m.similarity_percent}% similar</span>}
                </div>
                <span className={`badge ${severityClass(m.severity_level)}`}>{m.severity_level}</span>
                {m.last_reported_at && <span className="muted small">Reported {timeAgo(m.last_reported_at)}</span>}
                <div className="row gap">
                  <button className="link small" onClick={() => onOpenCase({ ...m, id: m.animal_id })}>
                    View details
                  </button>
                  {m.latitude != null && (
                    <a className="link small" href={mapsUrl(m.latitude, m.longitude)} target="_blank" rel="noreferrer">
                      <PinIcon size={14} /> Map
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button
            className="btn btn-ghost"
            onClick={() => {
              setResult(null);
              setPhoto(null);
              setPetName("");
            }}
          >
            Report another pet
          </button>
        </div>
      )}
    </section>
  );
}

function MatchThumb({ id }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="thumb">
      {failed ? <PawIcon size={26} /> : <img src={api.animalImageUrl(id)} alt="" onError={() => setFailed(true)} />}
    </span>
  );
}
