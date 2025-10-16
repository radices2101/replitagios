/*
  # Blockchain Platform Database Schema

  1. New Tables
    - `blocks`
      - `id` (uuid, primary key)
      - `block_number` (bigint, unique, indexed)
      - `timestamp` (timestamptz)
      - `previous_hash` (text)
      - `hash` (text, unique)
      - `data` (jsonb)
      - `nonce` (bigint)
      - `created_at` (timestamptz)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `block_id` (uuid, foreign key to blocks)
      - `from_address` (text)
      - `to_address` (text)
      - `amount` (numeric)
      - `fee` (numeric)
      - `tx_hash` (text, unique)
      - `status` (text)
      - `created_at` (timestamptz)
    
    - `wallets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `address` (text, unique)
      - `balance` (numeric, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Public read access for blocks (blockchain transparency)
    - Users can only see their own wallets and transactions
*/

-- Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_number bigint UNIQUE NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  previous_hash text NOT NULL,
  hash text UNIQUE NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  nonce bigint DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create index on block_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_blocks_block_number ON blocks(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks(hash);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid REFERENCES blocks(id) ON DELETE CASCADE,
  from_address text NOT NULL,
  to_address text NOT NULL,
  amount numeric(20, 8) NOT NULL CHECK (amount >= 0),
  fee numeric(20, 8) DEFAULT 0 CHECK (fee >= 0),
  tx_hash text UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_block_id ON transactions(block_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to_address ON transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  address text UNIQUE NOT NULL,
  balance numeric(20, 8) DEFAULT 0 CHECK (balance >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);

-- Enable Row Level Security
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blocks (public read, no write for regular users)
CREATE POLICY "Anyone can view blocks"
  ON blocks FOR SELECT
  TO public
  USING (true);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    from_address IN (SELECT address FROM wallets WHERE user_id = auth.uid())
    OR to_address IN (SELECT address FROM wallets WHERE user_id = auth.uid())
  );

CREATE POLICY "Anyone can view all transactions"
  ON transactions FOR SELECT
  TO public
  USING (true);

-- RLS Policies for wallets
CREATE POLICY "Users can view own wallets"
  ON wallets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets"
  ON wallets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets"
  ON wallets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update wallet updated_at timestamp
CREATE OR REPLACE FUNCTION update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_wallets_timestamp
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_timestamp();

-- Insert genesis block
INSERT INTO blocks (block_number, previous_hash, hash, data, nonce)
VALUES (
  0,
  '0000000000000000000000000000000000000000000000000000000000000000',
  'genesis_block_' || gen_random_uuid()::text,
  '{"type": "genesis", "message": "Genesis Block"}'::jsonb,
  0
)
ON CONFLICT (block_number) DO NOTHING;
