# WallBoard Rooms

A simple, always-on web dashboard for live room availability and instant booking. Perfect for small to mid-size office teams with 3-10 meeting rooms.

## Features

- **Single-tenant instance** - One office per deployment
- **Admin dashboard** - Manage rooms, settings, and view the public board URL
- **Public board view** - Display on tablets or kiosks for easy room booking
- **Quick booking** - Tap to book with preset durations (15, 30, 60, 90, 120 minutes)
- **Auto-expiry** - Bookings automatically end when time expires
- **Manual controls** - End bookings early or extend them
- **Real-time sync** - Automatic polling keeps all boards in sync
- **Conflict detection** - Prevents overlapping bookings
- **Touch-friendly UI** - Designed for tablets and kiosks

## Tech Stack

- **Frontend**: Next.js 15 (React 19, TypeScript)
- **Backend**: Next.js API routes with Node.js runtime
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Session-based admin auth with bcrypt
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Vercel-ready (or any Node.js hosting)

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)
- PostgreSQL database

### Docker Quickstart (Recommended)

If you want a one-command setup with PostgreSQL included:

```bash
docker compose up --build
```

Then open http://localhost:3000 and complete the `/setup` flow.

Optional seed data:

```bash
docker compose exec app pnpm db:seed
```

Notes:
- Update `SESSION_SECRET` in `docker-compose.yml` before using in production.
- If you already have a local `.env`, Docker uses the container settings instead.
- Docker uses `prisma db push` on startup to avoid interactive migration prompts.

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd wallroom
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/wallboard?schema=public"
SESSION_SECRET="your-random-secret-key-min-32-chars"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

4. **Generate Prisma client and run migrations**

```bash
pnpm db:generate
pnpm db:migrate
```

5. **Seed the database (optional)**

This creates sample rooms and bookings for testing:

```bash
pnpm db:seed
```

The seed script will output:
- Admin password: `admin123`
- Board URL for testing

6. **Start the development server**

```bash
pnpm dev
```

Visit http://localhost:3000

### First-Time Setup

When you first visit the application:

1. You'll be redirected to `/setup`
2. Create an admin password (min 8 characters)
3. Copy the generated public board URL
4. Login with your admin password at `/admin/login`

## Usage

### Admin Dashboard

Access at `/admin` (requires login)

**Features:**
- View and copy the public board URL
- Create, edit, activate/deactivate rooms
- Set room colors for easy identification
- View current settings (polling interval, booking durations, etc.)

### Public Board

Access at `/board/<token>` (no login required)

**Features:**
- View all active rooms at a glance
- See room status (Free/Occupied)
- View current and next bookings
- Tap a free room to book it
- Tap an occupied room to view details and controls
- End bookings early or extend them

### Booking Flow

1. Tap a free room card on the board
2. Select a duration (15, 30, 60, 90, or 120 minutes)
3. Enter a meeting title
4. Tap "Book Now"
5. The room updates to "Occupied" immediately

### Managing Active Bookings

1. Tap an occupied room card
2. View current booking details
3. Options:
   - **End Now**: Immediately end the booking
   - **+15m / +30m**: Extend the booking (if no conflicts)

## Database Schema

### UserSetting
- Single-tenant admin configuration
- Admin password (bcrypt hashed)
- Board public token
- Polling interval
- Booking durations and extend increments

### Room
- Room name, description, color
- Active/inactive status
- Display order for the board

### Booking
- Room reference
- Title, start time, end time
- Status (active, ended, cancelled)
- Source (board)

### Session
- Admin session management
- Session token (HTTP-only cookie)
- Expiration time

## API Endpoints

### Admin Endpoints (require authentication)

- `POST /api/admin/setup` - Initial setup
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings
- `PUT /api/admin/password` - Change password
- `GET /api/admin/rooms` - List all rooms
- `POST /api/admin/rooms` - Create room
- `PUT /api/admin/rooms/:roomId` - Update room
- `DELETE /api/admin/rooms/:roomId` - Delete/deactivate room
- `POST /api/admin/bookings/expire` - Manually expire old bookings

### Public Board Endpoints (token-based)

- `GET /api/board/:token/state` - Get board state (all rooms with current/next bookings)
- `POST /api/board/:token/rooms/:roomId/book` - Create booking
- `POST /api/board/:token/bookings/:bookingId/end` - End booking early
- `POST /api/board/:token/bookings/:bookingId/extend` - Extend booking

## Development

### Available Scripts

```bash
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm db:migrate       # Run database migrations
pnpm db:generate      # Generate Prisma client
pnpm db:seed          # Seed database with sample data
pnpm db:studio        # Open Prisma Studio (database GUI)
```

### Project Structure

```
.
├── app/
│   ├── admin/              # Admin dashboard pages
│   ├── api/                # API route handlers
│   ├── board/[token]/      # Public board view
│   ├── setup/              # Initial setup page
│   └── login/              # Login page (old, can be removed)
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── prisma.ts           # Prisma client instance
│   ├── session.ts          # Session management utilities
│   ├── bookings.ts         # Booking logic and helpers
│   └── utils.ts            # General utilities
├── prisma/
│   └── schema.prisma       # Database schema
├── scripts/
│   └── seed.ts             # Database seeding script
└── public/                 # Static assets
```

## Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

### Other Platforms

Works on any platform that supports:
- Node.js 18+
- PostgreSQL database
- Environment variables

Popular options:
- Railway
- Render
- Heroku
- AWS/GCP/Azure with managed PostgreSQL

## Configuration

### Polling Interval

Default: 10 seconds. Change in admin settings or database:

```sql
UPDATE user_settings SET poll_interval_seconds = 5;
```

### Booking Durations

Default: [15, 30, 60, 90, 120] minutes. Customize in database:

```sql
UPDATE user_settings SET booking_durations = ARRAY[10, 20, 30, 45, 60];
```

### Extend Increments

Default: [15, 30] minutes. Customize in database:

```sql
UPDATE user_settings SET extend_increments = ARRAY[10, 15, 30, 60];
```

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` in `.env`
- Check PostgreSQL is running
- Ensure database exists: `createdb wallboard`

### Migration Errors

Reset database (WARNING: deletes all data):

```bash
pnpm prisma migrate reset
```

### Session Issues

Clear cookies or use incognito mode. Sessions expire after 7 days.

### Board Not Updating

- Check polling interval in settings
- Verify network connection
- Check browser console for errors

## Security Notes

- Admin password is bcrypt-hashed
- Sessions use HTTP-only secure cookies
- Board token is cryptographically random
- No user-specific data is stored
- HTTPS recommended in production

## Future Enhancements (Not in MVP)

- Calendar integrations (Google, Outlook)
- Recurring bookings
- Email/SMS notifications
- Analytics dashboard
- Multi-tenant support
- Mobile apps
- Offline PWA support

## License

See [LICENSE.md](LICENSE.md)

## Support

For issues and questions, please open a GitHub issue.
