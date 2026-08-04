export default function Metric({ label, value }) {
  return (
    <article className="metric-card">
      <span className="metric-label">{label}</span>
      <strong className="metric-value">{value}</strong>
    </article>
  )
}