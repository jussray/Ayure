import JoinFlow from "./JoinFlow";

export default function JoinPage({ searchParams }: { searchParams?: { goal?: string } }) {
  return (
    <main className="join-page">
      <header className="join-header">
        <a className="wordmark" href="/">AYURE</a>
        <a href="/">← Back to explore</a>
      </header>
      <section className="join-wrap">
        <p className="eyebrow">FOUNDING NETWORK</p>
        <h1>Tell AYURE where you fit.</h1>
        <p>Start with your role and your intention. AYURE uses that to route you toward the right property, person, service, or opportunity.</p>
        <JoinFlow initialGoal={searchParams?.goal ?? ""} />
      </section>
    </main>
  );
}
