create extension if not exists "pgcrypto";

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  merchant text not null,
  amount numeric(12,2) not null check (amount > 0),
  person text not null check (person in ('Nelson','Sofia')),
  payment_method text not null,
  category text not null,
  expense_date date not null default current_date,
  description text default '',
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "Users can view their own expenses"
on public.expenses for select
using (auth.uid() = user_id);

create policy "Users can insert their own expenses"
on public.expenses for insert
with check (auth.uid() = user_id);

create policy "Users can update their own expenses"
on public.expenses for update
using (auth.uid() = user_id);

create policy "Users can delete their own expenses"
on public.expenses for delete
using (auth.uid() = user_id);
