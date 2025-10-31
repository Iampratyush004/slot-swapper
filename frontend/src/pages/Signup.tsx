import { FormEvent, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../store/auth";
import { Link, useNavigate } from "react-router-dom";

export function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/signup", { name, email, password });
      login(data.token);
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      let msg = "";
      // Prefer backend's structured error (for zod/validation errors)
      const err = e?.response?.data?.error;
      if (err) {
        if (err.fieldErrors) {
          const allFields = Object.values(err.fieldErrors).flat();
          
          if (allFields.length > 0) msg = String(allFields[0]);
        }
        if (!msg && Array.isArray(err.formErrors) && err.formErrors.length > 0) {
          msg = err.formErrors[0];
        }
        if (!msg && typeof err === "string") {
          msg = err;
        }
      }
      if (!msg && typeof e?.message === "string") {
        msg = e.message;
      }
      if (!msg) {
        msg = JSON.stringify(e);
      }
      setError(msg);
    }
  }

  return (
    <div className="grid" style={{ maxWidth: 480, margin: "24px auto" }}>
      <div className="card">
        <h2 className="title">Create your account</h2>
        <p className="muted" style={{ marginTop: -6, marginBottom: 12 }}>It takes less than a minute</p>
        <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }}>
          <div className="field">
            <label className="muted">Name</label>
            <input placeholder="Jane Doe" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="field">
            <label className="muted">Email</label>
            <input placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label className="muted">Password</label>
            <input placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn">Create account</button>
          {error && <div style={{ color: "#ff6464" }}>{error}</div>}
        </form>
        <p className="muted" style={{ marginTop: 12 }}>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}


