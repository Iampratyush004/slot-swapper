import { FormEvent, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../store/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.token);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (e: any) {
      let msg = "";
      if (e?.response?.data?.error) {
        msg = typeof e.response.data.error === "string"
          ? e.response.data.error
          : JSON.stringify(e.response.data.error);
      } else if (typeof e?.message === "string") {
        msg = e.message;
      } else {
        msg = JSON.stringify(e);
      }
      setError(msg);
    }
  }

  return (
    <div className="grid" style={{ maxWidth: 480, margin: "24px auto" }}>
      <div className="card">
        <h2 className="title">Welcome back</h2>
        <p className="muted" style={{ marginTop: -6, marginBottom: 12 }}>Sign in to continue</p>
        <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }}>
          <div className="field">
            <label className="muted">Email</label>
            <input placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label className="muted">Password</label>
            <input placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn">Sign in</button>
          {error && <div style={{ color: "#ff6464" }}>{error}</div>}
        </form>
        <p className="muted" style={{ marginTop: 12 }}>Don't have an account? <Link to="/signup">Sign up</Link></p>
      </div>
      <div className="hero">
        <div className="muted">Tip: create a second account to try swapping.</div>
      </div>
    </div>
  );
}


