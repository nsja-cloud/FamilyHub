import { useEffect, useMemo, useState } from 'react'
import Metric from './components/Metric'
import IncomeForm from './components/IncomeForm'
import ExpenseForm from './components/ExpenseForm'
import Accounts from './components/Accounts'
import { supabase } from './supabase'

const categories = [
  'Logement',
  'Épicerie',
  'Restaurants',
  'Transport',
  'Enfants',
  'Maison',
  'Vêtements',
  'Animaux',
  'Santé et soins',
  'Cadeaux',
  'Loisirs',
  'Entreprise',
  'Épargne',
  'Divers',
]

const merchantRules = {
  iga: 'Épicerie',
  costco: 'Épicerie',
  maxi: 'Épicerie',
  starbucks: 'Restaurants',
  domino: 'Restaurants',
  mondou: 'Animaux',
  dulux: 'Maison',
  winners: 'Maison',
  marketplace: 'Maison',
  cinestarz: 'Loisirs',
  gaz: 'Transport',
  esso: 'Transport',
  shell: 'Transport',
}

const money = new Intl.NumberFormat('fr-CA', {
  style: 'currency',
  currency: 'CAD',
})

const currentMonth = () => new Date().toISOString().slice(0, 7)
const today = () => new Date().toISOString().slice(0, 10)

function formatMonthLabel(value) {
  const [year, monthNumber] = value.split('-').map(Number)

  const formatted = new Intl.DateTimeFormat('fr-CA', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, monthNumber - 1, 1))

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

export default function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [expenses, setExpenses] = useState([])
  const [income, setIncome] = useState([])
  const [accounts, setAccounts] = useState([])
  const [month, setMonth] = useState(currentMonth())
  const [budget, setBudget] = useState(0)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [incomeSearch, setIncomeSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingIncomeId, setEditingIncomeId] = useState(null)

  const [incomeForm, setIncomeForm] = useState({
    source: '',
    amount: '',
    person: 'Nelson',
    account: '',
    category: 'Salaire',
    date: today(),
    description: '',
  })

  const [form, setForm] = useState({
    merchant: '',
    amount: '',
    person: 'Nelson',
    payment: 'Débit',
    account: '',
    category: 'Logement',
    date: today(),
    description: '',
  })

  useEffect(() => {
    if (!supabase) return

    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)
      },
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session || !supabase) return

    loadExpenses()
    loadIncome()
    loadAccounts()
    loadBudget()
  }, [session, month])

  function changeMonth(offset) {
    const [year, monthNumber] = month.split('-').map(Number)
    const nextDate = new Date(year, monthNumber - 1 + offset, 1)

    const nextYear = nextDate.getFullYear()
    const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0')

    setMonth(`${nextYear}-${nextMonth}`)
  }

  async function loadIncome() {
    const { data, error } = await supabase
      .from('income')
      .select('*')
      .order('income_date', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setIncome(data || [])
  }

  async function loadExpenses() {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setExpenses(data || [])
  }

  async function loadAccounts() {
    const { data, error } = await supabase
      .from('accounts_with_balance')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      setMessage(error.message)
      return
    }

    setAccounts(data || [])
  }

  async function loadBudget() {
    const { data, error } = await supabase
      .from('settings')
      .select('budget')
      .eq('user_id', session.user.id)
      .eq('month', month)
      .maybeSingle()

    if (error) {
      setMessage(error.message)
      return
    }

    setBudget(data ? Number(data.budget) : 0)
  }

  async function signIn() {
    if (!supabase) {
      setMessage('Ajoute les clés Supabase dans le fichier .env.')
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    setMessage(
      error
        ? error.message
        : 'Un lien de connexion a été envoyé par courriel.',
    )
  }

  async function addIncome() {
    const amount = Number(incomeForm.amount)

    if (
      !incomeForm.source.trim() ||
      !amount ||
      amount <= 0 ||
      !incomeForm.account
    ) {
      setMessage('Entre une source, un montant valide et sélectionne un compte.')
      return
    }

    const row = {
      source: incomeForm.source.trim(),
      amount,
      person: incomeForm.person,
      account_id: incomeForm.account,
      category: incomeForm.category,
      income_date: incomeForm.date,
      description: incomeForm.description.trim(),
      user_id: session.user.id,
    }

    if (editingIncomeId) {
      const { data, error } = await supabase
        .from('income')
        .update(row)
        .eq('id', editingIncomeId)
        .select()
        .single()

      if (error) {
        setMessage(error.message)
        return
      }

      setIncome((previousIncome) =>
        previousIncome.map((incomeItem) =>
          incomeItem.id === editingIncomeId ? data : incomeItem,
        ),
      )

      setEditingIncomeId(null)
      setMessage('Revenu modifié.')
    } else {
      const { data, error } = await supabase
        .from('income')
        .insert(row)
        .select()
        .single()

      if (error) {
        setMessage(error.message)
        return
      }

      setIncome((previousIncome) => [data, ...previousIncome])
      setMessage('Revenu ajouté.')
    }

    await loadAccounts()

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

  async function removeIncome(id) {
    const { error } = await supabase
      .from('income')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    setIncome((previousIncome) =>
      previousIncome.filter((incomeItem) => incomeItem.id !== id),
    )

    if (editingIncomeId === id) {
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

    await loadAccounts()
    setMessage('Revenu supprimé.')
  }

  async function addExpense() {
    const amount = Number(form.amount)

    if (
      !form.merchant.trim() ||
      !amount ||
      amount <= 0 ||
      !form.account
    ) {
      setMessage('Entre un marchand, un montant valide et sélectionne un compte.')
      return
    }

    const selectedAccount = accounts.find(
      (account) => account.id === form.account,
    )

    if (!selectedAccount) {
      setMessage('Le compte sélectionné est introuvable.')
      return
    }

    const row = {
      merchant: form.merchant.trim(),
      amount,
      person: form.person,
      payment_method: form.payment,
      category: form.category,
      expense_date: form.date,
      description: form.description.trim(),
      account_id: selectedAccount.id,
      account_name: selectedAccount.name,
      user_id: session.user.id,
    }

    if (editingId) {
      const { data, error } = await supabase
        .from('expenses')
        .update(row)
        .eq('id', editingId)
        .select()
        .single()

      if (error) {
        setMessage(error.message)
        return
      }

      setExpenses((previousExpenses) =>
        previousExpenses.map((expense) =>
          expense.id === editingId ? data : expense,
        ),
      )

      setEditingId(null)
      setMessage('Dépense modifiée.')
    } else {
      const { data, error } = await supabase
        .from('expenses')
        .insert(row)
        .select()
        .single()

      if (error) {
        setMessage(error.message)
        return
      }

      setExpenses((previousExpenses) => [data, ...previousExpenses])
      setMessage('Dépense ajoutée.')
    }

    await loadAccounts()

    setForm({
      merchant: '',
      amount: '',
      person: 'Nelson',
      payment: 'Débit',
      account: '',
      category: 'Logement',
      date: today(),
      description: '',
    })
  }

  async function removeExpense(id) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      setMessage(error.message)
      return
    }

    setExpenses((previousExpenses) =>
      previousExpenses.filter((expense) => expense.id !== id),
    )

    await loadAccounts()
    setMessage('Dépense supprimée.')
  }

  function updateMerchant(value) {
    const matchingRule = Object.keys(merchantRules).find((rule) =>
      value.toLowerCase().includes(rule),
    )

    setForm((previousForm) => ({
      ...previousForm,
      merchant: value,
      category: matchingRule
        ? merchantRules[matchingRule]
        : previousForm.category,
    }))
  }

  const monthExpenses = useMemo(
    () =>
      expenses.filter((expense) =>
        expense.expense_date?.startsWith(month),
      ),
    [expenses, month],
  )

  const monthIncome = useMemo(
    () =>
      income.filter((incomeItem) =>
        incomeItem.income_date?.startsWith(month),
      ),
    [income, month],
  )

  const total = monthExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  )

  const totalIncome = monthIncome.reduce(
    (sum, incomeItem) => sum + Number(incomeItem.amount),
    0,
  )

  const remaining = totalIncome - total

  const savingsRate =
    totalIncome > 0
      ? Math.round((remaining / totalIncome) * 100)
      : 0

  const grouped = Object.entries(
    monthExpenses.reduce((result, expense) => {
      result[expense.category] =
        (result[expense.category] || 0) + Number(expense.amount)

      return result
    }, {}),
  ).sort((first, second) => second[1] - first[1])

  if (!supabase) {
    return <SetupScreen />
  }

  if (!session) {
    return (
      <main className="center-page">
        <section className="auth-card">
          <div className="brand">FamilyHub</div>
          <h1>Connexion familiale</h1>
          <p>
            Entre ton courriel. Supabase t’enverra un lien de connexion
            sécurisé.
          </p>

<input
  type="text"
  value={incomeForm.source}
  onChange={(event) =>
    updateField('source', event.target.value)
  }
/>

          <button onClick={signIn}>Recevoir le lien</button>
          <p className="message">{message}</p>
        </section>
      </main>
    )
  }

  return (
    <>
      <header className="topbar">
        <div>
          <h1>FamilyHub</h1>
          <p>Budget familial Nelson & Sofia</p>
        </div>

        <button
          className="secondary"
          onClick={() => supabase.auth.signOut()}
        >
          Déconnexion
        </button>
      </header>

      <main className="container">
        <section className="card dashboard-controls">
          <div className="month-control">
            <span className="control-label">Période</span>

            <div className="month-selector">
              <button
                type="button"
                className="month-nav"
                aria-label="Afficher le mois précédent"
                onClick={() => changeMonth(-1)}
              >
                ‹
              </button>

              <div className="month-display">
                <span className="month-icon" aria-hidden="true">📅</span>
                <strong>{formatMonthLabel(month)}</strong>
              </div>

              <button
                type="button"
                className="month-nav"
                aria-label="Afficher le mois suivant"
                onClick={() => changeMonth(1)}
              >
                ›
              </button>
            </div>
          </div>
        </section>

        <section className="kpis">
          <Metric
            label="💰 Revenus"
            value={money.format(totalIncome)}
          />
          <Metric
            label="💸 Dépenses"
            value={money.format(total)}
          />
          <Metric
            label="💵 Argent restant"
            value={money.format(remaining)}
          />
          <Metric
            label="🎯 Épargne"
            value={`${savingsRate}%`}
          />
        </section>

        <Accounts accounts={accounts} />

        <IncomeForm
          incomeForm={incomeForm}
          setIncomeForm={setIncomeForm}
          addIncome={addIncome}
          editingIncomeId={editingIncomeId}
          setEditingIncomeId={setEditingIncomeId}
          today={today}
          accounts={accounts}
        />

        <section className="card income-history-card">
          <div className="history-heading">
            <div>
              <p className="section-kicker">Revenus</p>
              <h2>Historique des revenus</h2>
              <p className="section-description">
                Consulte, recherche et modifie les revenus du mois.
              </p>
            </div>

            <span className="history-count">
              {monthIncome.length} revenu{monthIncome.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="history-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="text"
              placeholder="Rechercher la provenance d’un revenu..."
              value={incomeSearch}
              onChange={(event) => setIncomeSearch(event.target.value)}
            />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Personne</th>
                  <th>Catégorie</th>
                  <th>Montant</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {monthIncome
                  .filter((incomeItem) =>
                    (incomeItem.source || '')
                      .toLowerCase()
                      .includes(incomeSearch.toLowerCase()),
                  )
                  .map((incomeItem) => (
                    <tr key={incomeItem.id}>
                      <td>{incomeItem.income_date}</td>
                      <td>{incomeItem.source}</td>
                      <td>{incomeItem.person}</td>
                      <td>{incomeItem.category}</td>
                      <td>{money.format(incomeItem.amount)}</td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => {
                            setEditingIncomeId(incomeItem.id)

                            setIncomeForm({
                              source: incomeItem.source || '',
                              amount: incomeItem.amount || '',
                              person: incomeItem.person || 'Nelson',
                              account: incomeItem.account_id || '',
                              category: incomeItem.category || 'Salaire',
                              date: incomeItem.income_date || today(),
                              description: incomeItem.description || '',
                            })

                            window.scrollTo({
                              top: 0,
                              behavior: 'smooth',
                            })
                          }}
                        >
                          Modifier
                        </button>

                        <button
                          type="button"
                          className="danger"
                          onClick={() => removeIncome(incomeItem.id)}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="two-col">
          <ExpenseForm
            form={form}
            setForm={setForm}
            addExpense={addExpense}
            editingId={editingId}
            setEditingId={setEditingId}
            setMessage={setMessage}
            updateMerchant={updateMerchant}
            categories={categories}
            today={today}
            accounts={accounts}
          />

          <article className="card distribution-card">
            <div className="distribution-heading">
              <div>
                <p className="section-kicker">Analyse</p>
                <h2>Répartition</h2>
                <p className="section-description">
                  Dépenses par catégorie pour le mois sélectionné.
                </p>
              </div>

              <strong className="distribution-total">
                {money.format(total)}
              </strong>
            </div>

            {grouped.length === 0 && (
              <div className="empty-state">
                <p>Aucune donnée pour ce mois.</p>
              </div>
            )}

            {grouped.map(([category, value]) => {
              const percent = total
                ? Math.round((value / total) * 100)
                : 0

              return (
                <div className="bar-row" key={category}>
                  <div className="bar-head">
                    <span>{category}</span>
                    <strong>
                      {money.format(value)} · {percent}%
                    </strong>
                  </div>

                  <div className="track">
                    <div
                      className="fill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </article>
        </section>

        <section className="card expense-history-card">
          <div className="history-heading">
            <div>
              <p className="section-kicker">Transactions</p>
              <h2>Historique des dépenses</h2>
              <p className="section-description">
                Consulte, recherche et modifie les dépenses du mois.
              </p>
            </div>

            <span className="history-count">
              {monthExpenses.length} transaction{monthExpenses.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="history-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="text"
              placeholder="Rechercher un marchand..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Marchand</th>
                  <th>Personne</th>
                  <th>Catégorie</th>
                  <th>Compte</th>
                  <th>Montant</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {monthExpenses
                  .filter((expense) =>
                    expense.merchant
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((expense) => (
                    <tr key={expense.id}>
                      <td>{expense.expense_date}</td>
                      <td>{expense.merchant}</td>
                      <td>{expense.person}</td>
                      <td>{expense.category}</td>
                      <td>{expense.account_name || '—'}</td>
                      <td>{money.format(expense.amount)}</td>

                      <td className="actions-cell">
                        <button
                          className="secondary"
                          onClick={() => {
                            setEditingId(expense.id)

                            setForm({
                              merchant: expense.merchant,
                              amount: expense.amount,
                              person: expense.person,
                              payment: expense.payment_method,
                              account: expense.account_id || '',
                              category: expense.category,
                              date: expense.expense_date,
                              description:
                                expense.description || '',
                            })

                            window.scrollTo({
                              top: 0,
                              behavior: 'smooth',
                            })
                          }}
                        >
                          Modifier
                        </button>

                        <button
                          className="danger"
                          onClick={() =>
                            removeExpense(expense.id)
                          }
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>

        {message && <p className="message">{message}</p>}
      </main>
    </>
  )
}

function SetupScreen() {
  return (
    <main className="center-page">
      <section className="auth-card">
        <div className="brand">FamilyHub</div>
        <h1>Configuration requise</h1>

        <p>
          Copie <code>.env.example</code> vers <code>.env</code>, puis
          ajoute l’URL et la clé publique de ton projet Supabase.
        </p>
      </section>
    </main>
  )
}