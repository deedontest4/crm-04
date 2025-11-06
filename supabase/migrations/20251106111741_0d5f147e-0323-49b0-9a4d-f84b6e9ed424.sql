-- Create subscriptions table for tracking tool subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  category TEXT NOT NULL,
  cost NUMERIC,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  renewal_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  seats_total INTEGER,
  seats_used INTEGER DEFAULT 0,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "Tech leads and above can view subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  has_role(auth.uid(), 'management'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Tech leads and admins can manage subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (
  has_role(auth.uid(), 'tech_lead'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_subscriptions_renewal_date ON public.subscriptions(renewal_date);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);