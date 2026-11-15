export type Role = "Administrator" | "Inspector" | "Contractor";
export type Property = {
  id: string;
  name: string;
  address: string;
  client: string;
  areas: string[];
  layout?: string;
};
export type Asset = {
  id: string;
  propertyId: string;
  area: string;
  name: string;
  make: string;
  model: string;
  condition: string;
  photo?: string;
  x?: number;
  y?: number;
};
export type Task = {
  id: string;
  assetId: string;
  title: string;
  date: string;
  status:
    | "Scheduled"
    | "Issue reported"
    | "Assigned"
    | "Awaiting verification"
    | "Verified";
  notes: string;
  evidence?: string;
  invoice?: string;
  repair?: string;
};
export type Event = {
  id: string;
  assetId: string;
  text: string;
  actor: string;
  time: string;
  evidence?: string;
  invoice?: string;
};
export type Plan = {
  id: string;
  assetId: string;
  title: string;
  frequency: string;
  sources: { url: string; title: string }[];
  simulated: boolean;
  approved: boolean;
};
export type State = {
  properties: Property[];
  assets: Asset[];
  tasks: Task[];
  events: Event[];
  plans: Plan[];
};
export const uid = () => crypto.randomUUID();
const today = new Date().toISOString().slice(0, 10);
export const seed: State = {
  properties: [
    {
      id: "mercer",
      name: "The Mercer Kitchen",
      address: "148 Mercer Street, New York, NY 10012",
      client: "Mercer Hospitality",
      areas: ["Kitchen", "Bar", "Dining room", "Mechanical"],
    },
  ],
  assets: [
    {
      id: "refrigerator",
      propertyId: "mercer",
      area: "Kitchen",
      name: "Walk-in refrigerator",
      make: "Manufacturer unconfirmed",
      model: "Nameplate required",
      condition: "Needs attention",
      x: 31,
      y: 35,
    },
    {
      id: "range",
      propertyId: "mercer",
      area: "Kitchen",
      name: "Six-burner gas range",
      make: "Manufacturer unconfirmed",
      model: "Nameplate required",
      condition: "Good",
      x: 64,
      y: 55,
    },
    {
      id: "dishwasher",
      propertyId: "mercer",
      area: "Kitchen",
      name: "Undercounter dishwasher",
      make: "Manufacturer unconfirmed",
      model: "Nameplate required",
      condition: "Good",
      x: 78,
      y: 28,
    },
  ],
  tasks: [
    {
      id: "inspection-demo",
      assetId: "refrigerator",
      title: "Refrigeration condition inspection",
      date: today,
      status: "Scheduled",
      notes: "",
    },
  ],
  plans: [
    {
      id: "plan-demo",
      assetId: "refrigerator",
      title: "Inspect door seals and record operating condition",
      frequency: "Weekly — demo example; confirm with manufacturer",
      sources: [],
      simulated: true,
      approved: false,
    },
  ],
  events: [
    {
      id: "initial",
      assetId: "refrigerator",
      text: "Asset registered in Kitchen. Manufacturer identification pending.",
      actor: "Jesse · Administrator",
      time: new Date().toISOString(),
    },
  ],
};
export function calendarFile(task: Task, asset: Asset) {
  const day = task.date.replaceAll("-", "");
  const escape = (s: string) =>
    s
      .replaceAll("\\", "\\\\")
      .replaceAll("\n", "\\n")
      .replaceAll(",", "\\,")
      .replaceAll(";", "\\;");
  const alarms = [10080, 2880, 0]
    .map(
      (m) =>
        `BEGIN:VALARM\r\nTRIGGER:-PT${m}M\r\nACTION:DISPLAY\r\nDESCRIPTION:Maintenance reminder\r\nEND:VALARM`,
    )
    .join("\r\n");
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Juggle//Maintenance//EN\r\nBEGIN:VEVENT\r\nUID:${task.id}@juggle\r\nDTSTAMP:${new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(
      /\.\d{3}/,
      "",
    )}\r\nDTSTART;VALUE=DATE:${day}\r\nSUMMARY:${escape(task.title + " · " + asset.name)}\r\nDESCRIPTION:${escape("Assigned inspector: Demo inspector. Review in Juggle. Calendar handoff; updates do not synchronize.")}\r\n${alarms}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
}
