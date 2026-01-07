/*
  # Système de messagerie hiérarchique

  ## Description
  Nouveau système de messagerie avec messages globaux (broadcast) et messages privés (1:1).
  Suppression de l'ancien système de conversations et messages.

  ## Changements

  1. Suppression des anciennes tables
    - `messages` - Anciens messages
    - `conversation_participants` - Anciens participants
    - `conversations` - Anciennes conversations

  2. Nouvelles tables
    - `messages_global` - Messages broadcast (admin vers tous)
      - `id` (uuid, primary key)
      - `sender_id` (uuid, référence profiles)
      - `sender_role` (text, check admin/client/driver)
      - `target_role` (text, check all/client/driver)
      - `message` (text, contenu)
      - `created_at` (timestamptz)
    
    - `messages_private` - Messages privés (1:1)
      - `id` (uuid, primary key)
      - `sender_id` (uuid, référence profiles)
      - `receiver_id` (uuid, référence profiles)
      - `message` (text, contenu)
      - `read_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  3. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour messages_global (admin broadcast, tous read)
    - Policies pour messages_private (sender/receiver read/write)
*/

-- Drop old messaging tables if they exist
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Create messages_global table
CREATE TABLE IF NOT EXISTS messages_global (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'client', 'driver', 'commercial')),
  target_role TEXT NOT NULL CHECK (target_role IN ('all', 'buyer', 'driver')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_global_created_at ON messages_global(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_global_target_role ON messages_global(target_role);

-- Create messages_private table
CREATE TABLE IF NOT EXISTS messages_private (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_private_sender ON messages_private(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_private_receiver ON messages_private(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_private_created_at ON messages_private(created_at DESC);

-- Enable RLS
ALTER TABLE messages_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages_private ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages_global

-- Admin can read all messages
CREATE POLICY "Admin can read all global messages"
  ON messages_global FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'commercial')
    )
  );

-- Admin can insert global messages
CREATE POLICY "Admin can send global messages"
  ON messages_global FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'commercial')
      AND profiles.id = sender_id
    )
  );

-- Clients can read messages targeted to them or all
CREATE POLICY "Clients can read their global messages"
  ON messages_global FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'buyer'
    )
    AND (target_role = 'all' OR target_role = 'buyer')
  );

-- Drivers can read messages targeted to them or all
CREATE POLICY "Drivers can read their global messages"
  ON messages_global FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'driver'
    )
    AND (target_role = 'all' OR target_role = 'driver')
  );

-- RLS Policies for messages_private

-- Users can read messages where they are sender or receiver
CREATE POLICY "Users can read their private messages"
  ON messages_private FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

-- Users can insert private messages as sender
CREATE POLICY "Users can send private messages"
  ON messages_private FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
  );

-- Users can update read_at on messages they received
CREATE POLICY "Users can mark received messages as read"
  ON messages_private FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());

-- Admin can read all private messages
CREATE POLICY "Admin can read all private messages"
  ON messages_private FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'commercial')
    )
  );
