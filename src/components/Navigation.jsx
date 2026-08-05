import { NavLink } from 'react-router'

export default function Navigation() {
  const linkClassName = ({ isActive }) =>
    isActive ? 'nav-link nav-link-active' : 'nav-link'

  return (
    <nav className="app-navigation" aria-label="Navigation principale">
      <NavLink to="/" end className={linkClassName}>
        🏠 Tableau de bord
      </NavLink>

      <NavLink to="/bills" className={linkClassName}>
        📅 Factures
      </NavLink>
    </nav>
  )
}