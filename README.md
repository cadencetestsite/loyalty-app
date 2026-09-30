# Loyalty Stamp App

Digital loyalty cards for small businesses. Customers collect stamps via QR code, earn vouchers automatically at milestones.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS
- **Backend**: Supabase (Postgres + Auth)
- **Hosting**: Vercel
- **QR Scanning**: html5-qrcode

## Quick Start

1. **Clone and install**
   ```bash
   npm install
   ```

2. **Set up Supabase**
   - Create project at [supabase.com](https://supabase.com)
   - Run SQL migrations in order:
     - `supabase/migrations/001_initial_schema.sql`
     - `supabase/migrations/002_enrollment_and_reset.sql`
   - Copy Project URL and anon key

3. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Fill in your Supabase credentials
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```

5. **Deploy to Vercel**
   - Push to GitHub
   - Import in Vercel
   - Add environment variables
   - Deploy

## User Flows

### Business Admin
1. Register → creates business → gets unique QR code
2. Print/display QR code for customers to scan
3. Add rewards (e.g., "Free Coffee" at 5 stamps)
4. Add staff members
5. View stats (customers, stamps, redemptions)
6. Choose stamp reset policy (reset to zero vs carry over)

### Staff
1. Login with staff account
2. Scan customer QR → add stamp
3. Scan voucher QR → mark redeemed

### Customer
1. Register → scan business QR to join program
2. Show personal QR to staff to collect stamps
3. Auto-receive voucher at milestone
4. Show voucher QR to redeem

## Database Schema

- `businesses` - tenant/organization with QR code and reset policy
- `staff` - staff members linked to business
- `customers` - customers with unique QR codes
- `rewards` - milestone definitions
- `stamps` - ledger of all stamps (one row per stamp)
- `vouchers` - auto-generated at milestones

## Stamp Reset Policies

| Policy | Behavior |
|---|---|
| `reset_to_zero` | All stamps cleared when reward earned |
| `carry_over` | Only stamps used for reward are deducted |

Example: Customer has 7 stamps, earns reward at 5 stamps
- **Reset to zero**: 0 stamps remaining
- **Carry over**: 2 stamps remaining

## Security Notes (MVP)

This is an MVP with simplified security. Before production:

- [ ] Add rate limiting on stamp creation
- [ ] Validate staff permissions on every request
- [ ] Add voucher expiration dates
- [ ] Implement proper staff invitation flow
- [ ] Add audit logs for all actions
- [ ] Set up proper RLS policies for all tables
- [ ] Add input validation and sanitization

## License

MIT
