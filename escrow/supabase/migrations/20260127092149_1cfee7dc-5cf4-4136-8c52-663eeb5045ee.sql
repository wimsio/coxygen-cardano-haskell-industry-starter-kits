-- Create escrow status enum
CREATE TYPE public.escrow_status AS ENUM ('active', 'completed', 'refunded', 'disputed');

-- Create escrow transaction type enum
CREATE TYPE public.escrow_tx_type AS ENUM ('funded', 'released', 'refunded');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  wallet_address TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create escrows table matching Plutus contract datum
CREATE TABLE public.escrows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_address TEXT NOT NULL,
  seller_address TEXT NOT NULL,
  amount BIGINT NOT NULL, -- Amount in Lovelace
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status escrow_status NOT NULL DEFAULT 'active',
  description TEXT,
  script_address TEXT, -- On-chain script address once deployed
  datum_hash TEXT, -- Hash of the on-chain datum
  buyer_user_id UUID REFERENCES auth.users(id),
  seller_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create escrow transactions table
CREATE TABLE public.escrow_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escrow_id UUID REFERENCES public.escrows(id) ON DELETE CASCADE NOT NULL,
  tx_type escrow_tx_type NOT NULL,
  tx_hash TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT,
  amount BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Escrows policies (participants can view their escrows)
CREATE POLICY "Participants can view escrows"
  ON public.escrows FOR SELECT
  USING (
    auth.uid() = buyer_user_id OR 
    auth.uid() = seller_user_id OR
    buyer_address IN (SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid()) OR
    seller_address IN (SELECT wallet_address FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create escrows"
  ON public.escrows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = buyer_user_id);

CREATE POLICY "Buyer can update escrow status"
  ON public.escrows FOR UPDATE
  USING (auth.uid() = buyer_user_id);

-- Escrow transactions policies
CREATE POLICY "Participants can view transactions"
  ON public.escrow_transactions FOR SELECT
  USING (
    escrow_id IN (
      SELECT id FROM public.escrows 
      WHERE auth.uid() = buyer_user_id OR auth.uid() = seller_user_id
    )
  );

CREATE POLICY "Authenticated users can insert transactions"
  ON public.escrow_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    escrow_id IN (
      SELECT id FROM public.escrows 
      WHERE auth.uid() = buyer_user_id OR auth.uid() = seller_user_id
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_escrows_updated_at
  BEFORE UPDATE ON public.escrows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();