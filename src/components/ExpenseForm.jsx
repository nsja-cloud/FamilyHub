export default function ExpenseForm({
  form,
  setForm,
  addExpense,
  editingId,
  setEditingId,
  setMessage,
  updateMerchant,
  categories,
  today,
  accounts,
  currentPerson,
}) {
  function updateField(field, value) {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: value,
    }))
  }

  function cancelEditing() {
    setEditingId(null)

    setForm({
      merchant: '',
      amount: '',
      person: currentPerson,
      payment: 'Débit',
      account: '',
      category: 'Logement',
      date: today(),
      description: '',
    })

    setMessage('Modification annulée.')
  }

  return (
    <article className="card expense-form-card">
      <div className="form-heading">
        <div>
          <p className="section-kicker">
            {editingId ? 'Modification' : 'Nouvelle'}
          </p>

          <h2>
            💸 {editingId ? 'Modifier la dépense' : 'Ajouter une dépense'}
          </h2>

          <p className="section-description">
            Entre les détails de la transaction et le compte utilisé.
          </p>
        </div>
      </div>

      <div className="expense-form-grid">
        <label>
          Marchand
          <input
            type="text"
            value={form.merchant}
            onChange={(event) =>
              updateMerchant(event.target.value)
            }
          />
        </label>

        <label>
          Montant
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) =>
              updateField('amount', event.target.value)
            }
            placeholder="0,00"
          />
        </label>

        <label>
          Personne
          <select
            value={form.person}
            onChange={(event) =>
              updateField('person', event.target.value)
            }
          >
            <option value="Nelson">Nelson</option>
            <option value="Sofia">Sofia</option>
          </select>
        </label>

        <label>
          Compte utilisé
          <select
            value={form.account}
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
            value={form.category}
            onChange={(event) =>
              updateField('category', event.target.value)
            }
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input
            type="date"
            value={form.date}
            onChange={(event) =>
              updateField('date', event.target.value)
            }
          />
        </label>

        <label className="expense-description">
          Description
          <input
            type="text"
            value={form.description}
            onChange={(event) =>
              updateField('description', event.target.value)
            }
            placeholder="Description facultative"
          />
        </label>
      </div>

      <div className="form-actions">
        <button type="button" onClick={addExpense}>
          {editingId
            ? 'Enregistrer les modifications'
            : 'Ajouter la dépense'}
        </button>

        {editingId && (
          <button
            type="button"
            className="secondary"
            onClick={cancelEditing}
          >
            Annuler
          </button>
        )}
      </div>
    </article>
  )
}