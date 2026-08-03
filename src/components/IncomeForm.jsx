export default function IncomeForm({
  incomeForm,
  setIncomeForm,
  addIncome
}) {
  return (
    <section className="card">
      <h2>💰 Revenus</h2>

      <div className="form-grid">
        <label>
          Source
          <input
            value={incomeForm.source}
            onChange={e =>
              setIncomeForm({
                ...incomeForm,
                source: e.target.value
              })
            }
          />
        </label>

        <label>
          Montant
          <input
            type="number"
            value={incomeForm.amount}
            onChange={e =>
              setIncomeForm({
                ...incomeForm,
                amount: e.target.value
              })
            }
          />
        </label>

        <label>
          Personne
          <select
            value={incomeForm.person}
            onChange={e =>
              setIncomeForm({
                ...incomeForm,
                person: e.target.value
              })
            }
          >
            <option>Nelson</option>
            <option>Sofia</option>
          </select>
        </label>

        <label>
          Catégorie
          <select
            value={incomeForm.category}
            onChange={e =>
              setIncomeForm({
                ...incomeForm,
                category: e.target.value
              })
            }
          >
            <option>Salaire</option>
            <option>Prime</option>
            <option>Remboursement</option>
            <option>Autre</option>
          </select>
        </label>

        <label>
          Date
          <input
            type="date"
            value={incomeForm.date}
            onChange={e =>
              setIncomeForm({
                ...incomeForm,
                date: e.target.value
              })
            }
          />
        </label>

        <label className="wide">
          Description
          <input
            value={incomeForm.description}
            onChange={e =>
              setIncomeForm({
                ...incomeForm,
                description: e.target.value
              })
            }
          />
        </label>
      </div>

      <button onClick={addIncome}>
        Ajouter un revenu
      </button>
    </section>
  )
}