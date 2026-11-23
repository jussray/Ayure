import { stayConnections as stayChannels } from "../lib/ayure/stay-adapters";

export default function StayChannels() {
  const enabled = stayChannels.some((provider) => provider.href !== null);
  return (
    <section className="stay-distribution" id="stays" aria-labelledby="stays-title">
      <div className="stay-distribution-copy">
        <p className="eyebrow">STAYS · PROFESSIONALS · OPPORTUNITY</p>
        <h2 id="stays-title">Great stays start with great operators.</h2>
        <p>
          AYURE connects people and professionals across the short-term rental
          economy. Stay-discovery referrals are being prepared, but AYURE does
          not display live availability or process reservations.
        </p>
        <a
          className="gradient-button"
          href="/join?goal=I%20operate%20short-term%20rentals%20and%20want%20to%20join%20the%20AYURE%20network"
        >
          Join as a stay operator
        </a>
      </div>
      <div className="stay-channel-panel">
        <h3>Distribution channels</h3>
        <p>External stay platforms, with booking links enabled only when authorized.</p>
        <div className="stay-channel-list">
          {stayChannels.map((provider) => (
            <div className="stay-channel" key={provider.id}>
              <strong>{provider.name}</strong>
              {provider.href ? (
                <a
                  href={provider.href}
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  aria-label={`Explore stays on ${provider.name}, external affiliate link`}
                >
                  Explore stays ↗
                </a>
              ) : (
                <span>Connection pending</span>
              )}
            </div>
          ))}
        </div>
        <small>
          {enabled
            ? "External reservations happen on the provider's website. AYURE may earn a commission from qualifying referrals."
            : "Platform names identify possible distribution channels, not current partnerships. No third-party bookings or commissions are available through AYURE yet."}
        </small>
      </div>
    </section>
  );
}
