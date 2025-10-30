import { useEffect, useState } from "react";
import { cancelSwapRequest, getRequests, getSwapHistory, postSwapResponse } from "../api/endpoints";

type Event = { id: string; title: string; startTime: string; endTime: string };
type Swap = { id: string; status: "PENDING"|"ACCEPTED"|"REJECTED"; mySlot: Event; theirSlot: Event };
type History = { id: string; status: "ACCEPTED"|"REJECTED"|"CANCELLED"; mySlotTitle: string; theirSlotTitle: string; decidedAt?: string; counterparty?: { id: string; name: string; email: string } | null; role?: "REQUESTER"|"RESPONDER" };

export function Requests() {
  const [incoming, setIncoming] = useState<Swap[]>([]);
  const [outgoing, setOutgoing] = useState<Swap[]>([]);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<History[]>([]);

  async function load() {
    const [reqs, hist] = await Promise.all([
      getRequests(),
      getSwapHistory(),
    ]);
    // Show only pending items in current tabs
    const incomingAll = reqs.incoming || [];
    const outgoingAll = reqs.outgoing || [];
    setIncoming(incomingAll.filter((r: any) => r.status === "PENDING"));
    setOutgoing(outgoingAll.filter((r: any) => r.status === "PENDING"));

    // History from audit + backfill from any previously accepted/rejected requests
    const backfillAccepted = [...incomingAll, ...outgoingAll]
      .filter((r: any) => r.status === "ACCEPTED" || r.status === "REJECTED")
      .map((r: any) => ({
        id: r.id,
        status: r.status,
        mySlotTitle: r.mySlot?.title ?? "your slot",
        theirSlotTitle: r.theirSlot?.title ?? "their slot",
        decidedAt: undefined as string | undefined,
        counterparty: undefined,
      }));

    const detailed = (hist || []).filter((h: any) => !!h.decidedAt && !!h.counterparty);
    setHistory(detailed);
  }

  useEffect(() => { load(); }, []);

  async function respond(id: string, accept: boolean) {
    setError("");
    try {
      if (accept === false) {
        // If rejecting an incoming request -> swap-response false
        // If cancelling an outgoing request -> call cancel endpoint
        const inIncoming = incoming.some(x => x.id === id);
        if (inIncoming) {
          await postSwapResponse(id, false);
        } else {
          await cancelSwapRequest(id);
        }
      } else {
        await postSwapResponse(id, true);
      }
      await load();
    } catch (e: any) {
      const err = e?.response?.data?.error;
      setError(typeof err === "string" ? err : (err?.message || e?.message || "Failed to update request"));
    }
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      {error && <div className="card" style={{ color: "#ff6464" }}>{error}</div>}
      <section className="card">
        <h2 className="title">Incoming Requests</h2>
        {incoming.length === 0 && <p className="muted">None</p>}
        <ul className="list">
          {incoming.map(r => (
            <li key={r.id}>
              <div className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    They offer <strong>{r.mySlot.title}</strong> for your <strong>{r.theirSlot.title}</strong>
                    <div className="muted">Status: {r.status}</div>
                  </div>
                  {r.status === "PENDING" && (
                    <div style={{ display: "inline-flex", gap: 8 }}>
                      <button className="btn" onClick={() => respond(r.id, true)}>Accept</button>
                      <button className="btn ghost" onClick={() => respond(r.id, false)}>Reject</button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="title">Outgoing Requests</h2>
        {outgoing.length === 0 && <p className="muted">None</p>}
        <ul className="list">
          {outgoing.map(r => (
            <li key={r.id}>
              <div className="card" style={{ padding: 12 }}>
                You offered <strong>{r.mySlot.title}</strong> for <strong>{r.theirSlot.title}</strong>
                <div className="muted">Status: {r.status}</div>
                {r.status === "PENDING" && (
                  <div style={{ marginTop: 6 }}>
                    <button className="btn ghost" onClick={() => respond(r.id, false)} title="Cancel this pending request">Cancel</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="title">History</h2>
        {history.length === 0 && <p className="muted">No past swaps yet</p>}
        <ul className="list">
          {history.map(h => (
            <li key={h.id}>
              <div className="card" style={{ padding: 12 }}>
                <div>
                  {h.status === "ACCEPTED" && (
                    h.role === "REQUESTER"
                      ? <>Swapped <strong>{h.mySlotTitle}</strong> for <strong>{h.theirSlotTitle}</strong></>
                      : <>Swapped <strong>{h.theirSlotTitle}</strong> for <strong>{h.mySlotTitle}</strong></>
                  )}
                  {h.status === "REJECTED" && (
                    h.role === "REQUESTER"
                      ? <>Rejected swap: <strong>{h.mySlotTitle}</strong> for <strong>{h.theirSlotTitle}</strong></>
                      : <>Rejected swap: <strong>{h.theirSlotTitle}</strong> for <strong>{h.mySlotTitle}</strong></>
                  )}
                  {h.status === "CANCELLED" && (
                    h.role === "REQUESTER"
                      ? <>Cancelled swap request: <strong>{h.mySlotTitle}</strong> for <strong>{h.theirSlotTitle}</strong></>
                      : <>Their swap request was cancelled: <strong>{h.theirSlotTitle}</strong> for <strong>{h.mySlotTitle}</strong></>
                  )}
                </div>
                <div className="muted">
                  {h.decidedAt ? new Date(h.decidedAt).toLocaleString() : "Time unknown"}
                  {" • "}
                  {(h.counterparty?.name || h.counterparty?.email) ? `with ${h.counterparty?.name || h.counterparty?.email}` : "counterparty unknown"}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}


