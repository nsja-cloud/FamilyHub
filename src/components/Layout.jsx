import Navigation from "./Navigation"

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <Navigation />

      <main className="app-content">
        {children}
      </main>
    </div>
  )
}