import { useEffect, useState } from "react";
import { api } from "../api/client";

type Me = { id: string; name: string; email: string };

export function Profile() {
  const [me, setMe] = useState<Me | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const { data } = await api.get("/auth/me");
    setMe(data); setName(data.name);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setMsg("");
    try {
      await api.put("/auth/me", { name, password: password || undefined });
      setPassword("");
      await load();
      setMsg("Profile updated");
    } catch (e: any) {
      const err = e?.response?.data?.error;
      setMsg(typeof err === "string" ? err : (err?.message || e?.message || "Update failed"));
    }
  }

  if (!me) return <div className="card"><div className="muted">Loading…</div></div>;

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="card">
        <h2 className="title">My Profile</h2>
        <div className="grid" style={{ maxWidth: 480, gap: 12 }}>
          <div className="field">
            <label className="muted">Email</label>
            <input value={me.email} disabled />
          </div>
          <div className="field">
            <label className="muted">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="muted">New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Leave blank to keep current" />
          </div>
          <button className="btn" onClick={save}>Save</button>
          {msg && <div className="muted">{msg}</div>}
        </div>
      </div>
    </div>
  );
}




