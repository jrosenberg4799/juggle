"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Asset, Task } from "@/lib/model";
import {
  addDays,
  dateKey,
  dayDistance,
  stage,
  taskKind,
  taskOwner,
} from "@/lib/operations";
export function Gantt({
  tasks,
  assets,
  onSelect,
}: {
  tasks: Task[];
  assets: Asset[];
  onSelect: (id: string) => void;
}) {
  const [start, setStart] = useState(() => addDays(dateKey(), -2));
  const days = Array.from({ length: 14 }, (_, i) => addDays(start, i));
  const end = days[13];
  const rows = tasks
    .filter((t) => (t.startDate || t.date) <= end && t.date >= start)
    .sort((a, b) =>
      (a.startDate || a.date).localeCompare(b.startDate || b.date),
    );
  return (
    <section className="ops-gantt panel">
      <div className="gantt-heading">
        <div>
          <h2>Work schedule</h2>
          <p>Each bar shows the planned start → finish. Select a job to act.</p>
        </div>
        <div className="gantt-controls">
          <button
            className="secondary"
            aria-label="Previous two weeks"
            onClick={() => setStart(addDays(start, -14))}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="secondary"
            onClick={() => setStart(addDays(dateKey(), -2))}
          >
            Today
          </button>
          <button
            className="secondary"
            aria-label="Next two weeks"
            onClick={() => setStart(addDays(start, 14))}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="gantt-range">
        {new Date(start + "T12:00").toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })}{" "}
        –{" "}
        {new Date(end + "T12:00").toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </div>
      <div
        className="gantt-scroll"
        role="region"
        aria-label="Fourteen-day Gantt schedule"
        tabIndex={0}
      >
        <div className="gantt-grid">
          <div className="gantt-label gantt-head">JOB / PERSON RESPONSIBLE</div>
          <div className="gantt-days">
            {days.map((day) => (
              <div key={day} className={day === dateKey() ? "today" : ""}>
                <small>
                  {new Date(day + "T12:00").toLocaleDateString(undefined, {
                    weekday: "short",
                  })}
                </small>
                <strong>{day.slice(8)}</strong>
              </div>
            ))}
          </div>
          {rows.map((task) => {
            const left = Math.max(
              0,
              dayDistance(start, task.startDate || task.date),
            );
            const right = Math.min(13, dayDistance(start, task.date));
            const asset = assets.find((a) => a.id === task.assetId);
            return (
              <div className="gantt-row" key={task.id}>
                <button
                  className="gantt-label"
                  onClick={() => onSelect(task.id)}
                >
                  <strong>{task.title}</strong>
                  <span>
                    {asset?.name || "Equipment"} · {taskOwner(task)}
                  </span>
                  <small>{stage(task)}</small>
                </button>
                <div className="gantt-track">
                  {days.map((day) => (
                    <span
                      className={day === dateKey() ? "today" : ""}
                      key={day}
                    />
                  ))}
                  <button
                    className={
                      "gantt-bar " +
                      (task.status === "Verified"
                        ? "complete"
                        : task.status === "Issue reported"
                          ? "issue"
                          : taskKind(task) === "Preventive care"
                            ? "preventive"
                            : "")
                    }
                    style={{
                      left: `${(left / 14) * 100}%`,
                      width: `${((right - left + 1) / 14) * 100}%`,
                    }}
                    onClick={() => onSelect(task.id)}
                    aria-label={`${task.title}, ${taskOwner(task)}, ${task.startDate || task.date} to ${task.date}, ${stage(task)}`}
                  >
                    <span>{taskKind(task)}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {!rows.length && (
        <div className="empty">
          <CalendarDays size={26} />
          <p>No jobs in this date range. Change weeks or schedule work.</p>
        </div>
      )}
      <div className="gantt-legend">
        <span>
          <i /> Inspection / repair
        </span>
        <span>
          <i className="preventive" /> Preventive care
        </span>
        <span>
          <i className="issue" /> Needs decision
        </span>
        <span>
          <i className="complete" /> Complete
        </span>
      </div>
    </section>
  );
}
