import { useState } from 'react'

const money = new Intl.NumberFormat('fr-CA', {
  style: 'currency',
  currency: 'CAD',
})

function getAccountIcon(account) {
  if (account.name === 'Comptant') return '💵'

  if (
    account.name === 'RBC (Chèque)' ||
    account.name === 'RBC (APMD)' ||
    account.name === 'TD (MSNJ)'
  ) {
    return '🏦'
  }

  return '💳'
}

function getAccountType(account) {
  if (account.name === 'Comptant') return 'Argent comptant'
  if (account.name === 'RBC (Chèque)') return 'Compte bancaire'

  if (
    account.name === 'RBC (APMD)' ||
    account.name === 'TD (MSNJ)'
  ) {
    return "Compte d'entreprise"
  }

  return 'Carte de crédit'
}

function getBalanceClass(balance) {
  if (balance < 0) return 'account-balance account-balance--negative'
  if (balance > 0) return 'account-balance account-balance--positive'
  return 'account-balance account-balance--neutral'
}

export default function Accounts({
  accounts = [],
  updateOpeningBalance,
}) {
  const [editingAccountId, setEditingAccountId] = useState(null)
  const [openingBalanceValue, setOpeningBalanceValue] = useState('')
  const [saving, setSaving] = useState(false)

  const assets = accounts
    .filter((account) => Number(account.current_balance ?? 0) > 0)
    .reduce(
      (sum, account) => sum + Number(account.current_balance ?? 0),
      0,
    )

  const liabilities = accounts
    .filter((account) => Number(account.current_balance ?? 0) < 0)
    .reduce(
      (sum, account) =>
        sum + Math.abs(Number(account.current_balance ?? 0)),
      0,
    )

  const netBalance = assets - liabilities

  function startEditing(account) {
    setEditingAccountId(account.id)
    setOpeningBalanceValue(
      String(Number(account.opening_balance ?? 0)),
    )
  }

  function cancelEditing() {
    setEditingAccountId(null)
    setOpeningBalanceValue('')
  }

  async function saveOpeningBalance(accountId) {
    if (!updateOpeningBalance) return

    setSaving(true)

    const success = await updateOpeningBalance(
      accountId,
      openingBalanceValue,
    )

    setSaving(false)

    if (success) {
      cancelEditing()
    }
  }

  return (
    <section className="card accounts-card">
      <div className="accounts-header">
        <div>
          <p className="section-kicker">Vue d’ensemble</p>
          <h2>Comptes</h2>
          <p className="section-description">
            Tes comptes personnels et professionnels au même endroit.
          </p>
        </div>

        <span className="accounts-count">
          {accounts.length} compte{accounts.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="accounts-overview">
        <div className="overview-item">
          <span>Actifs</span>
          <strong className="overview-value overview-value--positive">
            {money.format(assets)}
          </strong>
        </div>

        <div className="overview-item">
          <span>Dettes</span>
          <strong className="overview-value overview-value--negative">
            {money.format(liabilities)}
          </strong>
        </div>

        <div className="overview-item">
          <span>Solde net</span>
          <strong
            className={`overview-value ${
              netBalance < 0
                ? 'overview-value--negative'
                : 'overview-value--positive'
            }`}
          >
            {money.format(netBalance)}
          </strong>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="empty-state">
          <p>Aucun compte enregistré.</p>
        </div>
      ) : (
        <div className="accounts-list">
          {accounts.map((account) => {
            const balance = Number(account.current_balance ?? 0)
            const openingBalance = Number(
              account.opening_balance ?? 0,
            )
            const isEditing = editingAccountId === account.id

            return (
              <article className="account-row" key={account.id}>
                <div className="account-main">
                  <div className="account-icon" aria-hidden="true">
                    {getAccountIcon(account)}
                  </div>

                  <div className="account-details">
                    <strong className="account-name">
                      {account.name}
                    </strong>

                    <span className="account-type">
                      {getAccountType(account)}
                    </span>

                    <span className="account-type">
                      Solde de départ : {money.format(openingBalance)}
                    </span>
                  </div>
                </div>

                <div className="account-summary">
                  <span className="account-balance-label">
                    Solde actuel
                  </span>

                  <strong className={getBalanceClass(balance)}>
                    {money.format(balance)}
                  </strong>

                  {isEditing ? (
                    <div className="form-actions">
                      <input
                        type="number"
                        step="0.01"
                        value={openingBalanceValue}
                        onChange={(event) =>
                          setOpeningBalanceValue(event.target.value)
                        }
                        aria-label={`Nouveau solde de départ pour ${account.name}`}
                      />

                      <button
                        type="button"
                        onClick={() => saveOpeningBalance(account.id)}
                        disabled={saving}
                      >
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>

                      <button
                        type="button"
                        className="secondary"
                        onClick={cancelEditing}
                        disabled={saving}
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => startEditing(account)}
                    >
                      Modifier le solde de départ
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}