"use client";

import { useState, type FormEvent } from "react";
import type { IntentKind, MatchResponse, MatchStrength } from "../lib/ayure/types";

const choices: Array<{ kind: IntentKind; label: string }> = [
  { kind: "buy", label: "Buy a property" },
  { kind: "find_operator", label: "Find an operator" },
  { kind: "transform", label: "Transform my property" },
  { kind: "invest", label: "Invest" },
  { kind: "offer_services", label: "Offer my services" },
];

const examples: Record<IntentKind, string> = {
  explore: "I have $175k and want a short-term rental near Pittsburgh",
  buy: "Show me a property under $250k near Pittsburgh",
  find_operator: "I need an operator for my short-term rental",
  transform: "Help me transform my cabin into a better-performing stay",
  invest: "I want to invest around $200k and need options",
  offer_services: "I design short-term rentals and want property-owner clients",
};

const strengthLabels: Record<MatchStrength, string> = {
  strong: "Strong match",
  good: "Good match",
  possible: "Possible match",
};

export default function IntentSearch() {
  const [selected, setSelected] = useState<IntentKind>("explore");
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<MatchResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() || examples[selected], intent: selected }),
      });
      const payload = (await res.json()) as MatchResponse & { error?: string };
      if (!res.ok) throw new Error(payload.error || "AYURE could not search right now.");
      setResponse(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "AYURE could not search right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="intent-shell" id="explore" aria-labelledby="intent-title">
      <div className="intent-kicker" id="intent-title">What are you trying to make happen?</div>
      <div className="intent-tabs" role="group" aria-label="Choose your goal">
        {choices.map((choice) => (
          <button
            key={choice.kind}
            type="button"
            className={selected === choice.kind ? "intent-tab is-active" : "intent-tab"}
            aria-pressed={selected === choice.kind}
            onClick={() => {
              setSelected(choice.kind);
              setResponse(null);
            }}
          >
            {choice.label}
          </button>
        ))}
      </div>

      <form className="intent-form" onSubmit={submit}>
        <label className="sr-only" htmlFor="ayure-query">Tell AYURE what you want to make happen</label>
        <input
          id="ayure-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={examples[selected]}
          autoComplete="off"
          enterKeyHint="search"
        />
        <button className="gradient-button" type="submit" disabled={loading}>
          {loading ? "Finding matches…" : "Ask AYURE"}
        </button>
      </form>
      <p className="search-note">Searches the current AYURE example catalog. Match labels are qualitative routing signals, not probabilities. Every result explains why it matched and carries an explicit proof state.</p>

      {error ? <div className="notice error" role="alert">{error}</div> : null}

      {response ? (
        <div className="match-panel" aria-live="polite">
          <div className="match-summary">
            <div>
              <span className="eyebrow">AYURE understood</span>
              <strong>{response.intent.kind.replaceAll("_", " ")}</strong>
            </div>
            <code>{response.fingerprint}</code>
          </div>

          <div className="match-grid">
            {response.results.map(({ entity, strength, reasons }) => (
              <article className="match-card" key={entity.id}>
                <img src={entity.image} alt="" />
                <div className="match-card-body">
                  <div className="card-meta">
                    <span className={`proof proof-${entity.proof}`}>{entity.proof}</span>
                    <span>{strengthLabels[strength]}</span>
                  </div>
                  <h3>{entity.title}</h3>
                  <p>{entity.subtitle}</p>
                  <small>{entity.location}</small>
                  <ul>
                    {reasons.slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}
                  </ul>
                  <a className="text-link" href={`/join?goal=${encodeURIComponent(`Connect me with ${entity.title}`)}`}>Connect through AYURE →</a>
                </div>
              </article>
            ))}
          </div>
          {response.results.length === 0 ? <p className="empty-state">No strong example match yet. Try a broader location, budget, or goal.</p> : null}
        </div>
      ) : null}
    </section>
  );
}
