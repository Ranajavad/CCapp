// Google Places API (New) – used to pick a meeting place. Needs
// EXPO_PUBLIC_GOOGLE_PLACES_KEY; without it the app falls back to typed addresses.
const KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY;

export const placesEnabled = !!KEY;

export type Place = {
  place_id: string | null;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
};

export type PlaceSuggestion = { place_id: string; main: string; secondary: string };

export async function autocompletePlaces(input: string, language: string): Promise<PlaceSuggestion[]> {
  if (!KEY || input.trim().length < 2) return [];
  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY },
    body: JSON.stringify({ input, languageCode: language }),
  });
  if (!res.ok) throw new Error(`Places error (${res.status})`);
  const json = await res.json();
  return (json.suggestions ?? [])
    .map((s: any) => s.placePrediction)
    .filter(Boolean)
    .map((p: any) => ({
      place_id: p.placeId as string,
      main: (p.structuredFormat?.mainText?.text ?? p.text?.text ?? '') as string,
      secondary: (p.structuredFormat?.secondaryText?.text ?? '') as string,
    }));
}

export async function placeDetails(placeId: string, language: string): Promise<Place> {
  if (!KEY) throw new Error('Places key missing');
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${language}`,
    { headers: { 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'id,displayName,formattedAddress,location' } },
  );
  if (!res.ok) throw new Error(`Places error (${res.status})`);
  const p = await res.json();
  return {
    place_id: p.id ?? placeId,
    name: p.displayName?.text ?? '',
    address: p.formattedAddress ?? null,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
  };
}

/** Universal Google Maps link – opens the Google Maps app when installed. */
export function mapsUrl(p: { name?: string | null; address?: string | null; place_id?: string | null }) {
  const q = encodeURIComponent([p.name, p.address].filter(Boolean).join(', '));
  return `https://www.google.com/maps/search/?api=1&query=${q}${
    p.place_id ? `&query_place_id=${encodeURIComponent(p.place_id)}` : ''
  }`;
}
