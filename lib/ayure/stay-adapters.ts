import { stayChannels, type StayProvider } from "./stay-affiliates";

export interface StaySearch {
  location: string;
  checkIn?: string;
  checkOut?: string;
  guests: number;
}

export interface StayConnection {
  id: StayProvider;
  name: string;
  href: string | null;
  status: "referral_ready" | "connection_pending";
  availability: "not_checked";
  reservation: "not_processed";
  outcome: "unverified";
}

export interface StayAdapter {
  provider: StayProvider;
  connect(search: StaySearch): StayConnection;
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}

export function validateStaySearch(input: unknown): StaySearch {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("A stay search is required.");
  }
  const data = input as Record<string, unknown>;
  if (typeof data.location !== "string") throw new Error("Enter a location.");
  const location = data.location.trim().replace(/\s+/g, " ");
  if (location.length < 2 || location.length > 120 || /[\u0000-\u001f\u007f]/.test(data.location)) {
    throw new Error("Location must be between 2 and 120 printable characters.");
  }
  const checkIn = data.checkIn === undefined || data.checkIn === "" ? undefined : data.checkIn;
  const checkOut = data.checkOut === undefined || data.checkOut === "" ? undefined : data.checkOut;
  if ((checkIn !== undefined || checkOut !== undefined) &&
      (typeof checkIn !== "string" || typeof checkOut !== "string" ||
       !validDate(checkIn) || !validDate(checkOut) || checkOut <= checkIn)) {
    throw new Error("Enter valid check-in and check-out dates in order.");
  }
  const guests = data.guests === undefined ? 2 : data.guests;
  if (typeof guests !== "number" || !Number.isInteger(guests) || guests < 1 || guests > 16) {
    throw new Error("Guests must be between 1 and 16.");
  }
  return { location, checkIn, checkOut, guests };
}

export const stayAdapters: readonly StayAdapter[] = stayChannels.map((channel) => ({
  provider: channel.id,
  connect(_search: StaySearch): StayConnection {
    // Never invent inventory, availability, dates in a URL, or a booking outcome.
    return {
      id: channel.id,
      name: channel.name,
      href: channel.href,
      status: channel.href ? "referral_ready" : "connection_pending",
      availability: "not_checked",
      reservation: "not_processed",
      outcome: "unverified",
    };
  },
}));

export function resolveStayConnections(search: StaySearch) {
  return stayAdapters.map((adapter) => adapter.connect(search));
}

export const stayConnections = resolveStayConnections({ location: "Not supplied", guests: 2 });
