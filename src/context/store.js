import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Profile store - persisted to localStorage
export const useProfileStore = create(
  persist(
    (set, get) => ({
      profile: {
        fullName: '',
        address: '',
        phone: '',
        email: '',
        driverName: '',
        vehicleNumber: '',
      },
      isProfileComplete: () => {
        const { profile } = get();
        return profile.fullName && profile.address;
      },
      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),
      resetProfile: () =>
        set({
          profile: {
            fullName: '',
            address: '',
            phone: '',
            email: '',
            driverName: '',
            vehicleNumber: '',
          },
        }),
    }),
    {
      name: 'billgen-profile',
    }
  )
);

// Access store - persisted to localStorage
export const useAccessStore = create(
  persist(
    (set, get) => ({
      email: null,
      isValidated: false,
      lastValidated: null,
      gracePeriodHours: 24,

      setAccess: (email) =>
        set({
          email,
          isValidated: true,
          lastValidated: Date.now(),
        }),

      clearAccess: () =>
        set({
          email: null,
          isValidated: false,
          lastValidated: null,
        }),

      isWithinGracePeriod: () => {
        const { lastValidated, gracePeriodHours } = get();
        if (!lastValidated) return false;
        const hoursSinceValidation = (Date.now() - lastValidated) / (1000 * 60 * 60);
        return hoursSinceValidation < gracePeriodHours;
      },
    }),
    {
      name: 'billgen-access',
    }
  )
);

// Template defaults store - persisted to localStorage
export const useTemplateDefaultsStore = create(
  persist(
    (set, get) => ({
      defaults: {},

      getDefaults: (templateId) => {
        const { defaults } = get();
        return defaults[templateId] || {};
      },

      saveDefaults: (templateId, values) =>
        set((state) => ({
          defaults: {
            ...state.defaults,
            [templateId]: { ...state.defaults[templateId], ...values },
          },
        })),

      clearDefaults: (templateId) =>
        set((state) => {
          const newDefaults = { ...state.defaults };
          delete newDefaults[templateId];
          return { defaults: newDefaults };
        }),
    }),
    {
      name: 'billgen-defaults',
    }
  )
);

// UI store - not persisted
export const useUIStore = create((set) => ({
  isExporting: false,
  exportFormat: 'pdf',
  showOnboarding: false,

  setExporting: (isExporting) => set({ isExporting }),
  setExportFormat: (exportFormat) => set({ exportFormat }),
  setShowOnboarding: (showOnboarding) => set({ showOnboarding }),
}));
