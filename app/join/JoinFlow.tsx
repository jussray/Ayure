"use client";

import { useMemo, useState, type FormEvent } from "react";

const roleOptions = [
  ["buyer", "Buy a property"],
  ["owner", "Own / improve a property"],
  ["investor", "Invest"],
  ["operator", "Operate properties"],
  ["service_provider", "Offer services"],
] as const;

type Role = (typeof roleOptions)[number][0];

export default function JoinFlow({ initialGoal = "" }: { initialGoal?: string }) {
  const [role, setRole] = useState<Role | "">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState(initialGoal);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState("");

  const canSubmit = useMemo(
    () => Boolean(role && name.trim().length >= 2 && /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email) && goal.trim().length >= 8),
    [role, name, email, goal],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!canSubmit) {
      setError("Choose a role and fill in all fields so AYURE knows how to route you.");
      return;
    }
    setStatus("submitting");
    try {
      const response = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, name, email, goal }),
      });
      const payload = (await response.json()) as { ok?: boolean; receipt?: string; error?: string; code?: string };
      if (!response.ok) {
        if (payload.code === "backend_not_configured") {
          throw new Error("The AYURE founding-network form is built, but storage is not connected yet. Your details were not saved.");
        }
        throw new Error(payload.error || "AYURE could not save your application.");
      }
      setReceipt(payload.receipt || "");
      setStatus("success");
    } catch (cause) {
      setStatus("idle");
      setError(cause instanceof Error ? cause.message : "AYURE could not save your application.");
    }
  }

  function reset() {
    setRole("");
    setName("");
    setEmail("");
    setGoal(initialGoal);
    setError("");
    setReceipt("");
    setStatus("idle");
  }

  if (status === "success") {
    return (
      <div className="join-card" aria-live="polite">
        <p className="eyebrow">APPLICATION RECEIVED</p>
        <h2>AYURE knows where to route you.</h2>
        <div className="success-box">
          <strong>{name}</strong>, your founding-network application was saved.
          {receipt ? <code>{receipt}</code> : null}
        </div>
        <div className="form-actions">
          <button type="button" className="intent-tab" onClick={reset}>Start another</button>
          <a className="gradient-button" href="/">Back to AYURE</a>
        </div>
      </div>
    );
  }

  return (
    <form className="join-card" onSubmit={submit} noValidate>
      <p className="eyebrow">1 · YOUR LANE</p>
      <div className="role-grid" role="group" aria-label="Choose your role">
        {roleOptions.map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={role === value ? "role-button is-active" : "role-button"}
            aria-pressed={role === value}
            onClick={() => setRole(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="form-grid">
        <p className="eyebrow">2 · WHAT SHOULD AYURE KNOW?</p>
        <label>
          Your name
          <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
        </label>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
        </label>
        <label>
          What are you trying to make happen?
          <textarea value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Example: I own a cabin and need an operator plus a plan to improve the listing." required />
        </label>
      </div>

      {error ? <div className="notice error" role="alert">{error}</div> : null}

      <div className="form-actions">
        <span className="subtle">AYURE will not claim your application was saved unless the backend confirms it.</span>
        <button className="gradient-button" type="submit" disabled={!canSubmit || status === "submitting"}>
          {status === "submitting" ? "Saving…" : "Join the founding network"}
        </button>
      </div>
    </form>
  );
}
