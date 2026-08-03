export default function ExpenseForm({
  form,
  setForm,
  addExpense,
  editingId,
  setEditingId,
  setMessage,
  updateMerchant,
  categories,
  today
}) {
  return (
    <article className="card">
      <h2>Ajouter une dépense</h2>

      <div className="form-grid">

        <label>
          Marchand
          <input
            value={form.merchant}
            onChange={(e) => updateMerchant(e.target.value)}
          />
        </label>

        <label>
          Montant
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: e.target.value })
            }
          />
        </label>

        <label>
          Personne
          <select
            value={form.person}
            onChange={(e) =>
              setForm({ ...form, person: e.target.value })
            }
          >
            <option>Nelson</option>
            <option>Sofia</option>
          </select>
        </label>

        <label>
          Paiement
          <select
            value={form.payment}
            onChange={(e) =>
              setForm({ ...form, payment: e.target.value })
            }
          >
            <option>Débit</option>
            <option>Crédit</option>
            <option>Comptant</option>
          </select>
        </label>

        <label>
          Catégorie
          <select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input
            type="date"
            value={form.date}
            onChange={(e) =>
              setForm({ ...form, date: e.target.value })
            }
          />
        </label>

        <label className="wide">
          Description
          <input
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value
              })
            }
          />
        </label>

      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={addExpense}>
          {editingId
            ? "Enregistrer les modifications"
            : "Ajouter"}
        </button>

        {editingId && (
          <button
            className="secondary"
            onClick={() => {
              setEditingId(null)

              setForm({
                merchant: "",
                amount: "",
                person: "Nelson",
                payment: "Débit",
                category: "Logement",
                date: today(),
                description: ""
              })

              setMessage("Modification annulée.")
            }}
          >
            Annuler
          </button>
        )}
      </div>

    </article>
  )
}