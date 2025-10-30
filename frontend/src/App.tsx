import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./store/auth";
import logoUrl from "./assets/logo.svg";
import { useEffect, useState } from "react";
import { api } from "./api/client";

export default function App() {
  const { token, logout } = useAuth();
  const loc = useLocation();
  const isLogin = loc.pathname.startsWith("/login");
  const isSignup = loc.pathname.startsWith("/signup");
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    async function fetchCount() {
      if (!token) { setPendingCount(0); return; }
      try {
        const { data } = await api.get("/requests");
        const incoming = (data?.incoming || []).filter((r: any) => r.status === "PENDING").length;
        setPendingCount(incoming);
      } catch { /* ignore */ }
      timer = setTimeout(fetchCount, 15000);
    }
    fetchCount();
    return () => timer && clearTimeout(timer);
  }, [token]);
  return (
    <div className="container" style={{ fontFamily: "Inter, ui-sans-serif, system-ui" }}>
      <header className="navbar">
        <div className="brand brand-logo">
          <img src={logoUrl} alt="SlotSwapper" />
          <span>SlotSwapper</span>
        </div>
        <nav className="navlinks">
          {token ? (
            <>
              <Link to="/dashboard" style={{ fontWeight: loc.pathname.startsWith("/dashboard") ? 700 : 400 }}>Dashboard</Link>
              <Link to="/marketplace" style={{ fontWeight: loc.pathname.startsWith("/marketplace") ? 700 : 400 }}>Marketplace</Link>
              <Link to="/requests" className="link-with-badge" style={{ fontWeight: loc.pathname.startsWith("/requests") ? 700 : 400 }}>
                <span>Requests</span>
                {pendingCount > 0 && <span className="badge">{pendingCount}</span>}
              </Link>
              <Link to="/profile" style={{ fontWeight: loc.pathname.startsWith("/profile") ? 700 : 400 }}>Profile</Link>
              <button className="btn secondary" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className={isLogin ? "btn" : "btn secondary"}>Login</Link>
              <Link to="/signup" className={isSignup ? "btn" : "btn secondary"}>Sign up</Link>
            </>
          )}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}


