-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Businesses (tenants)
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now(),
  owner_id uuid references auth.users(id) not null
);

-- Staff members
create table staff (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) not null,
  user_id uuid references auth.users(id) not null,
  created_at timestamptz default now(),
  unique(business_id, user_id)
);

-- Customers
create table customers (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) not null,
  user_id uuid references auth.users(id) not null,
  qr_code text unique not null, -- unique identifier for QR
  created_at timestamptz default now(),
  unique(business_id, user_id)
);

-- Rewards/Milestones
create table rewards (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) not null,
  name text not null, -- "Free Coffee"
  description text,
  stamps_required integer not null, -- 5, 10, etc
  created_at timestamptz default now()
);

-- Stamps (ledger - one row per stamp)
create table stamps (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) not null,
  customer_id uuid references customers(id) not null,
  staff_id uuid references staff(id) not null,
  created_at timestamptz default now()
);

-- Vouchers (auto-generated when milestone met)
create table vouchers (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id) not null,
  customer_id uuid references customers(id) not null,
  reward_id uuid references rewards(id) not null,
  qr_code text unique not null,
  status text default 'active' check (status in ('active', 'redeemed', 'expired')),
  created_at timestamptz default now(),
  redeemed_at timestamptz,
  redeemed_by uuid references staff(id)
);

-- Row Level Security (RLS)
alter table businesses enable row level security;
alter table staff enable row level security;
alter table customers enable row level security;
alter table rewards enable row level security;
alter table stamps enable row level security;
alter table vouchers enable row level security;

-- Policies (simplified for MVP)
create policy "Users can view their own business" on businesses
  for select using (owner_id = auth.uid());

create policy "Staff can view their business" on staff
  for select using (
    business_id in (select business_id from staff where user_id = auth.uid())
    or business_id in (select id from businesses where owner_id = auth.uid())
  );

create policy "Customers can view their own profile" on customers
  for select using (user_id = auth.uid());

create policy "Public read rewards" on rewards
  for select using (true);

create policy "Staff can add stamps" on stamps
  for insert with check (
    staff_id in (select id from staff where user_id = auth.uid())
  );

create policy "Users can view stamps in their business" on stamps
  for select using (
    business_id in (select business_id from staff where user_id = auth.uid())
    or customer_id in (select id from customers where user_id = auth.uid())
  );

create policy "Customers can view their vouchers" on vouchers
  for select using (
    customer_id in (select id from customers where user_id = auth.uid())
    or business_id in (select business_id from staff where user_id = auth.uid())
  );

-- Function to auto-generate voucher when milestone is met
create or replace function check_milestone()
returns trigger as $$
declare
  stamp_count integer;
  reward_record record;
begin
  -- Count total stamps for this customer in this business
  select count(*) into stamp_count
  from stamps
  where customer_id = new.customer_id
    and business_id = new.business_id;

  -- Check each reward to see if milestone is met
  for reward_record in
    select * from rewards
    where business_id = new.business_id
    order by stamps_required asc
  loop
    -- If stamps match exactly the requirement, create voucher
    if stamp_count = reward_record.stamps_required then
      insert into vouchers (business_id, customer_id, reward_id, qr_code)
      values (
        new.business_id,
        new.customer_id,
        reward_record.id,
        uuid_generate_v4()::text
      );
    end if;
  end loop;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger on stamp insert
create trigger on_stamp_added
  after insert on stamps
  for each row execute function check_milestone();
