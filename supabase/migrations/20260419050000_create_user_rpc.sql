-- Migration: Create RPC function to create users with service role
-- This allows super_admin users to create technician accounts

-- Enable the necessary extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a secure function to create auth users
-- This function runs with SECURITY DEFINER (as the owner) which has service role privileges
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_user_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  -- Generate UUID for the new user
  v_user_id := gen_random_uuid();
  
  -- Encrypt the password using the same method as Supabase Auth
  v_encrypted_password := crypt(p_password, gen_salt('bf'));
  
  -- Insert into auth.users table
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_user_id,
    p_email,
    v_encrypted_password,
    NOW(), -- Email confirmed automatically
    '{"provider":"email","providers":["email"]}'::jsonb,
    p_user_metadata,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
  
  -- Insert into auth.identities for the user
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', p_email),
    'email',
    NOW(),
    NOW()
  );
  
  RETURN QUERY SELECT v_user_id, p_email, NOW()::timestamptz;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_create_user(TEXT, TEXT, JSONB) TO authenticated;

-- Add RLS policy to ensure only super_admin can execute
-- Note: The actual permission check should be done in the application layer
-- This function trusts that the application has verified the user is super_admin

COMMENT ON FUNCTION public.admin_create_user IS 
'Creates a new auth user with the given email and password. 
Requires the caller to be authenticated. 
Should only be called after verifying the user has super_admin privileges in the application.';
