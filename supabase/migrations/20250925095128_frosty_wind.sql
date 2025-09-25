/*
  # Add Hostel Management and Meal Attendance Features

  1. New Tables
    - `hostels` - Hostel information
    - `meal_attendance_settings` - System settings for attendance requirements
    - `payment_gateways` - Dynamic payment gateway configuration
    - `meal_attendance_reminders` - Track reminder notifications

  2. Modified Tables
    - `students` - Add hostel information and day scholar flag
    - `packages` - Add hostel assignments
    - `notifications` - Add action type for navigation

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for each table

  4. New Features
    - Mandatory meal attendance marking
    - Hostel-based package filtering
    - Dynamic payment gateway keys
    - Enhanced notification system
*/

-- Create hostels table
CREATE TABLE IF NOT EXISTS hostels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  capacity integer DEFAULT 0,
  mess_facility_id uuid,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create meal attendance settings table
CREATE TABLE IF NOT EXISTS meal_attendance_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_mandatory boolean DEFAULT false,
  reminder_start_time text DEFAULT '15:00',
  reminder_end_time text DEFAULT '22:00',
  cutoff_time text DEFAULT '23:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payment gateways table
CREATE TABLE IF NOT EXISTS payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  test_key_id text,
  test_key_secret text,
  live_key_id text,
  live_key_secret text,
  webhook_secret text,
  is_live boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create meal attendance reminders table
CREATE TABLE IF NOT EXISTS meal_attendance_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  reminder_date date NOT NULL,
  notification_sent_at timestamptz,
  marked_attendance boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add new columns to students table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'is_hosteler'
  ) THEN
    ALTER TABLE students ADD COLUMN is_hosteler boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'hostel_id'
  ) THEN
    ALTER TABLE students ADD COLUMN hostel_id uuid;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'students' AND column_name = 'mess_name'
  ) THEN
    ALTER TABLE students ADD COLUMN mess_name text;
  END IF;
END $$;

-- Add hostel assignments to packages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'packages' AND column_name = 'hostel_ids'
  ) THEN
    ALTER TABLE packages ADD COLUMN hostel_ids uuid[] DEFAULT '{}';
  END IF;
END $$;

-- Add action type to notifications for navigation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'action_type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN action_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'action_data'
  ) THEN
    ALTER TABLE notifications ADD COLUMN action_data jsonb;
  END IF;
END $$;

-- Add SUPERADMIN role if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'SUPERADMIN'
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'SUPERADMIN';
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_attendance_reminders ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'hostels_mess_facility_id_fkey'
  ) THEN
    ALTER TABLE hostels ADD CONSTRAINT hostels_mess_facility_id_fkey 
    FOREIGN KEY (mess_facility_id) REFERENCES mess_facilities(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'students_hostel_id_fkey'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT students_hostel_id_fkey 
    FOREIGN KEY (hostel_id) REFERENCES hostels(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'meal_attendance_reminders_student_id_fkey'
  ) THEN
    ALTER TABLE meal_attendance_reminders ADD CONSTRAINT meal_attendance_reminders_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create RLS policies for hostels
CREATE POLICY "Users can view hostels" ON hostels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage hostels" ON hostels FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' IN ('ADMIN', 'SUPERADMIN', 'FNB_MANAGER'));

-- Create RLS policies for meal attendance settings
CREATE POLICY "Users can view attendance settings" ON meal_attendance_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage attendance settings" ON meal_attendance_settings FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' IN ('ADMIN', 'SUPERADMIN'));

-- Create RLS policies for payment gateways
CREATE POLICY "Admins can view payment gateways" ON payment_gateways FOR SELECT TO authenticated 
USING (auth.jwt() ->> 'role' IN ('ADMIN', 'SUPERADMIN'));
CREATE POLICY "Admins can manage payment gateways" ON payment_gateways FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' IN ('ADMIN', 'SUPERADMIN'));

-- Create RLS policies for meal attendance reminders
CREATE POLICY "Students can view own reminders" ON meal_attendance_reminders FOR SELECT TO authenticated 
USING (student_id::text = auth.jwt() ->> 'studentId');
CREATE POLICY "System can manage reminders" ON meal_attendance_reminders FOR ALL TO authenticated USING (true);

-- Insert default data
INSERT INTO meal_attendance_settings (is_mandatory, reminder_start_time, reminder_end_time, cutoff_time)
VALUES (false, '15:00', '22:00', '23:00')
ON CONFLICT DO NOTHING;

INSERT INTO payment_gateways (provider, test_key_id, test_key_secret, is_live, active)
VALUES ('razorpay', 'rzp_test_default', 'test_secret_default', false, true)
ON CONFLICT DO NOTHING;

-- Insert sample hostels
INSERT INTO hostels (id, name, location, capacity, active) VALUES
('hostel-001', 'Girls Hostel - Nursing', 'Campus North Block', 300, true),
('hostel-002', 'Boys Hostel - Nursing', 'Campus South Block', 250, true),
('hostel-003', 'Gowthami Hostel', 'Campus East Block', 200, true)
ON CONFLICT DO NOTHING;