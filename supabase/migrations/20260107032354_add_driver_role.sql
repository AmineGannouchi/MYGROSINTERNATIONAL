/*
  # Add Driver Role

  ## Overview
  Adds 'driver' role to the user_role enum for delivery drivers

  ## Changes
  - Add 'driver' to user_role enum type
*/

-- Add driver role to user_role enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'driver' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'driver';
  END IF;
END $$;