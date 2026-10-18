import { getIdToken } from "./firebase";

// Change this in .env.local (NEXT_PUBLIC_API_BASE_URL) when the backend URL changes
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080").replace(/\/$/, "");

async function request(path, { method = "GET", json, form } = {}) {
  const headers = {};
  const token = await getIdToken();               // sent whenever the user is signed in
  if (token) headers.Authorization = `Bearer ${token}`;

  let body;
  if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  } else if (form) {
    body = form;                                   // browser sets the multipart boundary
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { method, headers, body });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data && data.detail;
    const message = typeof detail === "string" ? detail : `Request failed (${res.status})`;
    throw new Error(res.status === 401 ? "Please sign in to continue." : message);
  }
  return data;
}

export const api = {
  // 1. Report a stray: photo + details -> Gemini triage + embedding
  uploadStray: (formData) => request("/api/v1/animals/upload", { method: "POST", form: formData }),

  // 2. Report a lost pet -> pgvector matches against stray reports
  reportLostPet: (formData) => request("/api/v1/lost-pets/report-upload", { method: "POST", form: formData }),

  // 3. Volunteer feed + claiming
  getCases: (statusFilter) =>
    request(`/api/v1/dashboard/cases${statusFilter ? `?status_filter=${encodeURIComponent(statusFilter)}` : ""}`),
  // volunteer_name is sent for the older endpoint; the Firebase version reads the name from the token
  claimCase: (animalId, volunteerName) =>
    request(`/api/v1/animals/${animalId}/claim`, { method: "POST", json: { volunteer_name: volunteerName } }),

  // 4. Clinics
  nearestClinics: (latitude, longitude, limit = 3) =>
    request("/api/v1/clinics/nearest", { method: "POST", json: { latitude, longitude, limit } }),

  // 5. Assistant
  chat: (prompt, location) =>
    request("/api/v1/assistant/chat", {
      method: "POST",
      json: { prompt, latitude: location ? location.latitude : null, longitude: location ? location.longitude : null },
    }),

  // Images are served straight from the backend
  animalImageUrl: (id) => `${API_BASE}/api/v1/animals/${id}/image`,
  lostPetImageUrl: (id) => `${API_BASE}/api/v1/lost-pets/${id}/image`,
};

export function mapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function timeAgo(value) {
  if (!value) return "";
  const date = new Date(String(value).endsWith("Z") || String(value).includes("+") ? value : `${value}Z`);
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (Number.isNaN(minutes)) return "";
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} d ago`;
}

// Backend uses CRITICAL / MEDIUM / LOW; treat HIGH the same as CRITICAL
export function severityClass(level) {
  const l = String(level || "").toUpperCase();
  if (l === "CRITICAL" || l === "HIGH") return "sev-high";
  if (l === "MEDIUM") return "sev-medium";
  if (l === "LOW") return "sev-low";
  return "sev-unknown";
}
