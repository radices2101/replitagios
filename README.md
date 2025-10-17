# Blockchain Platform

A production-ready blockchain platform built with Vite, Supabase, and modern web technologies.

## Features

- Secure blockchain data storage with Supabase PostgreSQL
- User authentication and authorization
- Wallet management system
- Transaction tracking and history
- Real-time blockchain explorer
- Responsive modern UI

## Technology Stack

- **Frontend:** Vite, Vanilla JavaScript, CSS3
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Authentication:** Supabase Auth
- **Security:** Row Level Security (RLS), JWT authentication

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

Create a `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

Run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### Production Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Database Schema

The platform uses three main tables:

- **blocks**: Stores blockchain data with hash chains
- **transactions**: Records all transactions between addresses
- **wallets**: Manages user wallet addresses and balances

All tables are protected with Row Level Security (RLS) policies.

## Features

### Authentication

- Email/password authentication via Supabase Auth
- Secure session management
- Protected routes and API endpoints

### Wallet Management

- Create multiple wallets per user
- View wallet balances
- Transaction history

### Blockchain Explorer

- View all blocks in the chain
- Inspect block details and hashes
- Genesis block with immutable record

### Transaction Tracking

- View personal transaction history
- Real-time transaction status
- Transaction hash verification

## Security

- All sensitive operations require authentication
- Row Level Security (RLS) on all database tables
- JWT-based API authentication
- CORS protection on Edge Functions
- Secure hash generation using SHA-256

## API Endpoints

Edge Functions are deployed at `/functions/v1/blockchain/`:

- `GET /blocks` - List blockchain blocks
- `POST /blocks` - Create new block (authenticated)
- `GET /transactions` - List transactions
- `POST /transactions` - Create transaction (authenticated)
- `GET /wallets` - List user wallets (authenticated)
- `POST /wallets` - Create new wallet (authenticated)

## License

MIT License - See LICENSE.txt for details
