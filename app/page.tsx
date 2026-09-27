import IntentSearch from "../components/IntentSearch";
import { catalog } from "../lib/ayure/fixtures";

const proofStates = [
  ["Example", "Demonstration content, never presented as a real customer or outcome."],
  ["Projected", "A forward-looking estimate with assumptions attached."],
  ["Reported", "Information supplied by a person or business, not independently verified."],
  ["Verified", "Evidence-backed information AYURE can trace to supporting proof."],
];

export default function HomePage() {
  const [property, professional, service] = catalog;

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="AYURE home">AYURE</a>
        <nav aria-label="Primary navigation">
          <a href="#explore">Explore</a>
          <a href="#professionals">Professionals</a>
          <a href="#opportunities">Opportunities</a>
          <a href="#how">How it works</a>
          <a href="#about">About</a>
        </nav>
        <a className="gradient-button header-cta" href="/join">Join AYURE</a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">PROPERTY × PEOPLE × OPPORTUNITY</p>
          <h1>Where properties meet <span>opportunity.</span></h1>
          <p className="hero-lede">
            Find properties, trusted professionals, services, and possibilities in one destination built around what you are trying to make happen.
          </p>
        </div>
        <div className="hero-image" role="img" aria-label="Warm modern villa overlooking a destination landscape">
          <div className="hero-image-note">Find the place.<br />Find the people.<br />Build what it can become.</div>
        </div>
      </section>

      <IntentSearch />

      <section className="section" id="professionals">
        <div className="section-heading">
          <div>
            <p className="eyebrow">DISCOVER</p>
            <h2>Property is only half the story.</h2>
          </div>
          <p>AYURE connects the asset to the people and services that can help buy it, transform it, operate it, or grow it.</p>
        </div>

        <div className="feature-grid" id="opportunities">
          {[property, professional, service].map((entity) => (
            <article className="feature-card" key={entity.id}>
              <div className="feature-image-wrap">
                <img src={entity.image} alt="" />
                <span className="proof proof-example">Example</span>
              </div>
              <div className="feature-card-body">
                <p className="card-kind">{entity.kind}</p>
                <h3>{entity.title}</h3>
                <p>{entity.subtitle}</p>
                <small>{entity.location}</small>
                <a className="text-link" href={`/join?goal=${encodeURIComponent(`I want to explore ${entity.title}`)}`}>Start here →</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="proof-section" id="proof">
        <div className="section-heading compact">
          <div>
            <p className="eyebrow">THE AYURE PROOF STANDARD</p>
            <h2>Beautiful does not mean unproven.</h2>
          </div>
          <p>Every number, result, opportunity, and recommendation gets a visible evidence state.</p>
        </div>
        <div className="proof-grid">
          {proofStates.map(([name, description]) => (
            <article key={name}>
              <span className={`proof proof-${name.toLowerCase()}`}>{name}</span>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section how-section" id="how">
        <p className="eyebrow">HOW AYURE WORKS</p>
        <h2>One intention. The right paths around it.</h2>
        <div className="steps">
          <article><span>01</span><h3>Tell AYURE your goal</h3><p>Search naturally or choose a familiar path such as buy, operate, transform, invest, or offer services.</p></article>
          <article><span>02</span><h3>See connected answers</h3><p>AYURE can return relevant properties, professionals, services, businesses, and opportunities together.</p></article>
          <article><span>03</span><h3>Understand the match</h3><p>Every match explains why it fits instead of hiding behind a mystery score.</p></article>
          <article><span>04</span><h3>Make the connection</h3><p>Move from discovery into a real inquiry, working relationship, property decision, or next action.</p></article>
        </div>
      </section>

      <section className="destination-section" id="about">
        <div className="destination-image"><span>Extraordinary stays start with the right people.</span></div>
        <div className="destination-copy">
          <p className="eyebrow">A DESTINATION FOR PROPERTY PEOPLE</p>
          <h2>Properties, expertise, and opportunity. Together.</h2>
          <p>
            AYURE is being built for buyers, owners, investors, operators, managers, designers, agents, and service providers who need a simpler way to find one another and get to the next useful action.
          </p>
          <a className="gradient-button" href="/join">Join the founding network</a>
        </div>
      </section>

      <footer>
        <a className="wordmark" href="#top">AYURE</a>
        <p>Where properties meet opportunity.</p>
        <a href="#proof">Proof standard</a>
      </footer>
    </main>
  );
}
