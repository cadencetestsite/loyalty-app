-- Add reset policy to businesses
alter table businesses add column if not exists stamp_reset_policy text default 'carry_over' check (stamp_reset_policy in ('reset_to_zero', 'carry_over'));

-- Update the check_milestone function to handle stamp reset
create or replace function check_milestone()
returns trigger as $$
declare
  stamp_count integer;
  reward_record record;
  voucher_id uuid;
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
      )
      returning id into voucher_id;

      -- Handle stamp reset based on business policy
      if (select stamp_reset_policy from businesses where id = new.business_id) = 'reset_to_zero' then
        -- Delete all stamps (reset to zero)
        delete from stamps
        where customer_id = new.customer_id
          and business_id = new.business_id;
      else
        -- Carry over: delete only the stamps used for this reward
        delete from stamps
        where id in (
          select id from stamps
          where customer_id = new.customer_id
            and business_id = new.business_id
          order by created_at asc
          limit reward_record.stamps_required
        );
      end if;

      -- Exit after creating one voucher (prevent multiple triggers)
      exit;
    end if;
  end loop;

  return new;
end;
$$ language plpgsql security definer;

-- Add business QR code for customer enrollment
alter table businesses add column if not exists qr_code text unique;

-- Update existing businesses with QR codes
update businesses
set qr_code = 'BUSINESS:' || id::text
where qr_code is null;

-- Add trigger to auto-set business QR on insert
create or replace function set_business_qr()
returns trigger as $$
begin
  if new.qr_code is null then
    new.qr_code := 'BUSINESS:' || new.id::text;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger set_business_qr_trigger
  before insert on businesses
  for each row execute function set_business_qr();
