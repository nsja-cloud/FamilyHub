import { useEffect, useMemo, useState } from 'react'
import Metric from './components/Metric'
import IncomeForm from './components/IncomeForm'
import ExpenseForm from './components/ExpenseForm'
import { supabase } from './supabase'

const categories = [
  'Logement','Épicerie','Restaurants','Transport','Enfants','Maison',
  'Vêtements','Animaux','Santé et soins','Cadeaux','Loisirs','Entreprise','Épargne','Divers'
]

const merchantRules = {
  iga:'Épicerie', costco:'Épicerie', maxi:'Épicerie',
  starbucks:'Restaurants', domino:'Restaurants',
  mondou:'Animaux', dulux:'Maison', winners:'Maison',
  marketplace:'Maison', cinestarz:'Loisirs', gaz:'Transport',
  esso:'Transport', shell:'Transport'
}

const money = new Intl.NumberFormat('fr-CA', { style:'currency', currency:'CAD' })
const currentMonth = () => new Date().toISOString().slice(0,7)
const today = () => new Date().toISOString().slice(0,10)

export default function App() {
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [expenses, setExpenses] = useState([])
  const [income, setIncome] = useState([])
  const [month, setMonth] = useState(currentMonth())
const [budget, setBudget] = useState(0)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    merchant:'', amount:'', person:'Nelson', payment:'Débit',
    category:'Logement', date:today(), description:''
  })
  const [incomeForm, setIncomeForm] = useState({
  source: '',
  amount: '',
  person: 'Nelson',
  category: 'Salaire',
  date: today(),
  description: ''
})

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

useEffect(() => {
  if (!session || !supabase) return

  loadExpenses()
  loadIncome()
  async function addIncome() {
  const amount = Number(incomeForm.amount)

  if (!incomeForm.source.trim() || !amount || amount <= 0) {
    setMessage('Entre une source et un montant valide.')
    return
  }

  const row = {
    source: incomeForm.source.trim(),
    amount,
    person: incomeForm.person,
    category: incomeForm.category,
    income_date: incomeForm.date,
    description: incomeForm.description.trim(),
    user_id: session.user.id
  }

  const { data, error } = await supabase
    .from('income')
    .insert(row)
    .select()
    .single()

  if (error) {
    setMessage(error.message)
    return
  }

  setIncome(prev => [data, ...prev])

  setIncomeForm(prev => ({
    ...prev,
    source: '',
    amount: '',
    description: ''
  }))

  setMessage('Revenu ajouté.')
}
  loadBudget()
}, [session, month])

async function loadIncome() {
  const { data, error } = await supabase
    .from('income')
    .select('*')
    .order('income_date', { ascending: false })

  if (error) {
    setMessage(error.message)
  } else {
    setIncome(data || [])
  }
}
async function loadExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })

  if (error) {
    setMessage(error.message)
  } else {
    setExpenses(data || [])
  }
}
async function addIncome() {
  const amount = Number(incomeForm.amount)

  if (!incomeForm.source.trim() || !amount || amount <= 0) {
    setMessage('Entre une source et un montant valide.')
    return
  }

  const row = {
    source: incomeForm.source.trim(),
    amount,
    person: incomeForm.person,
    category: incomeForm.category,
    income_date: incomeForm.date,
    description: incomeForm.description,
    user_id: session.user.id
  }

  const { data, error } = await supabase
    .from('income')
    .insert(row)
    .select()
    .single()

  if (error) {
    setMessage(error.message)
    return
  }

  setIncome(prev => [data, ...prev])

  setIncomeForm({
    source: '',
    amount: '',
    person: 'Nelson',
    category: 'Salaire',
    date: today(),
    description: ''
  })

  setMessage('Revenu ajouté.')
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

  if (data) {
    setBudget(Number(data.budget))
  } else {
    setBudget(0)
  }
}

async function saveBudget(value) {
  if (!session || !supabase) return

  const { error } = await supabase
    .from('settings')
    .upsert(
      {
        user_id: session.user.id,
        month,
        budget: value,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'user_id,month'
      }
    )

  if (error) {
    setMessage(error.message)
  } else {
    setMessage('Budget sauvegardé.')
  }
}



  async function signIn() {
    if (!supabase) {
      setMessage('Ajoute les clés Supabase dans le fichier .env.')
      return
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    setMessage(error ? error.message : 'Un lien de connexion a été envoyé par courriel.')
  }

async function addExpense() {
  const amount = Number(form.amount)

  if (!form.merchant.trim() || !amount || amount <= 0) {
    setMessage('Entre un marchand et un montant valide.')
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

    setExpenses(prev =>
      prev.map(expense =>
        expense.id === editingId ? data : expense
      )
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

    setExpenses(prev => [data, ...prev])
    setMessage('Dépense ajoutée.')
  }

  setForm(prev => ({
    ...prev,
    merchant: '',
    amount: '',
    description: ''
  }))
}

  async function removeExpense(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) setMessage(error.message)
    else setExpenses(prev => prev.filter(x => x.id !== id))
  }

  function updateMerchant(value) {
    const key = Object.keys(merchantRules).find(rule => value.toLowerCase().includes(rule))
    setForm(prev => ({ ...prev, merchant:value, category:key ? merchantRules[key] : prev.category }))
  }

  const monthExpenses = useMemo(
    () => expenses.filter(x => x.expense_date?.startsWith(month)),
    [expenses, month]
  )

  const total = monthExpenses.reduce((s,x) => s + Number(x.amount), 0)
  const totalIncome = income
  .filter(x => x.income_date?.startsWith(month))
  .reduce((s, x) => s + Number(x.amount), 0)

const remaining = totalIncome - total
const savingsRate = totalIncome > 0
  ? Math.round((remaining / totalIncome) * 100)
  : 0
  const nelson = monthExpenses.filter(x => x.person === 'Nelson').reduce((s,x) => s + Number(x.amount), 0)
  const sofia = monthExpenses.filter(x => x.person === 'Sofia').reduce((s,x) => s + Number(x.amount), 0)

  const grouped = Object.entries(monthExpenses.reduce((acc,x) => {
    acc[x.category] = (acc[x.category] || 0) + Number(x.amount)
    return acc
  }, {})).sort((a,b) => b[1] - a[1])

  if (!supabase) {
    return <SetupScreen />
  }

  if (!session) {
    return (
      <main className="center-page">
        <section className="auth-card">
          <div className="brand">FamilyHub</div>
          <h1>Connexion familiale</h1>
          <p>Entre ton courriel. Supabase t’enverra un lien de connexion sécurisé.</p>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nom@courriel.com" />
          <button onClick={signIn}>Recevoir le lien</button>
          <p className="message">{message}</p>
        </section>
      </main>
    )
  }

  return (
    <>
      <header className="topbar">
        <div><h1>FamilyHub</h1><p>Budget familial Nelson & Sofia</p></div>
        <button className="secondary" onClick={() => supabase.auth.signOut()}>Déconnexion</button>
      </header>

      <main className="container">
        <section className="filters card">
          <label>Mois<input type="month" value={month} onChange={e => setMonth(e.target.value)} /></label>
<label>
  Budget mensuel
  <input
    type="number"
    value={budget}
onChange={e => setBudget(e.target.value)}
onBlur={e => saveBudget(Number(e.target.value) || 0)}
  />
</label>
        </section>

        <section className="kpis">
<Metric label="💰 Revenus" value={money.format(totalIncome)} />
<Metric label="💸 Dépenses" value={money.format(total)} />
<Metric label="💵 Argent restant" value={money.format(remaining)} />
<Metric label="🎯 Épargne" value={`${savingsRate}%`} />
        </section>
<IncomeForm
  incomeForm={incomeForm}
  setIncomeForm={setIncomeForm}
  addIncome={addIncome}
/>

<section className="card">
  <h2>Historique des revenus</h2>

  <div className="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Source</th>
          <th>Personne</th>
          <th>Catégorie</th>
          <th>Montant</th>
        </tr>
      </thead>

      <tbody>
        {income
          .filter(x => x.income_date?.startsWith(month))
          .map(x => (
            <tr key={x.id}>
              <td>{x.income_date}</td>
              <td>{x.source}</td>
              <td>{x.person}</td>
              <td>{x.category}</td>
              <td>{money.format(x.amount)}</td>
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
/>


          <article className="card">
            <h2>Répartition</h2>
            {grouped.length === 0 && <p>Aucune donnée pour ce mois.</p>}
            {grouped.map(([category,value]) => {
              const percent = total ? Math.round(value/total*100) : 0
              return <div className="bar-row" key={category}>
                <div className="bar-head"><span>{category}</span><strong>{money.format(value)} · {percent}%</strong></div>
                <div className="track"><div className="fill" style={{width:`${percent}%`}} /></div>
              </div>
            })}
          </article>
        </section>

        <section className="card">
          <h2>Historique</h2>
          <input
  type="text"
  placeholder="Rechercher un marchand..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  style={{
    width: '100%',
    padding: '10px',
    margin: '15px 0',
    borderRadius: '8px',
    border: '1px solid #ccc'
  }}
/>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Marchand</th><th>Personne</th><th>Catégorie</th><th>Paiement</th><th>Montant</th><th></th></tr></thead>
              <tbody>
  {monthExpenses
  .filter(x =>
    x.merchant.toLowerCase().includes(search.toLowerCase())
  )
  .map(x => <tr key={x.id}>
                  <td>{x.expense_date}</td><td>{x.merchant}</td><td>{x.person}</td><td>{x.category}</td>
                  <td>{x.payment_method}</td><td>{money.format(x.amount)}</td>
<td className="actions-cell">
  <button
  className="secondary"
  onClick={() => {
    setEditingId(x.id)

    setForm({
      merchant: x.merchant,
      amount: x.amount,
      person: x.person,
      payment: x.payment_method,
      category: x.category,
      date: x.expense_date,
      description: x.description || ''
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }}
>
  Modifier
</button>

  <button
    className="danger"
    onClick={() => removeExpense(x.id)}
  >
    Supprimer
  </button>
</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </>
  )
}



function SetupScreen() {
  return <main className="center-page"><section className="auth-card">
    <div className="brand">FamilyHub</div>
    <h1>Configuration requise</h1>
    <p>Copie <code>.env.example</code> vers <code>.env</code>, puis ajoute l’URL et la clé publique de ton projet Supabase.</p>
  </section></main>
}
