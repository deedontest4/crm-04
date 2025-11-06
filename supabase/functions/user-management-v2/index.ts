import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserManagementRequest {
  action: 'create' | 'update' | 'updateRole' | 'resetPassword' | 'toggleStatus' | 'delete';
  userId?: string;
  userData?: {
    email?: string;
    password?: string;
    full_name?: string;
    role?: string;
    status?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('User management function called:', req.method);
    
    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Initialize regular client for user verification
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header and verify admin access
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify the user is authenticated and is an admin
    const token = authHeader.replace('Bearer ', '');
    console.log('Verifying token...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Authentication failed', details: authError.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!user) {
      console.error('No user found');
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('User authenticated:', user.id);

    // Check if user has admin or management role using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log('Profile lookup result:', { profile, profileError });

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to verify user permissions', details: profileError.message }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Allow admin and management roles to manage users
    const allowedRoles = ['admin', 'management'];
    if (!profile || !allowedRoles.includes(profile.role)) {
      console.error('Insufficient permissions. User role:', profile?.role);
      return new Response(JSON.stringify({ 
        error: 'Insufficient permissions. Admin or Management access required',
        userRole: profile?.role 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('User has sufficient permissions:', profile.role);

    const { action, userId, userData }: UserManagementRequest = await req.json();

    console.log(`User management action: ${action}`, { userId, userData });

    switch (action) {
      case 'create': {
        if (!userData?.email || !userData?.password || !userData?.full_name) {
          return new Response(JSON.stringify({ 
            error: 'Missing required fields: email, password, full_name' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Creating user with admin client...');

        // Create user in auth
        const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            full_name: userData.full_name
          }
        });

        if (createError) {
          console.error('Auth user creation error:', createError);
          
          // Handle specific auth errors with appropriate status codes
          const isEmailExists = createError.message?.includes('already been registered') || 
                                createError.status === 422;
          
          return new Response(JSON.stringify({ 
            error: isEmailExists 
              ? 'A user with this email address already exists' 
              : createError.message || 'Failed to create user',
            details: createError.message
          }), {
            status: isEmailExists ? 409 : 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Auth user created:', authUser.user.id);

        // Create or update profile (avoid duplicate-key if triggers also insert)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            user_id: authUser.user.id,
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role || 'employee',
            status: 'active'
          }, { onConflict: 'user_id' });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Try to cleanup the auth user if profile creation fails
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
          
          return new Response(JSON.stringify({ 
            error: 'Failed to create user profile',
            details: profileError.message
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log('Profile created successfully');

        return new Response(JSON.stringify({ 
          success: true, 
          user: authUser.user,
          message: 'User created successfully' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'update': {
        if (!userId || !userData) {
          return new Response(JSON.stringify({ 
            error: 'Missing userId or userData' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Update auth user if email changed
        if (userData.email) {
          const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            email: userData.email
          });
          if (updateAuthError) {
            return new Response(JSON.stringify({ 
              error: 'Failed to update user email',
              details: updateAuthError.message
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }

        // Update profile
        const updateData: any = {};
        if (userData.email) updateData.email = userData.email;
        if (userData.full_name) updateData.full_name = userData.full_name;
        if (userData.role) updateData.role = userData.role;
        
        updateData.updated_at = new Date().toISOString();

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update(updateData)
          .eq('user_id', userId);

        if (profileError) {
          return new Response(JSON.stringify({ 
            error: 'Failed to update user profile',
            details: profileError.message
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ 
          success: true,
          message: 'User updated successfully' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'updateRole': {
        if (!userId || !userData?.role) {
          return new Response(JSON.stringify({ 
            error: 'Missing userId or role' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ 
            role: userData.role,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) {
          return new Response(JSON.stringify({ 
            error: 'Failed to update user role',
            details: error.message
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ 
          success: true,
          message: 'Role updated successfully' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'resetPassword': {
        if (!userId || !userData?.password) {
          return new Response(JSON.stringify({ 
            error: 'Missing userId or password' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: userData.password
        });

        if (error) {
          return new Response(JSON.stringify({ 
            error: 'Failed to reset password',
            details: error.message
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ 
          success: true,
          message: 'Password reset successfully' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'toggleStatus': {
        if (!userId || !userData?.status) {
          return new Response(JSON.stringify({ 
            error: 'Missing userId or status' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Update profile status
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ 
            status: userData.status,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (profileError) {
          return new Response(JSON.stringify({ 
            error: 'Failed to update user status',
            details: profileError.message
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // If deactivating, also disable the auth user
        if (userData.status === 'inactive') {
          const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            ban_duration: 'none' // This effectively disables the user
          });
          if (authError) console.error('Error disabling auth user:', authError);
        }

        return new Response(JSON.stringify({ 
          success: true,
          message: `User ${userData.status === 'active' ? 'activated' : 'deactivated'} successfully` 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'delete': {
        if (!userId) {
          return new Response(JSON.stringify({ 
            error: 'Missing userId' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Delete from profiles first (cascade will handle auth.users)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('user_id', userId);

        if (profileError) {
          return new Response(JSON.stringify({ 
            error: 'Failed to delete user profile',
            details: profileError.message
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Delete from auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authError) {
          return new Response(JSON.stringify({ 
            error: 'Failed to delete user from authentication',
            details: authError.message
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ 
          success: true,
          message: 'User deleted successfully' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        return new Response(JSON.stringify({ 
          error: `Unknown action: ${action}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error: any) {
    console.error('User management error:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || 'Internal server error',
      details: error?.toString() || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});