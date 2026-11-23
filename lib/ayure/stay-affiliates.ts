/**
 * AYURE stay referrals: activation requires provider approval outside this code.
 * Only provider-owned HTTPS destinations are allowed by default.
 * Network redirectors require a reviewed explicit allowlist change.
 */
export type StayProvider = "booking" | "airbnb";

const allowedHosts: Record<StayProvider, readonly string[]> = {
  booking: ["booking.com", "www.booking.com"],
  airbnb: ["airbnb.com", "www.airbnb.com"],
};

export function approvedAffiliateHref(
  provider: StayProvider,
  candidate: string | undefined,
  approvalRecorded: boolean,
): string | null {
  if (!approvalRecorded || !candidate) return null;
  try {
    const url = new URL(candidate);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !allowedHosts[provider].includes(url.hostname.toLowerCase())
    ) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export const stayChannels = [
  {
    id: "booking",
    name: "Booking.com",
    href: approvedAffiliateHref(
      "booking",
      process.env.NEXT_PUBLIC_AYURE_BOOKING_LINK,
      process.env.NEXT_PUBLIC_AYURE_BOOKING_APPROVED === "true",
    ),
  },
  {
    id: "airbnb",
    name: "Airbnb",
    href: approvedAffiliateHref(
      "airbnb",
      process.env.NEXT_PUBLIC_AYURE_AIRBNB_LINK,
      process.env.NEXT_PUBLIC_AYURE_AIRBNB_APPROVED === "true",
    ),
  },
] as const;
