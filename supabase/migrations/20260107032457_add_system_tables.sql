/*
  # Add System Tables

  ## Overview
  Adds tables for access requests, contact messages, visits, conversations, and promo rules.

  ## New Tables
  - access_requests: User role change requests
  - contact_messages: Public contact form  
  - visits: Client visit tracking
  - conversations: Message threads
  - conversation_participants: Conversation membership
  - messages: Chat messages
  - promo_rules: Discount rules

  ## Enhancements
  - Add delivery coordinates to orders
  - Add driver assignment to delivery_tracking
  - Add ETA and distance tracking

  ## Security
  - RLS enabled on all tables
  - Role-based access control
*/

-- Add delivery coordinates to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_latitude numeric(10,8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_longitude numeric(11,8);

-- Add driver tracking fields to delivery_tracking
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES profiles(user_id);
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS eta_minutes integer;
ALTER TABLE delivery_tracking ADD COLUMN IF NOT EXISTS distance_km numeric(6,2);

-- Create access_requests table
CREATE TABLE IF NOT EXISTS access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  requested_role text NOT NULL CHECK (requested_role IN ('driver', 'admin')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason text,
  reviewed_by uuid REFERENCES profiles(user_id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'closed')),
  handled_by uuid REFERENCES profiles(user_id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create visits table
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  client_name text NOT NULL,
  client_phone text,
  client_email text,
  visit_latitude numeric(10,8),
  visit_longitude numeric(11,8),
  notes text,
  visit_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'order', 'support')),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create conversation_participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  can_message boolean DEFAULT true,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create promo_rules table
CREATE TABLE IF NOT EXISTS promo_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  threshold_total_spent numeric(10,2) NOT NULL,
  delivery_discount_amount numeric(10,2) DEFAULT 0,
  percent_discount numeric(4,2) DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_access_requests_user ON access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_visits_created_by ON visits(created_by);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_driver ON delivery_tracking(driver_id);

-- Enable RLS
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_rules ENABLE ROW LEVEL SECURITY;

-- Insert default promo rules
INSERT INTO promo_rules (name, threshold_total_spent, delivery_discount_amount, percent_discount, active)
VALUES 
  ('Bronze - Free Delivery', 500, 8, 0, true),
  ('Silver - 2% Discount', 1000, 8, 2, true),
  ('Gold - 5% Discount', 2500, 15, 5, true)
ON CONFLICT DO NOTHING;