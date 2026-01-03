/*
  # Add Delivery Tracking and Notifications

  ## Overview
  Adds delivery tracking system and notifications for the B2B platform

  ## 1. Changes to Existing Tables

  ### orders
  - Add `payment_status` - Track payment type (paid, credit_30, credit_60)
  - Add `delivery_zone` - Lyon or France delivery zones
  - Add `delivery_time_slot` - Morning or afternoon
  - Add `admin_notes` - Admin validation notes
  - Add `validated_by` - Admin who validated
  - Add `validated_at` - Validation timestamp
  - Add `subtotal` - Products subtotal
  - Add `delivery_fee` - Shipping cost

  ### order_items
  - Add `total_price` - Line item total

  ## 2. New Tables

  ### delivery_tracking
  - Track deliveries with GPS for Lyon zone
  - Track shipping carriers for France zone
  - Real-time status updates

  ### notifications
  - System-wide notifications
  - Order updates, messages, delivery alerts

  ## 3. Security
  - Enable RLS on new tables
  - Add appropriate access policies
  - Buyers see their own data
  - Admins see everything
*/

-- Add columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'credit_30', 'credit_60'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal decimal(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee decimal(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_zone text CHECK (delivery_zone IN ('lyon', 'france'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_time_slot text CHECK (delivery_time_slot IN ('morning', 'afternoon'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES profiles(user_id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS validated_at timestamptz;

-- Add column to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_price decimal(10,2);

-- Create delivery_tracking table
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered')),
  tracking_number text,
  carrier text DEFAULT 'internal' CHECK (carrier IN ('internal', 'colissimo', 'chronopost')),
  current_location text,
  gps_latitude decimal(10,8),
  gps_longitude decimal(11,8),
  estimated_delivery timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('order_update', 'message', 'delivery', 'validation')),
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status ON delivery_tracking(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;

-- Enable RLS
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Delivery tracking policies
CREATE POLICY "Users can view delivery for their orders"
  ON delivery_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = delivery_tracking.order_id
      AND (orders.buyer_user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('admin', 'commercial')
      ))
    )
  );

CREATE POLICY "Admins can manage delivery tracking"
  ON delivery_tracking FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Notifications policies
CREATE POLICY "Users view their notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update their notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add admin policies for orders if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Admins view all orders'
  ) THEN
    CREATE POLICY "Admins view all orders"
      ON orders FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' AND policyname = 'Admins update all orders'
  ) THEN
    CREATE POLICY "Admins update all orders"
      ON orders FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;