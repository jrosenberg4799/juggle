import type { State } from "./model";
export type CloudReceipt = {
  revision: number;
  savedAt: string;
  restaurants: number;
  equipment: number;
  events: number;
  files: number;
};
function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
export function sameWorkspace(a: State, b: State) {
  return (
    canonical(JSON.parse(JSON.stringify(a))) ===
    canonical(JSON.parse(JSON.stringify(b)))
  );
}
export function receiptFor(
  state: State,
  revision: number,
  savedAt: string,
): CloudReceipt {
  const paths = new Set<string>();
  function scan(value: unknown) {
    if (typeof value === "string" && value.startsWith("storage://"))
      paths.add(value);
    else if (Array.isArray(value)) value.forEach(scan);
    else if (value && typeof value === "object")
      Object.values(value).forEach(scan);
  }
  scan(state);
  return {
    revision,
    savedAt,
    restaurants: state.properties.length,
    equipment: state.assets.length,
    events: state.events.length,
    files: paths.size,
  };
}
export function verifySavedWorkspace(
  expected: State,
  expectedRevision: number,
  row: { data: State; revision: number; updated_at: string } | null,
) {
  if (
    !row ||
    row.revision !== expectedRevision ||
    !sameWorkspace(expected, row.data)
  )
    throw Error(
      "The cloud read-back did not match this save. Your changes have not been confirmed.",
    );
  return receiptFor(row.data, row.revision, row.updated_at);
}
export class ReadbackError extends Error {
  constructor(
    message: string,
    public committedRevision: number,
  ) {
    super(message);
    this.name = "ReadbackError";
  }
}
