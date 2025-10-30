import { useEffect, useMemo, useState } from "react";
import { createMyEvent, deleteMyEvent, getMyEvents, getSwapHistory, updateMyEvent } from "../api/endpoints";

type Event = { id: string; title: string; startTime: string; endTime: string; status: "BUSY"|"SWAPPABLE"|"SWAP_PENDING" };

export function Dashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState("");
  const [startTime, setStart] = useState("");
  const [endTime, setEnd] = useState("");
  const [error, setError] = useState("");
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [swappedIds, setSwappedIds] = useState<Set<string>>(new Set());
  const [acquiredIds, setAcquiredIds] = useState<Set<string>>(new Set());

  async function load() {
    const data = await getMyEvents();
    setEvents(data);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    // load swap history for highlighting swapped events
    (async () => {
      try {
        const data = await getSwapHistory();
        const allSwapped = new Set<string>();
        const acquired = new Set<string>();
        (data || []).forEach((h: any) => {
          if (h.status === "ACCEPTED") {
            if (h.mySlotId) allSwapped.add(h.mySlotId);
            if (h.theirSlotId) allSwapped.add(h.theirSlotId);
            if (h.role === "REQUESTER" && h.theirSlotId) acquired.add(h.theirSlotId);
            if (h.role === "RESPONDER" && h.mySlotId) acquired.add(h.mySlotId);
          }
        });
        setSwappedIds(allSwapped);
        setAcquiredIds(acquired);
      } catch {}
    })();
  }, []);

  function toISO(value: string) {
    // Accept datetime-local value or ISO; fallback to Date parsing
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toISOString();
    } catch {}
    return value; // let backend validation handle if truly invalid
  }

  function friendlyError(e: any): string {
    const status = e?.response?.status;
    const dataErr = e?.response?.data?.error;
    if (dataErr?.fieldErrors) {
      const list = Object.values(dataErr.fieldErrors).flat() as string[];
      if (list.length) return list[0];
    }
    if (typeof dataErr === "string") return dataErr;
    if (status === 403) return "You can only modify your own events.";
    if (status === 404) return "That event no longer exists.";
    if (status === 409) return "Cannot delete this event because it’s part of a swap request. Cancel the request first.";
    if (status === 400 || status === 422) return "Please check your inputs and try again.";
    return e?.message || "Something went wrong. Please try again.";
  }

  // Calendar helpers
  function startOfMonth(d: Date) { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
  function endOfMonth(d: Date) { const x = new Date(d.getFullYear(), d.getMonth()+1, 0); x.setHours(23,59,59,999); return x; }
  function startOfCalendar(d: Date) {
    const s = startOfMonth(d);
    const wd = s.getDay(); // 0 Sun
    const cal = new Date(s); cal.setDate(s.getDate() - wd); return cal;
  }
  function sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  const daysGrid = useMemo(() => {
    const start = startOfCalendar(monthCursor);
    const cells: Date[] = [];
    for (let i=0;i<42;i++) { const d = new Date(start); d.setDate(start.getDate()+i); cells.push(d); }
    return cells;
  }, [monthCursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach(ev => {
      const d = new Date(ev.startTime);
      const key = d.toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    });
    return map;
  }, [events]);

  async function create() {
    setError("");
    if (!title || !startTime || !endTime) { setError("Please fill all fields"); return; }
    try {
      await createMyEvent({ title, startTime: toISO(startTime), endTime: toISO(endTime), status: "BUSY" });
      setTitle(""); setStart(""); setEnd("");
      await load();
    } catch (e: any) {
      setError(friendlyError(e));
    }
  }

  async function toggleSwappable(ev: Event) {
    const next = ev.status === "SWAPPABLE" ? "BUSY" : "SWAPPABLE";
    try {
      await updateMyEvent(ev.id, { status: next });
      await load();
    } catch (e: any) {
      setError(friendlyError(e));
    }
  }

  async function remove(id: string) {
    setError("");
    if (!confirm("Delete this event? This cannot be undone.")) return;
    try {
      await deleteMyEvent(id);
      await load();
    } catch (e: any) {
      setError(friendlyError(e));
    }
  }

  return (
    <div className="grid" style={{ gap: 16, gridTemplateColumns: "minmax(0,1.6fr) minmax(360px,1.4fr)" }}>

      <div className="card" style={{ gridColumn: "1 / 2" }}>
        <h2 className="title">My Events</h2>
        <div className="grid" style={{ gap: 8, maxWidth: 520, marginBottom: 8 }}>
          <div className="field">
            <label className="muted">Title</label>
            <input placeholder="Team Meeting" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="grid cols-2">
            <div className="field">
              <label className="muted">Start</label>
              <input type="datetime-local" value={startTime} onChange={e => setStart(e.target.value)} />
            </div>
            <div className="field">
              <label className="muted">End</label>
              <input type="datetime-local" value={endTime} onChange={e => setEnd(e.target.value)} />
            </div>
          </div>
          <button className="btn" onClick={create}>Create</button>
          {error && <div style={{ color: "#ff6464" }}>{error}</div>}
        </div>
        <ul className="list">
          {events.map(ev => (
            <li key={ev.id}>
              <div className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{ev.title}</div>
                    <div className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{new Date(ev.startTime).toLocaleString()} → {new Date(ev.endTime).toLocaleString()}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}>
                    {ev.status !== "SWAP_PENDING" && (
                      <button type="button" className="btn secondary" onClick={() => toggleSwappable(ev)} style={{ padding: "6px 10px", fontSize: 12 }}>
                        {ev.status === "SWAPPABLE" ? "Make Busy" : "Make Swappable"}
                      </button>
                    )}
                    <button type="button" className="btn ghost" onClick={() => remove(ev.id)} disabled={ev.status === "SWAP_PENDING"} style={{ padding: "6px 10px", fontSize: 12 }}>Delete</button>
                  </div>
                </div>
                <div className="muted" style={{ marginTop: 6 }}>
                  Status: {ev.status}{swappedIds.has(ev.id) ? " • swapped" : ""}{acquiredIds.has(ev.id) ? " • acquired" : " • original"}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="card" style={{ gridColumn: "2 / 3", height: "fit-content" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="title" style={{ marginBottom: 12 }}>Calendar</h2>
          <div style={{ display: "inline-flex", gap: 8 }}>
            <button className="btn ghost" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth()-1, 1))}>{"<"} Prev</button>
            <button className="btn ghost" onClick={() => setMonthCursor(new Date())}>Today</button>
            <button className="btn ghost" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth()+1, 1))}>Next {">"}</button>
          </div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="muted" style={{ textAlign: "center" }}>{d}</div>)}
          {daysGrid.map((d, idx) => {
            const inMonth = d.getMonth() === monthCursor.getMonth();
            const key = d.toDateString();
            const todays = eventsByDay.get(key) || [];
            const hasSwap = todays.some(ev => swappedIds.has(ev.id));
            const isSelected = selectedDay && sameDay(d, selectedDay);
            return (
              <button key={idx} className="card" onClick={() => setSelectedDay(new Date(d))} style={{
                padding: 6, textAlign: "center", opacity: inMonth ? 1 : 0.35, border: isSelected ? "2px solid #5b8aff" : "1px solid rgba(255,255,255,.08)", minHeight: 64
              }}>
                <div style={{ fontWeight: 800, color: hasSwap ? "#64ffda" : "#a8b3ff", fontSize: 14 }}>{d.getDate()}</div>
                {todays.length > 0 && (
                  <div className="muted" style={{ fontSize: 10 }}>{todays.length} event{todays.length>1?"s":""}</div>
                )}
                {hasSwap && <div style={{ marginTop: 4, height: 4, background: "linear-gradient(90deg,#64ffda,#5b8aff)", borderRadius: 6 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="card" style={{ gridColumn: "1 / 2" }}>
          <h2 className="title">Events on {selectedDay.toDateString()}</h2>
          <ul className="list">
            {events
              .filter(ev => sameDay(new Date(ev.startTime), selectedDay))
              .map(ev => (
                <li key={ev.id}>
                  <div className="card" style={{ padding: 10, borderColor: swappedIds.has(ev.id) ? "#64ffda" : undefined }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{ev.title} {swappedIds.has(ev.id) && <span className="muted">(swapped)</span>} {acquiredIds.has(ev.id) ? <span className="muted">(acquired)</span> : <span className="muted">(original)</span>}</div>
                        <div className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>{new Date(ev.startTime).toLocaleTimeString()} → {new Date(ev.endTime).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            {events.filter(ev => sameDay(new Date(ev.startTime), selectedDay)).length === 0 && (
              <li className="muted">No events</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}


