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
      <div className="focus-step-strip" aria-label="Restaurant setup progress">
        {names.slice(0, 3).map((name, i) => (
          <button
            key={name}
            aria-current={step === i ? "step" : undefined}
            className={step === i ? "current" : completed[i] ? "done" : ""}
            onClick={() => setStep(i)}
          >
            <span>{completed[i] ? "✓" : i + 1}</span>
            {["Register restaurant", "Capture equipment", "Assign Manager"][i]}
          </button>
        ))}
      </div>
      <div className="journey-stage">
        <div className="journey-stage-heading">
          <div>
            <span className="eyebrow">
              {step < 3 ? `STEP ${step + 1} OF 3` : "SETUP COMPLETE"} ·{" "}
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
                  "Register the restaurant.",
                  "Capture the equipment.",
                  "Assign the Manager.",
                  "The Manager checks. The Director sees.",
                  "Need a specialist? Request the work.",
                  "Check the evidence. Close the job.",
                ][step]
              }
            </h2>
            <p>
              {
                [
                  "Save the restaurant details. Get its QR label. Then move to equipment.",
                  "Add an appliance, its photo and make/model. Each one gets a permanent equipment record.",
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
              p.onQR();
              p.notify(
                "Restaurant details recorded. Check the save status before opening this QR on another device.",
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
                Contact email
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={property.contactEmail}
                />
              </label>
            </div>
            <details className="optional-fields">
              <summary>Add phone number or floor plan (optional)</summary>
              <label className="field">
                Contact phone
                <input
                  name="phone"
                  type="tel"
                  defaultValue={property.contactPhone}
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
            </details>
            <div className="journey-cta">
              <button className="primary big-action" disabled={busy}>
                Save restaurant & get QR <ArrowRight size={20} />
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
              <button
                className={assets.length ? "secondary" : "primary big-action"}
                onClick={p.onAsset}
              >
                <Plus size={20} />{" "}
                {assets.length
                  ? "Add another appliance"
                  : "Add the first appliance"}
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
            {assets.length > 0 && (
              <div className="journey-cta">
                <button
                  className="primary big-action"
                  disabled={!completed[0]}
                  onClick={() => {
                    patch({ sweepCompletedAt: new Date().toISOString() });
                    setStep(2);
                    p.notify(
                      "First sweep marked complete. Assign the Manager next.",
                    );
                  }}
                >
                  Finish equipment capture & assign Manager{" "}
                  <ArrowRight size={20} />
                </button>
                <span>
                  {assets.length} equipment records · Missing details can be
                  completed later.
                </span>
              </div>
            )}
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
      <details className="journey-extras">
        <summary>
          View restaurant details, change steps or add another restaurant
        </summary>
        <button className="secondary" onClick={p.onQR}>
          Restaurant QR label
        </button>
        <button className="secondary" onClick={p.onNew}>
          Register another restaurant
        </button>
        {names.slice(3).map((name, i) => (
          <button
            className="secondary"
            key={name}
            onClick={() => setStep(i + 3)}
          >
            {name}
          </button>
        ))}
      </details>
    </section>
  );
}
