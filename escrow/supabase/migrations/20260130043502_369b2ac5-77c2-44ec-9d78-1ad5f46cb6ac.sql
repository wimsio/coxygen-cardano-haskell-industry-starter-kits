-- Update handle_new_user function with explicit validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate that user ID is not null
  IF NEW.id IS NULL THEN
    RAISE EXCEPTION 'Invalid user ID: cannot be null';
  END IF;
  
  -- Insert profile for the new user
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;