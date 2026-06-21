import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

function storageWithLegacy(legacyKey) {
  return createJSONStorage(() => ({
    getItem: (name) => {
      let s = localStorage.getItem(name);
      if (!s) {
        s = localStorage.getItem(legacyKey);
        if (s) {
          localStorage.setItem(name, s);
          localStorage.removeItem(legacyKey);
        }
      }
      return s;
    },
    setItem: (name, value) => localStorage.setItem(name, value),
    removeItem: (name) => localStorage.removeItem(name),
  }));
}

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
      name: 'ravenlog-profile',
      storage: storageWithLegacy('billgen-profile'),
    }
  )
);

// Access store - persisted to localStorage
export const useAccessStore = create(
  persist(
    (set, get) => ({
      email: null,
      googleId: null,
      isValidated: false,
      lastValidated: null,

      tier: 1,
      downloadsUsed: 0,
      downloadsLimit: 3,
      isSubscribed: false,
      subscribedUntil: null,
      daysRemaining: null,
      renewalDue: false,
      tier3AckAccepted: false,

      setAccess: (email, extra = {}) =>
        set((state) => {
          const sameSession = state.email === email && state.googleId === (extra.googleId ?? state.googleId);
          return {
            email,
            googleId: extra.googleId ?? null,
            isValidated: true,
            lastValidated: Date.now(),
            tier: extra.tier ?? 1,
            downloadsUsed: extra.downloadsUsed ?? 0,
            downloadsLimit: extra.downloadsLimit ?? 3,
            isSubscribed: extra.isSubscribed ?? false,
            subscribedUntil: extra.subscribedUntil ?? null,
            daysRemaining: extra.daysRemaining ?? null,
            renewalDue: extra.renewalDue ?? false,
            tier3AckAccepted:
              extra.tier3AckAccepted !== undefined
                ? !!extra.tier3AckAccepted
                : sameSession
                  ? state.tier3AckAccepted
                  : false,
          };
        }),

      updateTier3Ack: (accepted) => set({ tier3AckAccepted: !!accepted }),

      updateDownloads: (downloadsUsed, requiresSubscription) =>
        set({ downloadsUsed, ...(requiresSubscription !== undefined ? { isSubscribed: !requiresSubscription } : {}) }),

      updateSubscription: (fields) =>
        set({
          isSubscribed: fields.isSubscribed ?? get().isSubscribed,
          subscribedUntil: fields.subscribedUntil ?? get().subscribedUntil,
          daysRemaining: fields.daysRemaining ?? get().daysRemaining,
          renewalDue: fields.renewalDue ?? get().renewalDue,
        }),

      clearAccess: () =>
        set({
          email: null,
          googleId: null,
          isValidated: false,
          lastValidated: null,
          tier: 1,
          downloadsUsed: 0,
          downloadsLimit: 3,
          isSubscribed: false,
          subscribedUntil: null,
          daysRemaining: null,
          renewalDue: false,
          tier3AckAccepted: false,
        }),

      needsSubscription: () => {
        const { downloadsUsed, downloadsLimit, isSubscribed } = get();
        return downloadsUsed >= downloadsLimit && !isSubscribed;
      },
    }),
    {
      name: 'ravenlog-access',
      storage: storageWithLegacy('billgen-access'),
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
      name: 'ravenlog-defaults',
      storage: storageWithLegacy('billgen-defaults'),
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
