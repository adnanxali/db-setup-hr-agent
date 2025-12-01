import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/browser-client';
import { User, Job, CandidateProfile, RecruiterProfile, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  candidateProfile: CandidateProfile | null;
  recruiterProfile: RecruiterProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface UIState {
  // Modals
  isApplyModalOpen: boolean;
  selectedJobForApply: Job | null;
  isProfileModalOpen: boolean;
  
  // Navigation
  sidebarOpen: boolean;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    timestamp: number;
  }>;
}

interface AppState extends AuthState, UIState {
  // Auth actions
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<void>;
  
  // Profile actions
  fetchProfiles: () => Promise<void>;
  
  // UI actions
  openApplyModal: (job: Job) => void;
  closeApplyModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  toggleSidebar: () => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      candidateProfile: null,
      recruiterProfile: null,
      isLoading: true,
      isAuthenticated: false,
      isApplyModalOpen: false,
      selectedJobForApply: null,
      isProfileModalOpen: false,
      sidebarOpen: false,
      notifications: [],

      // Auth actions
      fetchUser: async () => {
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            // Fetch user from our users table
            const { data: user, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (error) {
              console.error('Error fetching user:', error);
              set({ user: null, isAuthenticated: false, isLoading: false });
              return;
            }

            set({ 
              user: user as User, 
              isAuthenticated: true, 
              isLoading: false 
            });

            // Fetch profiles based on role
            get().fetchProfiles();
          } else {
            set({ 
              user: null, 
              candidateProfile: null,
              recruiterProfile: null,
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        } catch (error) {
          console.error('Error in fetchUser:', error);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      fetchProfiles: async () => {
        const { user } = get();
        if (!user) return;

        const supabase = createClient();

        if (user.role === 'candidate') {
          const { data: profile } = await supabase
            .from('candidate_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          set({ candidateProfile: profile as CandidateProfile });
        } else if (user.role === 'recruiter') {
          const { data: profile } = await supabase
            .from('recruiter_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          set({ recruiterProfile: profile as RecruiterProfile });
        }
      },

      updateUserRole: async (role: UserRole) => {
        const { user } = get();
        if (!user) return;

        const supabase = createClient();
        const { data, error } = await supabase
          .from('users')
          .update({ role })
          .eq('id', user.id)
          .select()
          .single();

        if (error) {
          get().addNotification({
            type: 'error',
            message: 'Failed to update role'
          });
          return;
        }

        set({ user: data as User });
        get().fetchProfiles();
      },

      logout: async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        set({ 
          user: null, 
          candidateProfile: null,
          recruiterProfile: null,
          isAuthenticated: false,
          isLoading: false
        });
      },

      // UI actions
      openApplyModal: (job) => set({ isApplyModalOpen: true, selectedJobForApply: job }),
      closeApplyModal: () => set({ isApplyModalOpen: false, selectedJobForApply: null }),
      openProfileModal: () => set({ isProfileModalOpen: true }),
      closeProfileModal: () => set({ isProfileModalOpen: false }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9);
        const timestamp = Date.now();
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id, timestamp }]
        }));

        // Auto-remove after 5 seconds
        setTimeout(() => {
          get().removeNotification(id);
        }, 5000);
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },

      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'app-store',
    }
  )
);