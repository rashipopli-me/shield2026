import { Link, useLocation } from "react-router-dom";
import "./NavBar.css";

const LINKS = [
  { to: "/verify", label: "Verify" },
  { to: "/my-ticket", label: "My ticket" },
  { to: "/scan", label: "Scan" },
];

export default function NavBar() {
  const { pathname } = useLocation();

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand">
          <span className="navbar__mark">🛡</span> SHIELD 2026
        </Link>
        <nav className="navbar__links">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={pathname === l.to ? "is-active" : ""}>
              {l.label}
            </Link>
          ))}
          <Link to="/admin" className="navbar__admin">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
