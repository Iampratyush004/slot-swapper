import { useEffect, useState } from "react";
import { api } from "../api/client";

type Event = { id: string; title: string; startTime: string; endTime: string; status: "BUSY"|"SWAPPABLE"|"SWAP_PENDING"; owner: { id: string; name: string; email: string } };

export function Marketplace() {
  const [slots, setSlots] = useState<Event[]>([]);
  const [mySlots, setMySlots] = useState<Event[]>([]);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [chosenMySlotId, setChosenMySlotId] = useState<string>("");

  async function load() {
    const [{ data: swappable }, { data: mine }] = await Promise.all([
      api.get("/swappable-slots"),
      api.get("/events"),
    ]);
    setSlots(swappable);
    setMySlots(mine.filter((e: Event) => e.status === "SWAPPABLE"));
  }

  useEffect(() => { load(); }, []);

  async function sendRequest() {
    if (!requestingId || !chosenMySlotId) return;
    await api.post("/swap-request", { mySlotId: chosenMySlotId, theirSlotId: requestingId });
    setRequestingId(null);
    setChosenMySlotId("");
    await load();
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 className="title">Marketplace</h2>
        <ul className="list">
          {slots.map(slot => (
            <li key={slot.id}>
              <div className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{slot.title}</div>
                    <div className="muted">{new Date(slot.startTime).toLocaleString()} → {new Date(slot.endTime).toLocaleString()} by {slot.owner.name}</div>
                  </div>
                  <button className="btn" onClick={() => setRequestingId(slot.id)} disabled={slot.status !== "SWAPPABLE"}>Request Swap</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {requestingId && (
        <div className="card">
          <h3 className="title">Offer one of your swappable slots</h3>
          <div className="grid" style={{ gap: 8 }}>
            <select className="field" value={chosenMySlotId} onChange={e => setChosenMySlotId(e.target.value)}>
              <option value="">Select your slot</option>
              {mySlots.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} — {new Date(s.startTime).toLocaleString()}
                </option>
              ))}
            </select>
            <div style={{ display: "inline-flex", gap: 8 }}>
              <button className="btn" onClick={sendRequest} disabled={!chosenMySlotId}>Send</button>
              <button className="btn ghost" onClick={() => { setRequestingId(null); setChosenMySlotId(""); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


