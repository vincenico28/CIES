import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserRoleData {
  role: AppRole;
  loading: boolean;
  isResident: boolean;
  isStaff: boolean;
  isCaptain: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isStaffOrHigher: boolean;
  isCaptainOrHigher: boolean;
  isAdminOrHigher: boolean;
}

export function useUserRole(): UserRoleData {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole>('resident');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setRole('resident');
      setLoading(false);
      return;
    }

    fetchUserRole();
  }, [user, authLoading]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user role:', error);
        setRole('resident');
      } else if (data) {
        setRole(data.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('resident');
    } finally {
      setLoading(false);
    }
  };

  const isResident = role === 'resident';
  const isStaff = role === 'staff';
  const isCaptain = role === 'captain';
  const isAdmin = role === 'admin';
  const isSuperAdmin = role === 'super_admin';
  const isStaffOrHigher = ['staff', 'captain', 'admin', 'super_admin'].includes(role);
  const isCaptainOrHigher = ['captain', 'admin', 'super_admin'].includes(role);
  const isAdminOrHigher = ['admin', 'super_admin'].includes(role);

  return {
    role,
    loading: loading || authLoading,
    isResident,
    isStaff,
    isCaptain,
    isAdmin,
    isSuperAdmin,
    isStaffOrHigher,
    isCaptainOrHigher,
    isAdminOrHigher,
  };
}