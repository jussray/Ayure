"use client";

import { useState, type FormEvent } from "react";
import type { IntentKind, MatchResponse, MatchStrength } from "../lib/ayure/types";
import { Icon } from "./icons";

const choices: Array<{ kind: Exclude<IntentKind, "explore">; label: string; icon: "home" | "people" | "wand" | "bars" | "briefcase" }> = [
  { kind: "buy", label: "Buy a property", icon: "home" },
  { kind: "find_operator", label: "Find an operator", icon: "people" },
  { kind: "transform", label: "Transform my property", icon: "wand" },
  { kind: "invest", label: "Invest", icon: "bars" },
  { kind: "offer_services", label: "Offer my services", icon: "briefcase" },
];

const examples: Record<IntentKind, string> = {
  explore: "I have $175k and want a short-term rental near Pittsburgh",
  buy: "Show me a property under $250k near Pittsburgh",
  find_operator: "I need an operator for my short-term rental",
  transform: "Help me transform my cabin into a better-performing stay",
  invest: "I want to invest around $200k and need options",
  offer_services: "I design short-term rentals and want property-owner clients",
};

const timeframes = [
  ["", "Any timeframe"],
  ["now", "Ready now"],
  ["3m", "Within 3 months"],
  ["12m", "Within a year"],
  ["exploring", "Just exploring"],
] as const;

const budgets = [
  ["", "Any budget"],
  ["250000", "Under $250k"],
  ["500000", "Under $500k"],
  ["1000000", "Under $1M"],
  ["3000000", "Under $3M"],
] as const;

const strengthLabels: Record<MatchStrength, string> = {
  strong: "Strong match",
  good: "Good match",
  possible: "Possible match",
};

const intentLabels: Record<IntentKind, string> = {
  explore: "explore",
  buy: "buy a property",
  find_operator: "find an operator",
  transform: "transform a property",
  invest: "invest",
  offer_services: "offer services",
};

const MAX_QUERY_LENGTH = 500;

export default function IntentSearch() {
  const [selected, setSelected] = useState<IntentKind>("explore");
  const [query, setQuery] = useState("");
  const [timeframe, setTimeframe] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [response, setResponse] = useState<MatchResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function composeQuery() {
    const typed = query.trim();
    const looksLikePlace = typed.length > 1 && typed.length <= 40 && /^[a-z .,'-]+$/i.test(typed) && !/\b(want|need|have|looking|show|help|find|invest|buy|offer|design|transform|operate|manage|sell|rent)\b/i.test(typed);
    const parts = [typed ? (looksLikePlace ? `near ${typed}` : typed) : examples[selected]];
    if (budget && !/\$|\d+\s*k\b/i.test(parts[0])) parts.push(`under $${Number(budget).toLocaleString()}`);
    if (timeframe) parts.push(timeframes.find(([value]) => value === timeframe)?.[1].toLowerCase() ?? "");
    return parts.join(" ").trim().slice(0, MAX_QUERY_LENGTH);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: composeQuery(), intent: selected }),
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

  const highlighted: IntentKind = response ? response.intent.kind : selected;

  return (
    <section className="search-surface" id="explore" aria-labelledby="intent-title">
      <h2 className="sr-only" id="intent-title">What are you trying to make happen?</h2>

      <div className="intent-track" role="group" aria-label="Choose your goal">
        {choices.map((choice) => (
          <button
            key={choice.kind}
            type="button"
            className={highlighted === choice.kind ? "intent-chip is-active" : "intent-chip"}
            aria-pressed={selected === choice.kind}
            onClick={() => {
              setSelected(selected === choice.kind ? "explore" : choice.kind);
              setResponse(null);
            }}
          >
            <Icon name={choice.icon} size={18} />
            {choice.label}
          </button>
        ))}
      </div>

      <form className="search-row" onSubmit={submit}>
        <div className="search-field search-field-location">
          <Icon name="pin" size={18} />
          <label className="sr-only" htmlFor="ayure-query">Tell AYURE what you want to make happen</label>
          <input
            id="ayure-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Where are you looking?"
            autoComplete="off"
            enterKeyHint="search"
            maxLength={MAX_QUERY_LENGTH}
          />
        </div>
        <span className="search-divider" aria-hidden="true" />
        <div className="search-field">
          <Icon name="calendar" size={18} />
          <label className="sr-only" htmlFor="ayure-timeframe">Timeframe</label>
          <select id="ayure-timeframe" value={timeframe} onChange={(event) => setTimeframe(event.target.value)}>
            {timeframes.map(([value, label]) => <option key={value || "any"} value={value}>{label}</option>)}
          </select>
          <Icon name="chevron" size={16} className="search-chevron" />
        </div>
        <span className="search-divider" aria-hidden="true" />
        <div className="search-field">
          <Icon name="person" size={18} />
          <label className="sr-only" htmlFor="ayure-budget">Budget</label>
          <select id="ayure-budget" value={budget} onChange={(event) => setBudget(event.target.value)}>
            {budgets.map(([value, label]) => <option key={value || "any"} value={value}>{label}</option>)}
          </select>
          <Icon name="chevron" size={16} className="search-chevron" />
        </div>
        <button className="gradient-button search-button" type="submit" disabled={loading}>
          <Icon name="search" size={18} />
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      <p className="search-note">
        Early access · search covers the founding collection, labeled Example until live. Match labels are qualitative, not probabilities; every result says why it matched and carries its proof state.
      </p>

      {error ? <div className="notice error" role="alert">{error}</div> : null}

      {response ? (
        <div className="match-panel" aria-live="polite">
          <div className="match-summary">
            <div>
              <span className="eyebrow">AYURE understood</span>
              <strong>{intentLabels[response.intent.kind]}{response.intent.location ? ` · ${response.intent.location}` : ""}</strong>
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
          {response.results.length === 0 ? (
            <p className="empty-state">No live listings match yet — the founding collection opens with our first members. <a className="text-link" href="/join">Get matched →</a></p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
