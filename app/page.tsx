import IntentSearch from "../components/IntentSearch";
import StayChannels from "../components/StayChannels";
import { Icon } from "../components/icons";

const steps = [
  { icon: "search", title: "Discover", body: "Explore properties, professionals and opportunities in one place." },
  { icon: "people", title: "Connect", body: "Find and work with verified operators, designers, managers and more." },
  { icon: "bars", title: "Take action", body: "Buy, invest, transform or offer your services with confidence." },
  { icon: "sparkle", title: "Create value", body: "Turn great properties into extraordinary returns." },
] as const;

const proFeatures = [
  { icon: "shield", tint: "sage", title: "A proof page that closes", body: "Before-and-afters, markets, services and results, each labeled Reported or Verified." },
  { icon: "doc", tint: "peach", title: "Audits with your name on them", body: "Send owners a branded property audit or transformation proposal." },
  { icon: "chat", tint: "sage", title: "Inquiries from owners and investors", body: "Owners who bring a property are matched with pros who serve their market." },
] as const;

export default function HomePage() {
  return (
    <main id="top">
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="AYURE home">AYURE</a>
        <nav aria-label="Primary navigation">
          <a href="#explore">Explore</a>
          <a href="#professionals">Professionals</a>
          <a href="#examples">Properties</a>
          <a href="#stays">Stays</a>
          <a href="#examples">Opportunities</a>
          <a href="#how">About</a>
        </nav>
        <div className="header-actions">
          <a className="ghost-button" href="/join">Sign In</a>
          <a className="gradient-button" href="/join">Join AYURE <Icon name="arrow" /></a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-photo">
          <img src="/images/hero.jpg" alt="Terrace with a pergola and daybed above a sunlit coastline" />
        </div>
        <div className="hero-copy">
          <p className="eyebrow">PROPERTIES &nbsp;×&nbsp; PEOPLE &nbsp;×&nbsp; OPPORTUNITY</p>
          <h1>Where properties meet <span>opportunity.</span></h1>
          <p className="hero-lede">
            Discover exceptional properties, trusted operators, and expert services — all in one destination for the short-term rental economy.
          </p>
        </div>
        <IntentSearch />
      </section>

      <section className="cards" id="examples" aria-label="A look inside AYURE">
        <article className="card">
          <div className="card-media">
            <img src="/images/villa.jpg" alt="Villa with pergola and infinity pool" />
            <span className="pill"><i className="dot dot-green" />Example · Opportunity</span>
            <button type="button" className="heart" aria-label="Save this listing"><Icon name="heart" size={20} /></button>
          </div>
          <div className="card-body">
            <h3>Modern Villa with Sea Views</h3>
            <p className="card-location"><Icon name="pin" size={15} />Marbella, Spain</p>
            <div className="card-split">
              <div>
                <div className="price">€1,250,000</div>
                <div className="specs">
                  <span><Icon name="bed" size={16} />6 beds</span>
                  <span><Icon name="bath" size={16} />4 baths</span>
                  <span><Icon name="area" size={16} />320 m²</span>
                </div>
              </div>
              <div className="score" aria-label="Ayure Score 92, example">
                <span>Ayure Score</span>
                <strong>92</strong>
                <i className="score-bar"><b style={{ width: "92%" }} /></i>
                <small>EXAMPLE</small>
              </div>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-media">
            <img src="/images/pro.jpg" alt="Pergola-shaded daybed on a terrace by the sea" style={{ objectPosition: "center 60%" }} />
            <span className="pill"><i className="dot dot-orange" />Founding profile · open</span>
            <button type="button" className="heart" aria-label="Save this professional"><Icon name="heart" size={20} /></button>
            <span className="avatar-slot"><Icon name="person" size={26} stroke={1.6} /></span>
          </div>
          <div className="card-body card-body-pro">
            <h3>Your business, here</h3>
            <p className="card-sub">Short-term rental operator · consultant · designer</p>
            <p className="card-location"><Icon name="pin" size={15} />Your markets</p>
            <div className="platforms"><span>Airbnb</span><span>Booking.com</span><span>Vrbo</span><span>+ direct</span></div>
            <div className="stats">
              <div><strong>—</strong><span>Homes managed</span><small className="label-reported">REPORTED</small></div>
              <div><strong>—</strong><span>Owner rating</span><small className="label-verified">VERIFIED</small></div>
              <div><strong>—</strong><span>Guest revenue</span><small className="label-verified">VERIFIED</small></div>
            </div>
          </div>
        </article>

        <article className="card">
          <div className="card-media card-media-split">
            <img src="/images/before.jpg" alt="Bare, dated room before renovation" />
            <img src="/images/after.jpg" alt="The same room after renovation, furnished and bright" />
            <i className="seam" />
            <span className="seam-handle"><Icon name="compare" size={18} stroke={2} /></span>
            <span className="pill"><Icon name="wand" size={15} stroke={2} />Example transformation</span>
            <button type="button" className="heart" aria-label="Save this transformation"><Icon name="heart" size={20} /></button>
            <span className="ba ba-before">Before</span>
            <span className="ba ba-after">After</span>
          </div>
          <div className="card-body">
            <h3>From dated to destination</h3>
            <p className="card-location"><Icon name="pin" size={15} />Algarve, Portugal</p>
            <p className="card-text">Full renovation, design and operator setup. Revenue uplift publishes here once the evidence is attached.</p>
            <a className="card-action" href="#proof"><span><Icon name="shield" />How results get verified</span><Icon name="arrow" size={16} stroke={2} /></a>
          </div>
        </article>
      </section>

      <StayChannels />

      <section className="strip" id="proof">
        <div className="strip-items">
          <div><Icon name="home" size={30} stroke={1.4} /><div><strong>Founding collection</strong><span>Properties, labeled until live</span></div></div>
          <i className="strip-divider" />
          <div><Icon name="people" size={30} stroke={1.4} /><div><strong>Founding professionals</strong><span>Applications open</span></div></div>
          <i className="strip-divider" />
          <div><Icon name="shield" size={30} stroke={1.4} /><div><strong>No invented numbers</strong><span>Every figure carries its label</span></div></div>
        </div>
        <div className="legend">
          <span className="legend-title">PROOF STANDARD</span>
          <div className="legend-pills">
            <span className="proof proof-example"><i className="dot dot-ring" />Example</span>
            <span className="proof proof-projected"><i className="dot dot-orange" />Projected</span>
            <span className="proof proof-reported"><i className="dot dot-sage" />Reported</span>
            <span className="proof proof-verified"><Icon name="check" size={11} stroke={3} />Verified</span>
          </div>
        </div>
      </section>

      <section className="how" id="how">
        <div className="how-heading">
          <h2>A better way to grow in property.</h2>
          <p>AYURE connects investors, operators, buyers and experts to make short-term rental ownership simpler, smarter and more rewarding.</p>
        </div>
        <ol className="steps">
          {steps.map((step) => (
            <li key={step.title}>
              <span className="step-icon"><Icon name={step.icon} size={26} stroke={1.6} /></span>
              <span className="step-text">
                <span className="step-title">{step.title}<Icon name="arrow" /></span>
                <span className="step-body">{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="pros" id="professionals">
        <div className="pros-copy">
          <p className="eyebrow">FOR PROFESSIONALS</p>
          <h2>Built for the people who make stays perform.</h2>
          <p className="pros-lede">You help owners and investors buy, transform and operate short-term rentals. AYURE gives you a proof page that closes, audits with your name on them, and a place in front of the owners who need you.</p>
          <div className="pros-actions">
            <a className="gradient-button" href="/join?goal=I%20offer%20services%20to%20short-term%20rental%20owners">Apply as a founding pro <Icon name="arrow" /></a>
            <a className="outline-button" href="/join">Claim a founding profile</a>
          </div>
        </div>
        <div className="pros-features">
          {proFeatures.map((feature) => (
            <div className="feature" key={feature.title}>
              <span className={`feature-icon tint-${feature.tint}`}><Icon name={feature.icon} size={24} stroke={1.7} /></span>
              <div><strong>{feature.title}</strong><span>{feature.body}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="scenic">
        <div className="scenic-photo">
          <img src="/images/scenic.jpg" alt="Terrace at golden hour with the line “Extraordinary stays start with great people.”" />
        </div>
        <div className="scenic-copy">
          <p className="eyebrow">BUILT FOR A BRIGHTER TOMORROW</p>
          <h2>Properties, expertise and opportunity — together.</h2>
          <p>Whether you're an investor, operator, designer, property manager or buyer, AYURE gives you the people, properties and tools to go further.</p>
          <a className="gradient-button" href="/join">Join AYURE <Icon name="arrow" /></a>
        </div>
      </section>

      <footer>
        <div className="footer-brand">
          <a className="wordmark wordmark-small" href="#top">AYURE</a>
          <span>Early access. Listings and profiles shown are examples, not live inventory or results.</span>
        </div>
        <nav aria-label="Footer">
          <a href="#professionals">Professionals</a>
          <a href="#proof">Proof standard</a>
          <a href="/join">Join</a>
        </nav>
      </footer>
    </main>
  );
}
