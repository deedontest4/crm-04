import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
export default function AuthPage() {
  const {
    user,
    signIn,
    loading: authLoading
  } = useAuth();
  const [loading, setLoading] = useState(false);

  // Debug logging
  console.log('AuthPage render:', { user: !!user, authLoading, loading });

  // Redirect if already authenticated
  if (user && !authLoading) {
    console.log('User authenticated, redirecting to /');
    return <Navigate to="/" replace />;
  }
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        throw signInError;
      }

      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status')
        .eq('email', email)
        .maybeSingle();

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error("Invalid credentials");
      }

      if (!profile) {
        await supabase.auth.signOut();
        throw new Error("Invalid credentials");
      }

      if (profile.status !== 'active') {
        await supabase.auth.signOut();
        throw new Error("Your account has been disabled. Please contact your administrator for more details.");
      }

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully."
      });
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive"
      });
    }
    setLoading(false);
  };
  if (authLoading) {
    console.log('Auth still loading, showing spinner');
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }

  console.log('Rendering auth form');
  return <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary rounded-lg p-3">
              <img src="/lovable-uploads/54adcce8-be73-4135-bb3c-fb8fd83846cf.png" alt="Logo" className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">IT Management System</h1>
          
        </div>

        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle>Welcome</CardTitle>
            
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" name="email" type="email" placeholder="Enter your email" required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" name="password" type="password" placeholder="Enter your password" required disabled={loading} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </> : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-muted-foreground">
          
        </div>
      </div>
    </div>;
}