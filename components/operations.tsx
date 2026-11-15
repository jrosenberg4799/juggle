"use client";
import { useState } from "react";
import { ActionBar, Panel, DialogLayer } from "./workspace-ui";
import type { Dispatch, SetStateAction } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Download,
  MapPin,
  Plus,
  ShieldCheck,
  Wrench,
  X,
  Camera,
  Clock3,
} from "lucide-react";
import {
  Asset,
  CheckAnswer,
  Role,
  State,
  Task,
  Walkthrough,
  uid,
  calendarFile,
} from "@/lib/model";
import {
  addDays,
  csvCell,
  dateKey,
  stage,
  submitWalkthrough,
  taskKind,
  taskOwner,
  taskTransition,
} from "@/lib/operations";
import { MediaImage, MediaLink, uploadFile } from "@/lib/media";
import { Gantt } from "./gantt";
import { RestaurantJourney } from "./restaurant-journey";
type Props = {
  data: State;
  setData: Dispatch<SetStateAction<State>>;
  role: Role;
  propertyId: string;
  setPropertyId: (id: string) => void;
  mode: "home" | "schedule";
  onAsset: (id: string) => void;
  onRegister: () => void;
  onSchedule: () => void;
  onSetup: () => void;
  onNewRestaurant: () => void;
  onRestaurantQR: () => void;
  onAddRoom: () => void;
  onRole: (role: Role) => void;
  notify: (text: string) => void;
};
export function Operations(p: Props) {
  const { data, setData, role, notify } = p;
  const [jobId, setJobId] = useState<string | null>(null),
    [walking, setWalking] = useState(false),
    [index, setIndex] = useState(0),
    [report, setReport] = useState(false),
    [requesting, setRequesting] = useState(false),
    [reviewOpen, setReviewOpen] = useState(false);
  const property =
    data.properties.find((x) => x.id === p.propertyId) || data.properties[0];
  const assets = data.assets.filter(
    (a) => a.propertyId === property.id && !a.pendingApproval,
  );
  const tasks = data.tasks.filter((t) =>
    assets.some((a) => a.id === t.assetId),
  );
  const rounds = (data.walkthroughs || []).filter(
    (r) => r.propertyId === property.id,
  );
  const managerName = property.inspectionSchedule?.managerName || "Alex";
  const draft = rounds.find((r) => !r.submittedAt);
  const job = data.tasks.find((t) => t.id === jobId);
  const waiting = tasks.filter((t) => t.status === "Awaiting verification");
  const issues = tasks.filter((t) => t.status === "Issue reported");
  const pending = data.assets.filter(
    (a) => a.propertyId === property.id && a.pendingApproval,
  );
  const scheduleRows: Task[] = [
    ...tasks,
    ...(property.inspectionSchedule?.dates || []).map((date) => {
      const visit = rounds.find(
        (r) => r.scheduledDate === date && r.submittedAt,
      );
      return {
        id: "visit:" + date,
        assetId: "restaurant:" + property.id,
        scope: "Restaurant" as const,
        title: "Weekly restaurant walkthrough",
        date,
        startDate: date,
        kind: "Inspection" as const,
        owner: "Manager" as const,
        status: visit?.approvedAt
          ? ("Verified" as const)
          : visit
            ? ("Awaiting verification" as const)
            : ("Scheduled" as const),
        notes: "",
      };
    }),
  ];
  function openSchedule(id: string) {
    if (id.startsWith("visit:")) {
      p.onRole("Manager");
      notify("Manager interface opened for the restaurant walkthrough.");
      return;
    }
    setJobId(id);
  }
  function change(id: string, next: Task["status"], extra: Partial<Task> = {}) {
    try {
      const state = taskTransition(data, id, role, next, extra);
      setData(state);
      notify(
        next === "Awaiting verification"
          ? "Sent to Director for review"
          : next === "Verified"
            ? "Work approved and saved to equipment history"
            : "Job updated",
      );
      return true;
    } catch (e) {
      notify((e as Error).message);
      return false;
    }
  }
  function startWalk() {
    if (!assets.length) {
      notify("Add equipment before starting a walkthrough.");
      return;
    }
    if (!draft) {
      const r: Walkthrough = {
        id: uid(),
        propertyId: property.id,
        assetIds: property.areas.flatMap((area) =>
          assets.filter((a) => a.area === area).map((a) => a.id),
        ),
        startedAt: new Date().toISOString(),
        managerName,
        scheduledDate: property.inspectionSchedule?.dates.find(
          (date) =>
            !rounds.some((r) => r.scheduledDate === date && r.submittedAt),
        ),
        answers: {},
      };
      setData((s) => ({ ...s, walkthroughs: [...(s.walkthroughs || []), r] }));
    }
    setIndex(0);
    setWalking(true);
  }
  function exportReport() {
    const rows = [
      [
        "Restaurant",
        "Room",
        "Equipment",
        "Condition",
        "Job",
        "Work type",
        "Owner",
        "Start",
        "Due",
        "Stage",
        "Finding",
        "Work completed",
      ],
      ...assets.flatMap((a) => {
        const jobs = tasks.filter((t) => t.assetId === a.id);
        return jobs.length
          ? jobs.map((t) => [
              property.name,
              a.area,
              a.name,
              a.condition,
              t.title,
              taskKind(t),
              taskOwner(t),
              t.startDate || t.date,
              t.date,
              stage(t),
              t.notes,
              t.repair || "",
            ])
          : [
              [
                property.name,
                a.area,
                a.name,
                a.condition,
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
              ],
            ];
      }),
    ];
    const blob = new Blob(
      ["\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "juggle-operations-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportInspections() {
    const rows = [
      [
        "Restaurant",
        "Room",
        "Equipment",
        "Checked at",
        "Result",
        "Reading",
        "Note",
        "Routine care",
        "Director reviewed",
      ],
      ...rounds
        .filter((r) => r.submittedAt)
        .flatMap((r) =>
          r.assetIds.map((id) => {
            const asset = data.assets.find((a) => a.id === id);
            const a = r.answers[id];
            return [
              property.name,
              asset?.area,
              asset?.name,
              r.submittedAt,
              a?.result,
              a?.reading,
              a?.note,
              a?.careDone ? "Yes" : "No",
              r.approvedAt || "Pending",
            ];
          }),
        ),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "juggle-weekly-inspections.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  function approveRound(r: Walkthrough) {
    setData((s) => ({
      ...s,
      walkthroughs: s.walkthroughs?.map((x) =>
        x.id === r.id ? { ...x, approvedAt: new Date().toISOString() } : x,
      ),
      events: [
        ...r.assetIds.map((assetId) => ({
          id: uid(),
          assetId,
          text: "Director reviewed weekly walkthrough. Reported issues remain open until separately resolved.",
          actor: "Jesse · Director",
          time: new Date().toISOString(),
        })),
        ...s.events,
      ],
    }));
    notify("Walkthrough reviewed. Open issues still need their own decision.");
  }
  return (
    <div className="operations">
      <div className="ops-location">
        <div>
          <MapPin size={18} />
          <label>
            Restaurant
            <select
              aria-label="Working restaurant"
              value={property.id}
              onChange={(e) => {
                p.setPropertyId(e.target.value);
                setWalking(false);
                setIndex(0);
              }}
            >
              {data.properties.map((x) => (
                <option value={x.id} key={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <span className="ops-altitude">
          {role === "Director"
            ? "LEVEL 1 · OVERSEE THE RESTAURANT"
            : role === "Manager"
              ? "LEVEL 2 · CHECK ROOMS & EQUIPMENT"
              : "LEVEL 3 · DO THE ASSIGNED WORK"}
        </span>
      </div>
      <div className="role-purpose">
        <span className="role-symbol">
          {role === "Director" ? (
            <ShieldCheck />
          ) : role === "Manager" ? (
            <ClipboardCheck />
          ) : (
            <Wrench />
          )}
        </span>
        <div>
          <strong>
            {role === "Director"
              ? "You plan. You decide. You approve."
              : role === "Manager"
                ? "Walk the kitchen. Check each item. Report what you find."
                : "Do the work. Show the result. Send it for approval."}
          </strong>
          <p>
            {role === "Director"
              ? "Jesse · Director — work is not complete until you approve it."
              : role === "Manager"
                ? managerName +
                  " · Manager — simple care is yours; specialist work goes to a subcontractor."
                : "Sam · Subcontractor — specialist preventive service and repairs assigned by the Director."}
          </p>
        </div>
      </div>
      {p.mode === "schedule" ? (
        <>
          <div className="ops-actions">
            <h2>
              {role === "Director"
                ? "All work at this restaurant"
                : "Your work schedule"}
            </h2>
            {role === "Director" && (
              <button className="primary" onClick={p.onSchedule}>
                <Plus size={18} /> Schedule work
              </button>
            )}
          </div>
          <Gantt
            tasks={
              role !== "Subcontractor"
                ? scheduleRows
                : tasks.filter(
                    (t) =>
                      taskOwner(t) === role && t.status !== "Issue reported",
                  )
            }
            assets={assets}
            onSelect={openSchedule}
          />
        </>
      ) : role === "Director" ? (
        <>
          {tasks.some(
            (t) =>
              t.date < dateKey() &&
              ["Issue reported", "Awaiting verification"].includes(t.status),
          ) && (
            <div className="decision-spotlight">
              <strong>
                !{" "}
                {
                  tasks.filter(
                    (t) =>
                      t.date < dateKey() &&
                      ["Issue reported", "Awaiting verification"].includes(
                        t.status,
                      ),
                  ).length
                }{" "}
                overdue decisions need you
              </strong>
              <button
                className="secondary"
                onClick={() => {
                  setReviewOpen(true);
                  document
                    .getElementById("director-decisions")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Review now →
              </button>
            </div>
          )}
          <RestaurantJourney
            key={property.id}
            property={property}
            data={data}
            setData={setData}
            onNew={p.onNewRestaurant}
            onQR={p.onRestaurantQR}
            onArea={p.onAddRoom}
            onAsset={p.onRegister}
            onOpenAsset={p.onAsset}
            onRole={p.onRole}
            notify={notify}
            onReview={() => {
              setReviewOpen(true);
              document
                .getElementById("director-decisions")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          <details className="panel schedule-details">
            <summary>View the Gantt schedule & plan additional work</summary>
            <button className="secondary" onClick={p.onSchedule}>
              Schedule care or repair
            </button>
            <Gantt
              tasks={scheduleRows}
              assets={assets}
              onSelect={openSchedule}
            />
          </details>
          <details
            id="director-decisions"
            className="decision-section panel"
            open={reviewOpen}
            onToggle={(e) => setReviewOpen(e.currentTarget.open)}
          >
            <summary>
              View Director decisions (
              {issues.length +
                waiting.length +
                pending.length +
                rounds.filter((r) => r.submittedAt && !r.approvedAt)
                  .length}{" "}
              waiting)
            </summary>
            <div className="ops-section-head">
              <h2>Your decisions</h2>
              <span>Jesse · Director</span>
            </div>
            {!issues.length &&
              !waiting.length &&
              !pending.length &&
              !rounds.some((r) => r.submittedAt && !r.approvedAt) && (
                <div className="panel ops-empty">
                  <CheckCircle2 />
                  <h3>Nothing waiting for your decision.</h3>
                  <p>
                    Schedule preventive care or have the Manager start a
                    walkthrough.
                  </p>
                </div>
              )}
            <div className="decision-grid">
              {pending.map((a) => (
                <section className="panel decision" key={a.id}>
                  <span className="badge amber">
                    New equipment · Manager submission
                  </span>
                  <h3>{a.name}</h3>
                  <p>
                    {a.area} · {a.make} · {a.model}
                  </p>
                  <button className="secondary" onClick={() => p.onAsset(a.id)}>
                    View equipment
                  </button>
                  <button
                    className="primary"
                    onClick={() =>
                      setData((s) => ({
                        ...s,
                        assets: s.assets.map((x) =>
                          x.id === a.id ? { ...x, pendingApproval: false } : x,
                        ),
                        events: [
                          {
                            id: uid(),
                            assetId: a.id,
                            text: "Director approved equipment registration",
                            actor: "Jesse · Director",
                            time: new Date().toISOString(),
                          },
                          ...s.events,
                        ],
                      }))
                    }
                  >
                    Approve equipment
                  </button>
                </section>
              ))}
              {[...issues, ...waiting].map((t) => (
                <JobCard
                  key={t.id}
                  task={t}
                  asset={assets.find((a) => a.id === t.assetId)}
                  onOpen={() => setJobId(t.id)}
                />
              ))}
              {rounds
                .filter((r) => r.submittedAt && !r.approvedAt)
                .map((r) => (
                  <section className="panel decision" key={r.id}>
                    <span className="badge">
                      Weekly walkthrough · Ready for review
                    </span>
                    <h3>{r.assetIds.length} equipment checks</h3>
                    <p>
                      {r.managerName || managerName} · Manager ·{" "}
                      {new Date(r.submittedAt!).toLocaleDateString()}
                    </p>
                    <RoundReport round={r} data={data} />
                    <button className="primary" onClick={() => approveRound(r)}>
                      Confirm walkthrough reviewed
                    </button>
                  </section>
                ))}
            </div>
          </details>
        </>
      ) : role === "Manager" ? (
        <>
          <div className="manager-roadmap">
            <button onClick={startWalk}>
              <span>1</span> Do the weekly walkthrough
            </button>
            <ArrowRight size={18} />
            <button onClick={() => setRequesting(true)}>
              <span>2</span> Request specialist work
            </button>
            <ArrowRight size={18} />
            <button
              onClick={() =>
                document
                  .getElementById("specialist-progress")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <span>3</span> Track the work below you
            </button>
          </div>
          {property.inspectionSchedule && (
            <div className="manager-assignment">
              <strong>
                Assigned by Director · {property.inspectionSchedule.managerName}
              </strong>
              <span>
                Weekly visits:{" "}
                {property.inspectionSchedule.dates
                  .map((d) => new Date(d + "T12:00").toLocaleDateString())
                  .join(" · ")}
              </span>
            </div>
          )}
          <button
            className="secondary request-specialist-button"
            onClick={() => setRequesting(!requesting)}
          >
            <Wrench size={18} /> Request a subcontractor
          </button>
          {requesting && (
            <SpecialistRequest
              assets={assets}
              onClose={() => setRequesting(false)}
              onSave={(assetId, kind, title, notes, date) => {
                const task: Task = {
                  id: uid(),
                  assetId,
                  title,
                  notes,
                  date,
                  startDate: date,
                  kind,
                  owner: "Subcontractor",
                  status: "Issue reported",
                };
                setData((s) => ({
                  ...s,
                  tasks: [...s.tasks, task],
                  events: [
                    {
                      id: uid(),
                      assetId,
                      text: `Manager requested ${kind.toLowerCase()}: ${notes}`,
                      actor:
                        (property.inspectionSchedule?.managerName || "Alex") +
                        " · Manager",
                      time: new Date().toISOString(),
                    },
                    ...s.events,
                  ],
                }));
                setRequesting(false);
                notify(
                  "Request sent to Director. A subcontractor is assigned only after review.",
                );
              }}
            />
          )}

          {walking && draft ? (
            <WalkthroughRunner
              key={draft.id}
              round={draft}
              data={data}
              index={index}
              setIndex={setIndex}
              setData={setData}
              onAsset={p.onAsset}
              notify={notify}
              onClose={() => setWalking(false)}
              onSubmit={() => {
                try {
                  setData(submitWalkthrough(data, draft.id));
                  setWalking(false);
                  notify(
                    "Walkthrough sent to the Director. Problems are waiting for review.",
                  );
                } catch (e) {
                  notify((e as Error).message);
                }
              }}
            />
          ) : (
            <>
              <section className="walk-start">
                <div className="walk-copy">
                  <span className="eyebrow">YOUR MAIN JOB THIS WEEK</span>
                  <h2>Check the kitchen.</h2>
                  <p>
                    Go room by room. For each appliance: check it, add a note if
                    needed, then move on.
                  </p>
                  <div className="walk-meta">
                    <span>{property.areas.length} rooms</span>
                    <span>{assets.length} appliances</span>
                    <span>{managerName} · Manager</span>
                  </div>
                  <ActionBar backDisabled>
                    <button
                      className="primary big-action"
                      onClick={startWalk}
                      disabled={!assets.length}
                    >
                      {draft
                        ? "Continue walkthrough"
                        : "Start weekly walkthrough"}
                      <ArrowRight size={20} />
                    </button>
                  </ActionBar>
                  {draft && (
                    <p className="muted">
                      {
                        Object.values(draft.answers).filter((a) => a.result)
                          .length
                      }{" "}
                      of {draft.assetIds.length} checks saved. You can leave and
                      come back.
                    </p>
                  )}
                  {!assets.length && (
                    <p>Add equipment for Director review before starting.</p>
                  )}
                </div>
                <div className="walk-route">
                  {property.areas.map((area, i) => (
                    <div key={area}>
                      <span>{i + 1}</span>
                      <strong>{area}</strong>
                      <small>
                        {assets.filter((a) => a.area === area).length}{" "}
                        appliances
                      </small>
                    </div>
                  ))}
                </div>
              </section>
              <div className="ops-actions">
                <button className="secondary" onClick={p.onRegister}>
                  <Plus size={18} /> Found equipment? Add for review
                </button>
                <button
                  className="secondary"
                  onClick={() => setReport(!report)}
                >
                  <ClipboardCheck size={18} /> {report ? "Hide" : "View"}{" "}
                  inspection reports
                </button>
              </div>
            </>
          )}
          <div className="ops-section-head">
            <h2>Simple care & scheduled work</h2>
            <span>Assigned to Manager</span>
          </div>
          <div className="decision-grid">
            {tasks
              .filter(
                (t) =>
                  taskOwner(t) === "Manager" &&
                  !["Issue reported", "Verified"].includes(t.status),
              )
              .map((t) => (
                <JobCard
                  key={t.id}
                  task={t}
                  asset={assets.find((a) => a.id === t.assetId)}
                  onOpen={() => setJobId(t.id)}
                />
              ))}
          </div>
          {!tasks.some(
            (t) =>
              taskOwner(t) === "Manager" &&
              !["Issue reported", "Verified"].includes(t.status),
          ) && <p className="muted">No additional care tasks assigned.</p>}
        </>
      ) : (
        <>
          <div className="ops-section-head">
            <h2>Assigned to you</h2>
            <span>Sam · Subcontractor</span>
          </div>
          <div className="decision-grid">
            {tasks
              .filter(
                (t) =>
                  taskOwner(t) === "Subcontractor" &&
                  t.status !== "Issue reported" &&
                  t.status !== "Verified",
              )
              .map((t) => (
                <JobCard
                  key={t.id}
                  task={t}
                  asset={assets.find((a) => a.id === t.assetId)}
                  onOpen={() => setJobId(t.id)}
                />
              ))}
          </div>
          {!tasks.some(
            (t) =>
              taskOwner(t) === "Subcontractor" &&
              !["Issue reported", "Verified"].includes(t.status),
          ) && (
            <section className="panel ops-empty">
              <Wrench />
              <h3>No assigned jobs right now.</h3>
              <p>
                The Director assigns specialist preventive service and repairs.
                Reported problems appear here after assignment.
              </p>
            </section>
          )}
          <details className="panel completed-jobs">
            <summary>
              Completed jobs (
              {
                tasks.filter(
                  (t) =>
                    taskOwner(t) === "Subcontractor" && t.status === "Verified",
                ).length
              }
              )
            </summary>
            {tasks
              .filter(
                (t) =>
                  taskOwner(t) === "Subcontractor" && t.status === "Verified",
              )
              .map((t) => (
                <button
                  className="list-item"
                  key={t.id}
                  onClick={() => setJobId(t.id)}
                >
                  {t.title}
                  <span className="badge green">Complete</span>
                </button>
              ))}
          </details>
        </>
      )}
      {role === "Manager" && (
        <section id="specialist-progress">
          <div className="ops-section-head">
            <h2>Subcontractor work you can track</h2>
            <span>View progress · Director assigns and approves</span>
          </div>
          <div className="decision-grid">
            {tasks
              .filter((t) => taskOwner(t) === "Subcontractor")
              .map((t) => (
                <JobCard
                  key={t.id}
                  task={t}
                  asset={assets.find((a) => a.id === t.assetId)}
                  onOpen={() => setJobId(t.id)}
                />
              ))}
          </div>
          {!tasks.some((t) => taskOwner(t) === "Subcontractor") && (
            <p>No specialist requests or assigned jobs yet.</p>
          )}
        </section>
      )}
      {role !== "Subcontractor" && (
        <section className="ops-report">
          <div className="ops-actions">
            <button className="text-button" onClick={() => setReport(!report)}>
              {report ? "Hide" : "Show"} operating report & equipment history
            </button>
            <button className="secondary" onClick={exportReport}>
              <Download size={16} /> Export report (CSV)
            </button>
          </div>
          {report && (
            <>
              <div className="panel">
                <div className="ops-actions">
                  <h2>Weekly inspection reports</h2>
                  <button className="secondary" onClick={exportInspections}>
                    <Download size={16} /> Export inspection findings
                  </button>
                </div>
                {rounds.filter((r) => r.submittedAt).length ? (
                  rounds
                    .filter((r) => r.submittedAt)
                    .map((r) => (
                      <div key={r.id}>
                        <p>
                          <strong>
                            {new Date(r.submittedAt!).toLocaleString()}
                          </strong>{" "}
                          ·{" "}
                          {r.approvedAt
                            ? "Director reviewed"
                            : "Waiting for Director review"}
                        </p>
                        <RoundReport round={r} data={data} />
                      </div>
                    ))
                ) : (
                  <p>No completed walkthroughs yet.</p>
                )}
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Room / equipment</th>
                      <th>Condition</th>
                      <th>History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((a) => (
                      <tr key={a.id}>
                        <td>
                          {a.area}
                          <small>{a.name}</small>
                        </td>
                        <td>{a.condition}</td>
                        <td>
                          <button
                            className="secondary"
                            onClick={() => p.onAsset(a.id)}
                          >
                            Open record
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
      {job && (
        <JobDialog
          key={job.id}
          task={job}
          asset={data.assets.find((a) => a.id === job.assetId)}
          role={role}
          change={change}
          notify={notify}
          onClose={() => setJobId(null)}
          onAsset={() => {
            setJobId(null);
            p.onAsset(job.assetId);
          }}
          onCalendar={() => {
            const a = data.assets.find((a) => a.id === job.assetId);
            if (!a) return;
            const url = URL.createObjectURL(
              new Blob([calendarFile(job, a)], { type: "text/calendar" }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = "juggle-maintenance.ics";
            link.click();
            URL.revokeObjectURL(url);
            notify(
              "Calendar event exported. This is a handoff, not live synchronization.",
            );
          }}
          reschedule={(start, date) => {
            setData((s) => ({
              ...s,
              tasks: s.tasks.map((t) =>
                t.id === job.id ? { ...t, startDate: start, date } : t,
              ),
              events: [
                {
                  id: uid(),
                  assetId: job.assetId,
                  text: `Schedule updated: ${start} to ${date}`,
                  actor: "Jesse · Director",
                  time: new Date().toISOString(),
                },
                ...s.events,
              ],
            }));
            notify("Schedule updated");
          }}
        />
      )}
    </div>
  );
}
function JobCard({
  task,
  asset,
  onOpen,
}: {
  task: Task;
  asset?: Asset;
  onOpen: () => void;
}) {
  return (
    <button className="panel job-card" onClick={onOpen}>
      <div className="job-top">
        <span
          className={
            "badge " +
            (task.status === "Issue reported"
              ? "amber"
              : task.status === "Verified"
                ? "green"
                : "")
          }
        >
          {stage(task)}
        </span>
        <span>{taskKind(task)}</span>
      </div>
      <h3>{task.title}</h3>
      <p>
        {asset?.area} · {asset?.name}
      </p>
      <div className="job-bottom">
        <span>
          <strong>{taskOwner(task)}</strong> · Due{" "}
          {new Date(task.date + "T12:00").toLocaleDateString()}
        </span>
        <span className="job-open-label">
          Open job <ArrowRight size={20} />
        </span>
      </div>
    </button>
  );
}
function RoundReport({ round, data }: { round: Walkthrough; data: State }) {
  return (
    <details className="round-report">
      <summary>View checks and findings</summary>
      {round.assetIds.map((id) => {
        const a = data.assets.find((a) => a.id === id),
          answer = round.answers[id];
        return (
          <div className="round-answer" key={id}>
            <strong>
              {a?.area} · {a?.name || "Equipment"}
            </strong>
            <span
              className={
                "badge " + (answer?.result === "Okay" ? "green" : "amber")
              }
            >
              {answer?.result || "Not checked"}
            </span>
            {answer?.note && <p>{answer.note}</p>}
            {answer?.reading && <p>Reading: {answer.reading}</p>}
            {answer?.careDone && <p>Routine care completed</p>}
            {answer?.photo && (
              <MediaLink path={answer.photo}>View inspection photo</MediaLink>
            )}
          </div>
        );
      })}
    </details>
  );
}
function WalkthroughRunner({
  round,
  data,
  index,
  setIndex,
  setData,
  onAsset,
  notify,
  onClose,
  onSubmit,
}: {
  round: Walkthrough;
  data: State;
  index: number;
  setIndex: (i: number) => void;
  setData: Dispatch<SetStateAction<State>>;
  onAsset: (id: string) => void;
  notify: (s: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const id = round.assetIds[index];
  const asset = data.assets.find((a) => a.id === id);
  const answer = round.answers[id];
  const [uploading, setUploading] = useState(false);
  const [review, setReview] = useState(false);
  function record(patch: Partial<CheckAnswer>) {
    setData((s) => ({
      ...s,
      walkthroughs: s.walkthroughs?.map((r) =>
        r.id === round.id
          ? {
              ...r,
              answers: {
                ...r.answers,
                [id]: {
                  ...r.answers[id],
                  note: r.answers[id]?.note || "",
                  ...patch,
                } as CheckAnswer,
              },
            }
          : r,
      ),
    }));
  }
  if (!asset)
    return (
      <div className="notice">
        This equipment is no longer available. Contact the Director.
        <button onClick={onClose}>Close walkthrough</button>
      </div>
    );
  const valid =
    answer?.result && (answer.result === "Okay" || answer.note.trim());
  const complete = round.assetIds.filter(
    (id) => round.answers[id]?.result,
  ).length;
  return (
    <Panel className="inspection-runner">
      <div className="runner-top">
        <span>
          WEEKLY WALKTHROUGH · {round.managerName || "Alex"} / MANAGER
        </span>
        <button className="secondary" onClick={onClose}>
          Save & leave
        </button>
      </div>
      <div className="runner-progress">
        <span
          style={{ width: `${(complete / round.assetIds.length) * 100}%` }}
        />
      </div>
      <div className="runner-location">
        <span>
          Room: <strong>{asset.area}</strong>
        </span>
        <span>
          Appliance {index + 1} of {round.assetIds.length}
        </span>
      </div>
      {review ? (
        <div className="runner-review">
          <h2>Ready to send?</h2>
          <p>
            The Director will review these findings. Problems do not
            automatically order repairs.
          </p>
          <RoundReport round={round} data={data} />
          <ActionBar onBack={() => setReview(false)}>
            <button className="primary big-action" onClick={onSubmit}>
              Send walkthrough to Director <ArrowRight size={20} />
            </button>
          </ActionBar>
        </div>
      ) : (
        <>
          <div className="runner-equipment">
            {asset.photo && (
              <div className="runner-photo">
                <MediaImage path={asset.photo} alt={asset.name} />
              </div>
            )}
            <div>
              <h2>{asset.name}</h2>
              <p>
                {asset.make} · {asset.model}
              </p>
              <button className="text-button" onClick={() => onAsset(id)}>
                Open full equipment record
              </button>
            </div>
          </div>
          <h3>How does it look?</h3>
          <p className="runner-instruction">
            Check its general condition. Choose one answer.
          </p>
          <div className="condition-choices">
            {(["Okay", "Needs attention", "Not checked"] as const).map(
              (result) => (
                <button
                  aria-pressed={answer?.result === result}
                  className={
                    answer?.result === result
                      ? "selected " + result.toLowerCase().replace(" ", "-")
                      : ""
                  }
                  key={result}
                  onClick={() => record({ result })}
                >
                  {result === "Okay" ? (
                    <CheckCircle2 size={25} />
                  ) : result === "Needs attention" ? (
                    <Wrench size={25} />
                  ) : (
                    <Clock3 size={25} />
                  )}
                  <strong>{result}</strong>
                  <small>
                    {result === "Okay"
                      ? "No problem noticed"
                      : result === "Needs attention"
                        ? "Tell the Director what you found"
                        : "Explain why you could not check it"}
                  </small>
                </button>
              ),
            )}
          </div>
          <label className="field">
            {answer?.result && answer.result !== "Okay"
              ? "What happened? (required)"
              : "Anything to note? (optional)"}
            <textarea
              value={answer?.note || ""}
              onChange={(e) => record({ note: e.target.value })}
              placeholder="Use plain words. What did you see?"
            />
          </label>
          <div className="form-row">
            <label className="field">
              Reading, if required by the care plan
              <input
                value={answer?.reading || ""}
                placeholder="e.g. displayed temperature + unit"
                onChange={(e) => record({ reading: e.target.value })}
              />
            </label>
            <label className="field">
              <span>
                <Camera size={16} /> Add photo (optional)
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    record({ photo: await uploadFile(file) });
                    notify("Inspection photo saved");
                  } catch (error) {
                    notify((error as Error).message);
                  } finally {
                    setUploading(false);
                  }
                }}
              />
            </label>
          </div>
          {answer?.photo && (
            <MediaLink path={answer.photo}>View attached photograph</MediaLink>
          )}
          <label className="check">
            <input
              type="checkbox"
              checked={answer?.careDone || false}
              onChange={(e) => record({ careDone: e.target.checked })}
            />{" "}
            I completed the simple care already approved for this appliance
          </label>
          <ActionBar
            onBack={() => (index === 0 ? onClose() : setIndex(index - 1))}
            backDisabled={uploading}
          >
            {" "}
            <button
              className="primary big-action"
              disabled={!valid || uploading}
              onClick={() =>
                index + 1 === round.assetIds.length
                  ? setReview(true)
                  : setIndex(index + 1)
              }
            >
              {uploading
                ? "Saving photo…"
                : index + 1 === round.assetIds.length
                  ? "Review & send"
                  : "Save & next appliance"}
              <ArrowRight size={20} />
            </button>
          </ActionBar>
        </>
      )}
    </Panel>
  );
}
function JobDialog({
  task,
  asset,
  role,
  change,
  onClose,
  onAsset,
  notify,
  reschedule,
  onCalendar,
}: {
  task: Task;
  asset?: Asset;
  role: Role;
  change: (id: string, next: Task["status"], extra?: Partial<Task>) => boolean;
  onClose: () => void;
  onAsset: () => void;
  notify: (s: string) => void;
  reschedule: (start: string, end: string) => void;
  onCalendar: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const owns = taskOwner(task) === role;
  return (
    <DialogLayer onClose={onClose}>
      <div className="modal-backdrop">
        <section
          className="modal shared-panel ops-job-dialog"
          role="dialog"
          aria-modal="true"
          aria-label="Job details"
        >
          <div className="panel-title">
            <span className="badge">
              {taskKind(task)} · {stage(task)}
            </span>
            <button
              className="icon-button"
              onClick={onClose}
              aria-label="Close job"
            >
              <X />
            </button>
          </div>
          <h2>{task.title}</h2>
          <p>
            {asset?.area} · {asset?.name}
          </p>
          <div className="job-responsibility">
            <strong>DOING THE WORK: {taskOwner(task)}</strong>
            <span>REVIEWING THE RESULT: Director</span>
            <span>Due: {task.date}</span>
          </div>
          <ol className="job-stages">
            {[
              "Assigned",
              "In progress",
              "Awaiting verification",
              "Verified",
            ].map((s, i) => (
              <li className={task.status === s ? "current" : ""} key={s}>
                {i + 1}.{" "}
                {s === "Assigned"
                  ? "Start"
                  : s === "In progress"
                    ? "Do work"
                    : s === "Awaiting verification"
                      ? "Director review"
                      : "Complete"}
              </li>
            ))}
          </ol>
          {task.notes && (
            <div className="notice">
              <strong>Instructions / reported finding</strong>
              <p>{task.notes}</p>
            </div>
          )}
          {task.returnReason && (
            <div className="notice">
              <strong>Correction requested</strong>
              <p>{task.returnReason}</p>
            </div>
          )}
          {task.repair && (
            <p>
              <strong>Work recorded:</strong> {task.repair}
            </p>
          )}
          {task.evidence && (
            <p>
              <MediaLink path={task.evidence}>
                View evidence photograph
              </MediaLink>
            </p>
          )}
          {task.invoice && (
            <p>
              <MediaLink path={task.invoice}>View invoice</MediaLink>
            </p>
          )}
          <button className="secondary" onClick={onAsset}>
            Equipment details & full history
          </button>
          <button className="secondary" onClick={onCalendar}>
            Export calendar event
          </button>
          {role === "Director" && task.status === "Issue reported" && (
            <ActionBar backLabel="Close" onBack={onClose} backDisabled={busy}>
              <button
                className="primary full"
                onClick={() => change(task.id, "Assigned")}
              >
                Assign specialist work to Subcontractor <ArrowRight size={18} />
              </button>
            </ActionBar>
          )}
          {owns && ["Scheduled", "Assigned"].includes(task.status) && (
            <ActionBar backLabel="Close" onBack={onClose} backDisabled={busy}>
              <button
                className="primary full big-action"
                onClick={() => change(task.id, "In progress")}
              >
                Start{" "}
                {taskKind(task) === "Preventive care"
                  ? "preventive care"
                  : "work"}{" "}
                <ArrowRight size={20} />
              </button>
            </ActionBar>
          )}
          {owns && task.status === "In progress" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                setBusy(true);
                try {
                  const photo = f.get("photo") as File,
                    invoice = f.get("invoice") as File;
                  change(task.id, "Awaiting verification", {
                    repair: String(f.get("notes")),
                    evidence: photo?.size
                      ? await uploadFile(photo)
                      : task.evidence,
                    invoice: invoice?.size
                      ? await uploadFile(invoice)
                      : task.invoice,
                    returnReason: "",
                  });
                } catch (error) {
                  notify((error as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label className="field">
                What did you do?
                <textarea
                  name="notes"
                  required
                  placeholder="Describe the work and the result."
                />
              </label>
              <label className="field">
                Photo of completed work{" "}
                {role === "Subcontractor" ? "(required)" : "(optional)"}
                <input
                  type="file"
                  name="photo"
                  accept="image/jpeg,image/png,image/webp"
                  required={role === "Subcontractor"}
                  capture="environment"
                />
              </label>
              <label className="field">
                Invoice (optional)
                <input
                  name="invoice"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                />
              </label>
              <ActionBar backLabel="Close" onBack={onClose} backDisabled={busy}>
                <button className="primary full big-action" disabled={busy}>
                  {busy ? "Uploading…" : "Send to Director for review"}
                </button>
              </ActionBar>
            </form>
          )}
          {role === "Director" && task.status === "Awaiting verification" && (
            <>
              <ActionBar backLabel="Close" onBack={onClose}>
                <button
                  className="primary full big-action"
                  onClick={() => change(task.id, "Verified")}
                >
                  Approve completed work <Check size={19} />
                </button>
              </ActionBar>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  change(task.id, "Assigned", {
                    returnReason: String(f.get("reason")),
                  });
                }}
              >
                <label className="field">
                  Need a correction?
                  <input
                    name="reason"
                    required
                    placeholder="Explain what must be corrected."
                  />
                </label>
                <button className="secondary full">
                  Return for correction
                </button>
              </form>
            </>
          )}
          {task.status === "Awaiting verification" && role !== "Director" && (
            <div className="notice">
              Sent. The Director will review your work.
            </div>
          )}
          {role === "Director" && task.status !== "Verified" && (
            <details className="reschedule">
              <summary>Change planned dates</summary>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget),
                    start = String(f.get("start")),
                    end = String(f.get("end"));
                  if (start > end) {
                    notify("Finish date must be on or after the start.");
                    return;
                  }
                  reschedule(start, end);
                }}
              >
                <div className="form-row">
                  <label className="field">
                    Start
                    <input
                      name="start"
                      type="date"
                      required
                      defaultValue={task.startDate || task.date}
                    />
                  </label>
                  <label className="field">
                    Finish
                    <input
                      name="end"
                      type="date"
                      required
                      defaultValue={task.date}
                    />
                  </label>
                </div>
                <button className="secondary">Save planned dates</button>
              </form>
            </details>
          )}
        </section>
      </div>
    </DialogLayer>
  );
}
function SpecialistRequest({
  assets,
  onClose,
  onSave,
}: {
  assets: Asset[];
  onClose: () => void;
  onSave: (
    assetId: string,
    kind: "Repair" | "Preventive care",
    title: string,
    notes: string,
    date: string,
  ) => void;
}) {
  return (
    <section className="panel specialist-request">
      <div className="panel-title">
        <h2>Request a subcontractor</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close request"
        >
          <X />
        </button>
      </div>
      <p>
        Tell the Director what you need. This is a request, not an instruction
        to start work.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          onSave(
            String(f.get("asset")),
            String(f.get("kind")) as "Repair" | "Preventive care",
            String(f.get("title")),
            String(f.get("notes")),
            String(f.get("date")),
          );
        }}
      >
        <label className="field">
          Which equipment?
          <select name="asset" required>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.area} · {a.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label className="field">
            What type of help?
            <select name="kind">
              <option>Repair</option>
              <option>Preventive care</option>
            </select>
          </label>
          <label className="field">
            Requested date
            <input name="date" type="date" required defaultValue={dateKey()} />
          </label>
        </div>
        <label className="field">
          Short description
          <input
            name="title"
            required
            placeholder="e.g. Service the refrigerator before summer"
          />
        </label>
        <label className="field">
          What did you notice / what service is needed?
          <textarea name="notes" required />
        </label>
        <ActionBar backLabel="Cancel" onBack={onClose}>
          <button className="primary big-action" disabled={!assets.length}>
            Send request to Director <ArrowRight size={20} />
          </button>
        </ActionBar>
        {!assets.length && (
          <p>
            Equipment must be registered and approved before requesting work.
          </p>
        )}
      </form>
    </section>
  );
}
