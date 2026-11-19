// Suggested questions, shared by the Ask AI panel and scripts/record-replays.mts so every suggestion has a recording.
// Pure and import-free (type imports only), so the Node recorder script can import it directly.
type Place = { slug: string; name: string; category: string; region: string | null };
type Person = { name: string };

export const GENERAL_QUESTIONS = [
  "Find locations connected to Lucia",
  "Which hotels are in Vice City?",
  "Where can I go out at night?",
  "Is there a theme park?",
];

export const characterQuestion = (person: Person) => `Find locations connected to ${person.name.split(" ")[0]}`;

// Each list is de-duplicated: questions double as React keys, and a repeated key leaves stale buttons behind.
export const suggestForCharacter = (person: Person) => [...new Set([characterQuestion(person), ...GENERAL_QUESTIONS])];

// Questions about the selected place first, then the general ones.
export function suggestQuestions(place: Place | null, connected: Set<string>): string[] {
  const own: string[] = [];
  if (place?.category === "Region") own.push(`What is in ${place.name}?`);
  else if (place?.region) own.push(`What else is in ${place.region}?`);
  if (place && connected.has(place.slug)) own.push(`Who is connected to ${place.name}?`);
  return [...new Set([...own, ...GENERAL_QUESTIONS])];
}

// Every question the UI can suggest, for recording.
export function allQuestions(places: Place[], connected: Set<string>, people: Person[]): string[] {
  return [...new Set([...places.flatMap((place) => suggestQuestions(place, connected)), ...people.map(characterQuestion)])];
}
