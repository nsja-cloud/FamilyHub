export default function IncomeForm({
  incomeForm,
  setIncomeForm,
  addIncome,
  editingIncomeId,
  setEditingIncomeId,
  today,
  accounts,
}) {
  function updateField(field, value) {
    setIncomeForm((previousForm) => ({
      ...previousForm,
      [field]: value,
    }))
  }

  function cancelEditing() {
    setEditingIncomeId(null)

    setIncomeForm({
      source: '',
      amount: '',
      person: 'Nelson',
      account: '',
      category: 'Salaire',
      date: today(),
      description: '',
    })
  }

  return (
    <section className="card income-form-card">
      <div className="form-heading">
        <div>
          <p className="section-kicker">
            {editingIncomeId ? 'Modification' : 'Nouveau'}
          </p>

          <h2>
            💰 {editingIncomeId ? 'Modifier le revenu' : 'Ajouter un revenu'}
          </h2>
        </div>
      </div>

      <div className="income-form-grid">
        <label>
          Source
          <input
            type="text"
            value={incomeForm.source}
            onChange={(event) =>
              updateField('source', event.target.value)
            }
          />
        </label>

        <label>
          Montant
          <input
            type="number"
            min="0"
            step="0.01"
            value={incomeForm.amount}
            onChange={(event) =>
              updateField('amount', event.target.value)
            }
            placeholder="0,00"
          />
        </label>

        <label>
          Personne
          <select
            value={incomeForm.person}
            onChange={(event) =>
              updateField('person', event.target.value)
            }
          >
            <option value="Nelson">Nelson</option>
            <option value="Sofia">Sofia</option>
          </select>
        </label>

        <label>
          Compte de destination
          <select
            value={incomeForm.account}
            onChange={(event) =>
              updateField('account', event.target.value)
            }
          >
            <option value="">Sélectionner un compte</option>

            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Catégorie
          <select
            value={incomeForm.category}
            onChange={(event) =>
              updateField('category', event.target.value)
            }
          >
            <option value="Salaire">Salaire</option>
            <option value="Entreprise">Entreprise</option>
            <option value="Allocation">Allocation</option>
            <option value="Remboursement">Remboursement</option>
            <option value="Autre">Autre</option>
          </select>
        </label>

        <label>
          Date
          <input
            type="date"
            value={incomeForm.date}
            onChange={(event) =>
              updateField('date', event.target.value)
            }
          />
        </label>

        <label>
          Description
          <input
            type="text"
            value={incomeForm.description}
            onChange={(event) =>
              updateField('description', event.target.value)
            }
            placeholder="Description facultative"
          />
        </label>
      </div>

      <div className="form-actions">
        <button type="button" onClick={addIncome}>
          {editingIncomeId
            ? 'Enregistrer les modifications'
            : 'Ajouter un revenu'}
        </button>

        {editingIncomeId && (
          <button
            type="button"
            className="secondary"
            onClick={cancelEditing}
          >
            Annuler
          </button>
        )}
      </div>
    </section>
  )
}