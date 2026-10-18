"use client";
import { useState } from "react";
import { api, mapsUrl, severityClass } from "../lib/api";
import PhotoPicker from "./PhotoPicker";
import { ClinicIcon, PinIcon, SparkleIcon, TargetIcon } from "./Icons";

const SPECIES = ["Dog", "Cat", "Cow", "Bird", "Other"];

export default function ReportStray({ geo, onOpenCase, onReported }) {
  const [photo, setPhoto] = useState(null);
  const [species, setSpecies] = useState("Dog");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [clinics, setClinics] = useState(null);
  const [clinicsLoading, setClinicsLoading] = useState(false);

  async function submit() {
    setError("");
    if (!photo) return setError("Add a photo of the animal first.");
    const coords = geo.coords || (await geo.request());
    if (!coords) return setError("We need your location so volunteers can find the animal.");

    const form = new FormData();
    form.append("name", "Unknown");
    form.append("species", species);
    form.append("description", description);
    form.append("latitude", String(coords.latitude));
    form.append("longitude", String(coords.longitude));
    form.append("file", photo);

    setSubmitting(true);
    try {
      const animal = await api.uploadStray(form);
      setResult({ ...animal, latitude: animal.latitude ?? coords.latitude, longitude: animal.longitude ?? coords.longitude });
      onReported();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function findVets() {
    setClinicsLoading(true);
    try {
      setClinics(await api.nearestClinics(result.latitude, result.longitude, 3));
    } catch (e) {
      setClinics([]);
      setError(e.message);
    } finally {
      setClinicsLoading(false);
    }
  }

  function reset() {
    setPhoto(null);
    setDescription("");
    setResult(null);
    setClinics(null);
    setError("");
  }

  if (result) {
    return (
      <section className="stack">
        <div>
          <h1 className="page-title">Thanks for reporting</h1>
          <p className="muted">Nearby volunteers can now see this case.</p>
        </div>

        <div className="card stack-sm">
          <div className="row-between">
            <span className="row strong">
              <SparkleIcon /> Gemini triage
            </span>
            <span className={`badge ${severityClass(result.severity_level)}`}>
              {result.severity_level}
              {result.severity_score ? ` · ${result.severity_score}/10` : ""}
            </span>
          </div>
          <p>{result.triage_notes || "No triage notes returned."}</p>
          <a className="link small" href={mapsUrl(result.latitude, result.longitude)} target="_blank" rel="noreferrer">
            <PinIcon /> {result.latitude.toFixed(4)}, {result.longitude.toFixed(4)}
          </a>
          <div className="row gap">
            <button className="btn btn-outline flex-1" onClick={() => onOpenCase(result)}>
              Open case
            </button>
            <button className="btn btn-outline flex-1" onClick={findVets} disabled={clinicsLoading}>
              <ClinicIcon /> {clinicsLoading ? "Finding…" : "Nearest vets"}
            </button>
          </div>
        </div>

        {clinics && (
          <div className="stack-sm">
            <h2 className="section-title">Nearest vet clinics</h2>
            {clinics.length === 0 && <p className="muted">No clinics found nearby.</p>}
            {clinics.map((c) => (
              <div key={c.id} className="card row-between">
                <div className="stack-xs">
                  <span className="strong">{c.clinic_name}</span>
                  {c.address && <span className="muted small">{c.address}</span>}
                  <a className="link small" href={mapsUrl(c.latitude, c.longitude)} target="_blank" rel="noreferrer">
                    Directions
                  </a>
                </div>
                {c.phone && (
                  <a className="btn btn-small btn-primary" href={`tel:${c.phone}`}>
                    Call
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <button className="btn btn-ghost" onClick={reset}>
          Report another animal
        </button>
      </section>
    );
  }

  return (
    <section className="stack">
      <div>
        <h1 className="page-title">Report a stray</h1>
        <p className="muted">Gemini reviews the photo and your notes, then alerts nearby volunteers.</p>
      </div>

      <PhotoPicker file={photo} onChange={setPhoto} />

      <div className="field">
        <label htmlFor="species" className="label">Species / animal type</label>
        <select id="species" className="input" value={species} onChange={(e) => setSpecies(e.target.value)}>
          {SPECIES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="desc" className="label">Description &amp; condition notes</label>
        <textarea
          id="desc"
          className="input textarea"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Friendly, brown coat, has a limp near the corner store…"
        />
      </div>

      <div className="field">
        <span className="label">Location</span>
        <button className="btn btn-outline" onClick={geo.request} disabled={geo.status === "locating"}>
          <TargetIcon />
          {geo.status === "locating" ? "Locating…" : geo.coords ? "Location captured" : "Use current GPS location"}
        </button>
        {geo.coords && (
          <span className="muted small row">
            <PinIcon size={14} /> Lat: {geo.coords.latitude.toFixed(4)}, Lng: {geo.coords.longitude.toFixed(4)}
          </span>
        )}
        {geo.error && <span className="error-text">{geo.error}</span>}
      </div>

      {error && <p className="error-text">{error}</p>}

      <button className="btn btn-primary btn-lg" onClick={submit} disabled={submitting}>
        {submitting ? "Evaluating with Gemini…" : "Submit & evaluate stray"}
      </button>

      {submitting && (
        <div className="card row">
          <span className="icon-circle">
            <SparkleIcon />
          </span>
          <span className="muted">Gemini is assessing the animal's condition…</span>
        </div>
      )}
    </section>
  );
}
