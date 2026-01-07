/*
  # Fix Messaging System - Simplified Architecture

  ## Overview
  Simplifies messaging system with a single unified table for all message types.

  ## Changes
  1. Drop existing complex messaging tables
  2. Create single unified messages table
  3. Add simple RLS policies that actually work

  ## New Table: messages
  - `id` (uuid, primary key)
  - `sender_id` (uuid, references auth.users)
  - `sender_role` (text, role of sender)
  - `message` (text, message content)
  - `is_broadcast` (boolean, true if admin broadcast)
  - `target_role` (text, 'clients', 'drivers', 'all', or null for direct)
  - `created_at` (timestamptz)

  ## Security
  - Admin can see and send all messages
  - Users can see broadcasts and messages targeting their role
  - Users can send messages to admin
*/

-- Drop existing messaging tables
DROP TABLE IF EXISTS messages_global CASCADE;
DROP TABLE IF EXISTS messages_private CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

-- Create unified messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'buyer', 'driver', 'commercial', 'supplier')),
  message TEXT NOT NULL,
  is_broadcast BOOLEAN DEFAULT false,
  target_role TEXT CHECK (target_role IN ('buyer', 'driver', 'commercial', 'all')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_broadcast ON messages(is_broadcast);
CREATE INDEX idx_messages_target_role ON messages(target_role);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy 1: Admin can see and send all messages
CREATE POLICY "Admin full access" 
  ON messages 
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Policy 2: Users can see relevant messages (broadcasts or targeted to their role)
CREATE POLICY "Users see relevant messages" 
  ON messages 
  FOR SELECT 
  TO authenticated
  USING (
    is_broadcast = true 
    OR sender_id = auth.uid()
    OR target_role = 'all'
    OR target_role = (SELECT role::text FROM profiles WHERE user_id = auth.uid())
  );

-- Policy 3: Users can send messages (to admin)
CREATE POLICY "Users can send messages" 
  ON messages 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = (SELECT role::text FROM profiles WHERE user_id = auth.uid())
  );
