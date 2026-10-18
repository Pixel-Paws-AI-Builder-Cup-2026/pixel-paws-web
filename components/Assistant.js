"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import RichText from "./RichText";
import { CloseIcon, SendIcon, SparkleIcon } from "./Icons";

const QUICK_PROMPTS = ["Nearest vet clinic to me?", "Which strays near me need help?", "Emergency first aid for an injured dog"];

export default function Assistant({ geo, onClose }) {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I can help you report a stray, find a lost pet, find a nearby vet, or give first aid tips." },
  ]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (!geo.coords && geo.status === "idle") geo.request(); // lets "near me" questions use real location
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, thinking]);

  async function send(text) {
    const prompt = text.trim();
    if (!prompt || thinking) return;
    setMessages((m) => [...m, { from: "user", text: prompt }]);
    setDraft("");
    setThinking(true);
    try {
      const res = await api.chat(prompt, geo.coords);
      setMessages((m) => [...m, { from: "bot", text: res.response || "Sorry, I didn't get an answer." }]);
    } catch (e) {
      setMessages((m) => [...m, { from: "bot", text: `Sorry, something went wrong: ${e.message}` }]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="sheet-layer" style={{ zIndex: 40 }}>
      <button className="sheet-backdrop" aria-label="Close assistant" onClick={onClose} />
      <div className="sheet chat-sheet" role="dialog" aria-label="Paws Assistant">
        <div className="sheet-handle" />
        <div className="row-between">
          <div className="row">
            <span className="avatar-dark">
              <SparkleIcon size={20} />
            </span>
            <div className="stack-0">
              <span className="strong">Paws Assistant</span>
              <span className="muted small">Powered by Gemini</span>
            </div>
          </div>
          <button className="icon-btn" aria-label="Close assistant" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="chat-list" ref={listRef}>
          {messages.map((m, i) => (
            <div key={i} className={`bubble-row ${m.from === "user" ? "bubble-row-user" : ""}`}>
              <div className={`bubble ${m.from === "user" ? "bubble-user" : "bubble-bot"}`}>
                {m.from === "bot" ? <RichText text={m.text} /> : m.text}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="bubble-row">
              <div className="bubble bubble-bot muted">Paws is thinking…</div>
            </div>
          )}
        </div>

        <div className="stack-xs">
          <span className="overline">Quick prompts</span>
          <div className="row gap wrap">
            {QUICK_PROMPTS.map((p) => (
              <button key={p} className="chip" onClick={() => send(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <form
          className="row gap"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <label htmlFor="chatInput" className="visually-hidden">Ask anything</label>
          <input
            id="chatInput"
            className="input chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask anything…"
            autoComplete="off"
          />
          <button type="submit" className="send-btn" aria-label="Send" disabled={thinking}>
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
}
