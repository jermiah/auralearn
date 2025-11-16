import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabase';

export type UserRole = 'teacher' | 'parent';

export type SubjectType = 
  | 'francais'
  | 'langues_vivantes'
  | 'arts_plastiques'
  | 'education_musicale'
  | 'histoire_des_arts'
  | 'education_physique_sportive'
  | 'enseignement_moral_civique'
  | 'histoire_geographie'
  | 'sciences_technologie'
  | 'mathematiques';

export type GradeLevelType = 'CM1' | 'CM2';

export interface UserProfile {
  id: string;
  clerk_id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  primary_subject?: SubjectType;
  primary_grade_level?: GradeLevelType;
  school_name?: string;
  onboarding_completed?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isTeacher: boolean;
  isParent: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrCreateUserProfile = async () => {
    if (!clerkUser) {
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const clerkId = clerkUser.id;
      const email = clerkUser.primaryEmailAddress?.emailAddress || '';

      // Check if user exists in Supabase
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', clerkId)
        .single();

      if (existingUser) {
        setUserProfile(existingUser as UserProfile);
        setIsLoading(false);
        return;
      }

      // User doesn't exist, determine role based on metadata or default to teacher
      const role = (clerkUser.publicMetadata?.role as UserRole) || 'teacher';

      // Create new user in Supabase
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_id: clerkId,
          email,
          role,
          full_name: clerkUser.fullName || undefined,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user in Supabase:', createError);
        setIsLoading(false);
        return;
      }

      setUserProfile(newUser as UserProfile);
      setIsLoading(false);
    } catch (error) {
      console.error('Error in fetchOrCreateUserProfile:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchOrCreateUserProfile();
    }
  }, [clerkUser, isLoaded]);

  const handleSignOut = async () => {
    await clerkSignOut();
    setUserProfile(null);
  };

  const value: AuthContextType = {
    user: userProfile,
    isLoading: !isLoaded || isLoading,
    isTeacher: userProfile?.role === 'teacher',
    isParent: userProfile?.role === 'parent',
    signOut: handleSignOut,
    refreshUser: fetchOrCreateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
