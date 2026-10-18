"use client";
import { useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { useGeolocation } from "../lib/useGeolocation";
import ReportStray from "../components/ReportStray";
import LostPet from "../components/LostPet";
import Feed from "../components/Feed";
import CaseSheet from "../components/CaseSheet";
import Assistant from "../components/Assistant";
import { PawIcon, SearchIcon, SirenIcon, SparkleIcon } from "../components/Icons";

const TABS = [
  { id: "report", label: "Report stray", mode: "Rescuer mode", Icon: PawIcon },
  { id: "lost", label: "Lost pet", mode: "Owner", Icon: SearchIcon },
  { id: "feed", label: "Volunteer feed", mode: "Volunteer", Icon: SirenIcon },
];

export default function Home() {
  const [tab, setTab] = useState("report");
  const [openCase, setOpenCase] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [feedVersion, setFeedVersion] = useState(0); // bump to make the feed reload
  const [toast, setToast] = useState("");
  const geo = useGeolocation();

  function showToast(text) {
    setToast(text);
    setTimeout(() => setToast(""), 2800);
  }

  const current = TABS.find((t) => t.id === tab);

  return (
    <div className="app">
      <Header modeLabel={current.mode} />

      <main className="main">
        {tab === "report" && (
          <ReportStray geo={geo} onOpenCase={setOpenCase} onReported={() => setFeedVersion((v) => v + 1)} />
        )}
        {tab === "lost" && <LostPet onOpenCase={setOpenCase} />}
        {tab === "feed" && <Feed onOpenCase={setOpenCase} refreshKey={feedVersion} />}
      </main>

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      {!openCase && !chatOpen && (
        <button className="fab" aria-label="Open Paws Assistant" onClick={() => setChatOpen(true)}>
          <SparkleIcon size={24} />
        </button>
      )}

      <nav className="nav" aria-label="Main">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={`nav-btn ${tab === id ? "nav-btn-active" : ""}`} onClick={() => setTab(id)}>
            <Icon size={22} />
            {label}
          </button>
        ))}
      </nav>

      {openCase && (
        <CaseSheet
          key={openCase.id ?? openCase.animal_id}
          data={openCase}
          onClose={() => setOpenCase(null)}
          onClaimed={() => {
            setFeedVersion((v) => v + 1);
            showToast("Case claimed. The reporter can see help is on the way.");
          }}
        />
      )}

      {chatOpen && <Assistant geo={geo} onClose={() => setChatOpen(false)} />}
    </div>
  );
}

function Header({ modeLabel }) {
  const { user, ready, signIn, signOut, signingIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = user
    ? (user.displayName || user.email || "?")
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <header className="header">
      <div className="row">
        <span className="logo">
          <PawIcon size={18} />
        </span>
        <span className="brand">Pixel &amp; Paws</span>
      </div>
      <div className="row gap">
        <span className="mode-chip">{modeLabel}</span>
        {ready && !user && (
          <button className="btn btn-small btn-outline" onClick={signIn} disabled={signingIn}>
            {signingIn ? "…" : "Sign in"}
          </button>
        )}
        {user && !user.isGuest && (
          <div className="menu-wrap">
            <button className="avatar" aria-label="Account" onClick={() => setMenuOpen((o) => !o)}>
              {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : initials}
            </button>
            {menuOpen && (
              <div className="menu">
                <span className="strong small">{user.displayName || "Signed in"}</span>
                <span className="muted small">{user.email}</span>
                <button
                  className="btn btn-small btn-outline"
                  onClick={() => {
                    setMenuOpen(false);
                    signOut();
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
