// Plain-English wording for execution-trace steps, for people who are not developers.
// The raw calls stay available behind "Technical details". Arguments came from the model, so read them defensively.
import type { TraceStep } from "./ask";

export type StepText = { title: string; detail: string; ok: boolean };

const quoted = (args: unknown, key: string) => {
  const value = typeof args === "object" && args !== null ? (args as Record<string, unknown>)[key] : undefined;
  return typeof value === "string" ? `“${value}”` : "something unclear";
};

function describeCall(call: { name: string; arguments: unknown }) {
  if (call.name === "searchLocations") return `search the map for ${quoted(call.arguments, "q")}`;
  if (call.name === "findConnections") return `look up who and what is linked to ${quoted(call.arguments, "name")}`;
  return `use a tool called “${call.name}”`;
}

const places = (n: number) => `${n} ${n === 1 ? "place" : "places"}`;

export function describeStep(step: TraceStep): StepText {
  if (step.kind === "model") {
    return step.toolCalls.length
      ? { title: "Understood the question", detail: `Decided to ${step.toolCalls.map(describeCall).join(", then ")}.`, ok: true }
      : { title: "Wrote the answer", detail: "Told to answer only from the results above.", ok: true };
  }
  if (step.error === "Unknown tool") {
    return { title: "Blocked a request", detail: `The AI asked to ${describeCall(step)}, which is not allowed. Nothing ran.`, ok: false };
  }
  if (step.error) {
    return { title: "Rejected a request", detail: "The request was not in a valid form, so nothing ran.", ok: false };
  }
  const found = step.slugs?.length ?? 0;
  return {
    title: "Checked and looked it up",
    detail: `Request allowed and validated, then read from the database: ${found ? places(found) : "no matches"}.`,
    ok: true,
  };
}
