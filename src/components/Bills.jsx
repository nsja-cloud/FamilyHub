import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'

const categories = [
  'Logement',
  'Services publics',
  'Télécommunications',
  'Assurances',
  'Transport',
  'Carte de crédit',
  'Animaux',
  'Santé et soins',
  'Entreprise',
  'Abonnements',
  'Divers',
]

const frequencies = [
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'biweekly', label: 'Aux deux semaines' },
  { value: 'monthly', label: 'Mensuelle' },
  { value: 'quarterly', label: 'Trimestrielle' },
  { value: 'yearly', label: 'Annuelle' },
]

const paymentMethods = [
  'Débit préautorisé',
  'Virement',
  'Carte de crédit',
  'Paiement manuel',
  'Autre',
]

const money = new Intl.NumberFormat('fr-CA', {
  style: 'currency',
  currency: 'CAD',
})

const emptyForm = {
  name: '',
  amount: '',
  due_day: '',
  frequency: 'monthly',
  category: 'Logement',
  account_id: '',
  payment_method: 'Débit préautorisé',
  autopay: false,
  active: true,
  notes: '',
}

export default function Bills() {
  const [session, setSession] = useState(null)
  const [bills, setBills] = useState([])
  const [accounts, setAccounts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let mounted = true

    async function initialize() {
      const { data, error } = await supabase.auth.getSession()

      if (!mounted) return

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      const currentSession = data.session
      setSession(currentSession)

      if (!currentSession) {
        setMessage('Session introuvable. Reconnecte-toi à FamilyHub.')
        setLoading(false)
        return
      }

      await Promise.all([
        loadBills(currentSession.user.id),
        loadAccounts(currentSession.user.id),
      ])

      if (mounted) {
        setLoading(false)
      }
    }

    initialize()

    return () => {
      mounted = false
    }
  }, [])

  async function loadBills(userId = session?.user?.id) {
    if (!userId) return

    const { data, error } = await supabase
      .from('bills')
      .select(`
        *,
        accounts (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .order('due_day', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      setMessage(error.message)
      return
    }

    setBills(data || [])
  }

  async function loadAccounts(userId = session?.user?.id) {
    if (!userId) return

    const { data, error } = await supabase
      .from('accounts')
      .select('id, name, type')
      .eq('user_id', userId)
      .order('display_order', { ascending: true })

    if (error) {
      setMessage(error.message)
      return
    }

    setAccounts(data || [])
  }

  const activeBills = useMemo(
    () => bills.filter((bill) => bill.active),
    [bills],
  )

  const monthlyTotal = useMemo(
    () =>
      activeBills.reduce((sum, bill) => {
        const amount = Number(bill.amount) || 0

        switch (bill.frequency) {
          case 'weekly':
            return sum + amount * 52 / 12
          case 'biweekly':
            return sum + amount * 26 / 12
          case 'quarterly':
            return sum + amount / 3
          case 'yearly':
            return sum + amount / 12
          default:
            return sum + amount
        }
      }, 0),
    [activeBills],
  )

  const filteredBills = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    if (!normalizedSearch) return bills

    return bills.filter((bill) => {
      const accountName = bill.accounts?.name || ''

      return [
        bill.name,
        bill.category,
        bill.payment_method,
        accountName,
        bill.notes,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    })
  }, [bills, search])

  function updateField(field, value) {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: value,
    }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setMessage('')
  }

  function startEditing(bill) {
    setEditingId(bill.id)
    setForm({
      name: bill.name || '',
      amount: bill.amount ?? '',
      due_day: bill.due_day ?? '',
      frequency: bill.frequency || 'monthly',
      category: bill.category || 'Logement',
      account_id: bill.account_id || '',
      payment_method: bill.payment_method || 'Débit préautorisé',
      autopay: Boolean(bill.autopay),
      active: Boolean(bill.active),
      notes: bill.notes || '',
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function saveBill(event) {
    event.preventDefault()

    if (!session?.user?.id) {
      setMessage('Session introuvable.')
      return
    }

    const amount = Number(form.amount)
    const dueDay = Number(form.due_day)

    if (!form.name.trim()) {
      setMessage('Entre le nom de la facture.')
      return
    }

    if (!Number.isFinite(amount) || amount < 0) {
      setMessage('Entre un montant valide.')
      return
    }

    if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
      setMessage('Le jour d’échéance doit être entre 1 et 31.')
      return
    }

    const row = {
      user_id: session.user.id,
      name: form.name.trim(),
      amount,
      due_day: dueDay,
      frequency: form.frequency,
      category: form.category,
      account_id: form.account_id || null,
      payment_method: form.payment_method,
      autopay: form.autopay,
      active: form.active,
      notes: form.notes.trim(),
      updated_at: new Date().toISOString(),
    }

    setSaving(true)
    setMessage('')

    let error

    if (editingId) {
      const result = await supabase
        .from('bills')
        .update(row)
        .eq('id', editingId)
        .eq('user_id', session.user.id)

      error = result.error
    } else {
      const result = await supabase
        .from('bills')
        .insert(row)

      error = result.error
    }

    setSaving(false)

    if (error) {
      setMessage(error.message)
      return
    }

    await loadBills()
    resetForm()
    setMessage(editingId ? 'Facture modifiée.' : 'Facture ajoutée.')
  }

  async function removeBill(id) {
    const confirmed = window.confirm(
      'Veux-tu vraiment supprimer cette facture?',
    )

    if (!confirmed) return

    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)

    if (error) {
      setMessage(error.message)
      return
    }

    setBills((previousBills) =>
      previousBills.filter((bill) => bill.id !== id),
    )

    if (editingId === id) {
      resetForm()
    }

    setMessage('Facture supprimée.')
  }

  if (loading) {
    return (
      <section className="card">
        <p>Chargement des factures...</p>
      </section>
    )
  }

  return (
    <section className="bills-page">
      <section className="card">
        <div className="history-heading">
          <div>
            <p className="section-kicker">Coûts fixes</p>
            <h2>{editingId ? 'Modifier la facture' : 'Ajouter une facture'}</h2>
            <p className="section-description">
              Enregistre les paiements récurrents qui reviennent chaque mois.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              className="secondary"
              onClick={resetForm}
            >
              Annuler la modification
            </button>
          )}
        </div>

        <form onSubmit={saveBill} className="form-grid">
          <label>
            Nom
            <input
              type="text"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Ex. Hydro-Québec"
              required
            />
          </label>

          <label>
            Montant
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) => updateField('amount', event.target.value)}
              placeholder="0,00"
              required
            />
          </label>

          <label>
            Jour d’échéance
            <input
              type="number"
              min="1"
              max="31"
              step="1"
              value={form.due_day}
              onChange={(event) => updateField('due_day', event.target.value)}
              placeholder="1 à 31"
              required
            />
          </label>

          <label>
            Fréquence
            <select
              value={form.frequency}
              onChange={(event) =>
                updateField('frequency', event.target.value)
              }
            >
              {frequencies.map((frequency) => (
                <option key={frequency.value} value={frequency.value}>
                  {frequency.label}
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
            Compte
            <select
              value={form.account_id}
              onChange={(event) =>
                updateField('account_id', event.target.value)
              }
            >
              <option value="">Aucun compte sélectionné</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Mode de paiement
            <select
              value={form.payment_method}
              onChange={(event) =>
                updateField('payment_method', event.target.value)
              }
            >
              {paymentMethods.map((paymentMethod) => (
                <option key={paymentMethod} value={paymentMethod}>
                  {paymentMethod}
                </option>
              ))}
            </select>
          </label>

          <label className="full-width">
            Notes
            <textarea
              rows="3"
              value={form.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              placeholder="Information facultative"
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.autopay}
              onChange={(event) =>
                updateField('autopay', event.target.checked)
              }
            />
            Paiement automatique
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                updateField('active', event.target.checked)
              }
            />
            Facture active
          </label>

          <div className="form-actions full-width">
            <button type="submit" disabled={saving}>
              {saving
                ? 'Enregistrement...'
                : editingId
                  ? 'Enregistrer les modifications'
                  : 'Ajouter la facture'}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="kpis">
        <article className="metric">
          <span>Total mensuel estimé</span>
          <strong>{money.format(monthlyTotal)}</strong>
        </article>

        <article className="metric">
          <span>Factures actives</span>
          <strong>{activeBills.length}</strong>
        </article>

        <article className="metric">
          <span>Paiements automatiques</span>
          <strong>{activeBills.filter((bill) => bill.autopay).length}</strong>
        </article>
      </section>

      <section className="card">
        <div className="history-heading">
          <div>
            <p className="section-kicker">Calendrier mensuel</p>
            <h2>Factures enregistrées</h2>
            <p className="section-description">
              Les factures sont classées selon leur jour d’échéance.
            </p>
          </div>

          <span className="history-count">
            {bills.length} facture{bills.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="history-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="text"
            placeholder="Rechercher une facture..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {filteredBills.length === 0 ? (
          <div className="empty-state">
            <h3>Aucune facture enregistrée</h3>
            <p>
              Ajoute ta première facture pour commencer à calculer tes coûts
              fixes mensuels.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Jour</th>
                  <th>Facture</th>
                  <th>Catégorie</th>
                  <th>Compte</th>
                  <th>Fréquence</th>
                  <th>AutoPay</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredBills.map((bill) => {
                  const frequencyLabel =
                    frequencies.find(
                      (frequency) => frequency.value === bill.frequency,
                    )?.label || bill.frequency

                  return (
                    <tr key={bill.id}>
                      <td>{bill.due_day}</td>
                      <td>{bill.name}</td>
                      <td>{bill.category || '—'}</td>
                      <td>{bill.accounts?.name || '—'}</td>
                      <td>{frequencyLabel}</td>
                      <td>{bill.autopay ? 'Oui' : 'Non'}</td>
                      <td>{money.format(Number(bill.amount) || 0)}</td>
                      <td>{bill.active ? 'Active' : 'Inactive'}</td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => startEditing(bill)}
                        >
                          Modifier
                        </button>

                        <button
                          type="button"
                          className="danger"
                          onClick={() => removeBill(bill.id)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {message && <p className="message">{message}</p>}
    </section>
  )
}