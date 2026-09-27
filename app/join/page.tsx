import JoinFlow from "./JoinFlow";

type JoinSearchParams = Promise<{ goal?: string | string[] }>;

export default async function JoinPage({ searchParams }: { searchParams?: JoinSearchParams }) {
  const params = searchParams ? await searchParams : undefined;
  const rawGoal = params?.goal;
  const initialGoal = Array.isArray(rawGoal) ? rawGoal[0] ?? "" : rawGoal ?? "";

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
        <JoinFlow initialGoal={initialGoal} />
      </section>
    </main>
  );
}
