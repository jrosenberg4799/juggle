"use client";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  Plus,
  QrCode,
  Upload,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { Asset, Property, Role, State, uid } from "@/lib/model";
import type { Dispatch, SetStateAction } from "react";
import { dateKey } from "@/lib/operations";
import { registrationComplete, weeklyDates } from "@/lib/journey";
import { MediaPDF, uploadFile } from "@/lib/media";
type Props = {
  property: Property;
  data: State;
  setData: Dispatch<SetStateAction<State>>;
  onNew: () => void;
  onQR: () => void;
  onArea: () => void;
  onAsset: () => void;
  onOpenAsset: (id: string) => void;
  onRole: (role: Role) => void;
  notify: (text: string) => void;
  onReview: () => void;
};
export function RestaurantJourney(p: Props) {
  const { property, data, setData } = p;
  const assets = data.assets.filter(
    (a) => a.propertyId === property.id && !a.pendingApproval,
  );
  const completed = [
    registrationComplete(property),
    Boolean(property.sweepCompletedAt),
    Boolean(property.inspectionSchedule),
  ];
  const [step, setStep] = useState(() =>
    completed.findIndex((x) => !x) === -1 ? 3 : completed.findIndex((x) => !x),
  );
  const [busy, setBusy] = useState(false);
  const names = [
    "Register restaurant",
    "First documentation sweep",
    "Assign the Manager",
    "Run weekly inspections",
    "Request specialist work",
    "Review & close",
  ];
  function patch(changes: Partial<Property>) {
    setData((s) => ({
      ...s,
      properties: s.properties.map((x) =>
        x.id === property.id ? { ...x, ...changes } : x,
      ),
    }));
  }
  return (
    <section className="restaurant-journey">
      <div className="journey-heading">
        <span>DIRECTOR’S ROADMAP</span>
        <button className="secondary" onClick={p.onNew}>
          <Plus size={17} /> Register a new restaurant
        </button>
      </div>
      <ol
        className="journey-roadmap"
        aria-label="Restaurant maintenance roadmap"
      >
        {names.map((name, i) => (
          <li key={name}>
            <button
              aria-current={step === i ? "step" : undefined}
              className={step === i ? "current" : completed[i] ? "done" : ""}
              onClick={() => setStep(i)}
            >
              <span>{completed[i] ? <Check size={16} /> : i + 1}</span>
              <strong>{name}</strong>
              <small>
                {i < 3
                  ? "Director"
                  : i === 3
                    ? "Manager"
                    : i === 4
                      ? "Manager → Director"
                      : "Director"}
                {step === i ? " · YOU ARE HERE" : ""}
              </small>
            </button>
          </li>
        ))}
      </ol>
      <div className="journey-stage">
        <div className="journey-stage-heading">
          <div>
            <span className="eyebrow">
              STEP {step + 1} OF 6 ·{" "}
              {step < 3
                ? "DIRECTOR"
                : step === 3
                  ? "MANAGER"
                  : step === 4
                    ? "MANAGER → DIRECTOR"
                    : "DIRECTOR"}
            </span>
            <h2>
              {
                [
                  "Start with the restaurant.",
                  "Walk the rooms. Document what is there.",
                  "Hand the kitchen to its Manager.",
                  "The Manager checks. The Director sees.",
                  "Need a specialist? Request the work.",
                  "Check the evidence. Close the job.",
                ][step]
              }
            </h2>
            <p>
              {
                [
                  "Enter the details you will reuse. This becomes the restaurant record, linked to its floor plan and QR label.",
                  "This first sweep builds the equipment record. Add each room, photograph the appliances, and record their make and model.",
                  "Name the Manager and choose the first inspection date. Save the next four weekly visits so everyone knows what happens next.",
                  "The Manager opens the assigned restaurant, walks room by room, and reports what needs attention.",
                  "The Manager can request preventive service or a repair. The Director reviews and assigns it; the Subcontractor performs the work.",
                  "The Subcontractor sends notes and photos. The Director approves completion or returns the job with a correction.",
                ][step]
              }
            </p>
          </div>
        </div>
        {step === 0 && (
          <form
            className="journey-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              patch({
                name: String(f.get("name")).trim(),
                address: String(f.get("address")).trim(),
                client: String(f.get("owner")).trim(),
                ownerName: String(f.get("owner")).trim(),
                contactName: String(f.get("contact")).trim(),
                contactEmail: String(f.get("email")).trim(),
                contactPhone: String(f.get("phone")).trim(),
                registeredAt: property.registeredAt || new Date().toISOString(),
              });
              setStep(1);
              p.notify(
                "Restaurant registered. Its QR code is ready; next, document the rooms and equipment.",
              );
            }}
          >
            <div className="form-row">
              <label className="field">
                Restaurant name
                <input name="name" required defaultValue={property.name} />
              </label>
              <label className="field">
                Owner / company
                <input
                  name="owner"
                  required
                  defaultValue={property.ownerName || property.client}
                />
              </label>
            </div>
            <label className="field">
              Address
              <input name="address" required defaultValue={property.address} />
            </label>
            <div className="form-row">
              <label className="field">
                Main contact name
                <input
                  name="contact"
                  required
                  defaultValue={property.contactName}
                />
              </label>
              <label className="field">
                Contact phone
                <input
                  name="phone"
                  type="tel"
                  defaultValue={property.contactPhone}
                />
              </label>
            </div>
            <label className="field">
              Contact email
              <input
                name="email"
                type="email"
                required
                defaultValue={property.contactEmail}
              />
            </label>
            <label className="field">
              Floor-plan PDF (optional)
              <input
                type="file"
                accept="application/pdf"
                disabled={busy}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setBusy(true);
                  try {
                    patch({ layout: await uploadFile(file) });
                    p.notify("Floor plan linked to restaurant");
                  } catch (error) {
                    p.notify((error as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            </label>
            {property.layout && (
              <p className="journey-confirmation">
                <Check size={16} /> Floor plan linked
              </p>
            )}
            <div className="journey-cta">
              <button className="primary big-action" disabled={busy}>
                Save restaurant & continue <ArrowRight size={20} />
              </button>
              <button className="secondary" type="button" onClick={p.onQR}>
                <QrCode size={18} /> Open restaurant QR
              </button>
            </div>
          </form>
        )}
        {step === 1 && (
          <>
            {!completed[0] && (
              <div className="notice">
                Finish restaurant registration first.
                <button className="text-button" onClick={() => setStep(0)}>
                  Open Step 1
                </button>
              </div>
            )}
            <div className="sweep-actions">
              <button className="primary big-action" onClick={p.onAsset}>
                <Plus size={20} /> Photograph & register equipment
              </button>
              <button className="secondary" onClick={p.onArea}>
                <Plus size={18} /> Add a room
              </button>
              <button className="secondary" onClick={p.onQR}>
                <QrCode size={18} /> Print restaurant QR
              </button>
            </div>
            <div className="sweep-rooms">
              {property.areas.map((area) => (
                <div key={area}>
                  <h3>{area}</h3>
                  {assets
                    .filter((a) => a.area === area)
                    .map((a) => (
                      <button
                        className="sweep-equipment"
                        onClick={() => p.onOpenAsset(a.id)}
                        key={a.id}
                      >
                        <span>
                          {a.name}
                          <small>
                            {a.make} · {a.model}
                          </small>
                        </span>
                        <span
                          className={"badge " + (a.photo ? "green" : "amber")}
                        >
                          {a.photo ? "Photo saved" : "Photo missing"}
                        </span>
                        <ArrowRight size={16} />
                      </button>
                    ))}
                  {!assets.some((a) => a.area === area) && (
                    <p>No equipment documented yet.</p>
                  )}
                </div>
              ))}
            </div>
            {property.layout && (
              <details>
                <summary>View restaurant floor plan</summary>
                <MediaPDF path={property.layout} />
              </details>
            )}
            <div className="journey-cta">
              <button
                className="primary big-action"
                disabled={!assets.length || !completed[0]}
                onClick={() => {
                  patch({ sweepCompletedAt: new Date().toISOString() });
                  setStep(2);
                  p.notify(
                    "First sweep marked complete. Assign the Manager next.",
                  );
                }}
              >
                Finish first sweep & assign Manager <ArrowRight size={20} />
              </button>
              <span>
                {assets.length} equipment records · Missing details can be
                completed later.
              </span>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            {!completed[1] && (
              <div className="notice">
                Complete the first documentation sweep before handing over
                inspections.
                <button className="text-button" onClick={() => setStep(1)}>
                  Open Step 2
                </button>
              </div>
            )}
            <form
              className="journey-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const first = String(f.get("date"));
                const dates = weeklyDates(first);
                patch({
                  inspectionSchedule: {
                    managerName: String(f.get("manager")).trim(),
                    dates,
                    assignedAt: new Date().toISOString(),
                  },
                });
                setStep(3);
                p.notify(
                  "Manager assigned. Four weekly inspection dates saved.",
                );
              }}
            >
              <div className="form-row">
                <label className="field">
                  Manager name
                  <input
                    name="manager"
                    required
                    defaultValue={
                      property.inspectionSchedule?.managerName || "Alex"
                    }
                  />
                </label>
                <label className="field">
                  First weekly inspection
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={
                      property.inspectionSchedule?.dates[0] || dateKey()
                    }
                  />
                </label>
              </div>
              <p className="muted">
                This creates four weekly visit dates. Extend the schedule here
                when needed; continuous recurrence is not automated.
              </p>
              <button className="primary big-action" disabled={!completed[1]}>
                Assign Manager & save weekly dates <ArrowRight size={20} />
              </button>
            </form>
          </>
        )}
        {step === 3 && (
          <>
            <div className="handoff-card">
              <ClipboardCheck size={30} />
              <div>
                <strong>
                  {property.inspectionSchedule?.managerName ||
                    "Manager not assigned yet"}
                </strong>
                <p>
                  {property.inspectionSchedule
                    ? property.inspectionSchedule.dates
                        .map((d) => new Date(d + "T12:00").toLocaleDateString())
                        .join(" · ")
                    : "Complete Step 3 to set the weekly schedule."}
                </p>
              </div>
            </div>
            <button
              className="primary big-action"
              onClick={() => p.onRole("Manager")}
            >
              Open Manager walkthrough <ArrowRight size={20} />
            </button>
            <p className="muted">
              Prototype preview: switches the active interface. Findings remain
              visible to the Director.
            </p>
          </>
        )}
        {step === 4 && (
          <>
            <div className="handoff-chain">
              <span>Manager requests</span>
              <ArrowRight size={18} />
              <span>Director assigns</span>
              <ArrowRight size={18} />
              <span>Subcontractor works</span>
            </div>
            <button
              className="primary big-action"
              onClick={() => p.onRole("Manager")}
            >
              Open Manager’s request tools <ArrowRight size={20} />
            </button>
            <button
              className="secondary"
              onClick={() => p.onRole("Subcontractor")}
            >
              Preview assigned subcontractor work
            </button>
          </>
        )}
        {step === 5 && (
          <>
            <div className="handoff-chain">
              <span>Work submitted</span>
              <ArrowRight size={18} />
              <span>Director checks evidence</span>
              <ArrowRight size={18} />
              <span>History saved</span>
            </div>
            <button className="primary big-action" onClick={p.onReview}>
              Open jobs waiting for my decision <ArrowRight size={20} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
