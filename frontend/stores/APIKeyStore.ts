import { create, Mutate, StoreApi } from "zustand";
import { persist } from "zustand/middleware";

export const PROVIDERS = ["google", "openrouter", "openai"] as const;
export type Provider = (typeof PROVIDERS)[number];

type APIKeys = Record<Provider, string>;

type APIKeyStore = {
  keys: APIKeys;
  setKeys: (newKeys: Partial<APIKeys>) => void;
  hasRequiredKeys: () => boolean;
  getKey: (provider: Provider) => string | null;
};

type StoreWithPersist = Mutate<
  StoreApi<APIKeyStore>,
  [["zustand/persist", { keys: APIKeys }]]
>;

export const withStorageDOMEvents = (store: StoreWithPersist) => {
  const storageEventCallback = (e: StorageEvent) => {
    if (e.key === store.persist.getOptions().name && e.newValue) {
      store.persist.rehydrate();
    }
  };

  window.addEventListener("storage", storageEventCallback);

  return () => {
    window.removeEventListener("storage", storageEventCallback);
  };
};

export const useAPIKeyStore = create<APIKeyStore>()(
  persist(
    (set, get) => ({
      keys: {
        google: process.env.GOOGLE_API_KEY!,
        openrouter: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY!,
        openai: process.env.OPENAI_API_KEY!,
      },

      setKeys: (newKeys) => {
        set((state) => ({
          keys: { ...state.keys, ...newKeys },
        }));
      },

      hasRequiredKeys: () => {
        return true;
      },

      getKey: (provider) => {
        const key = get().keys[provider];
        return key ? key : null;
      },
    }),
    {
      name: "api-keys",
      partialize: (state) => ({ keys: state.keys }),
    }
  )
);

withStorageDOMEvents(useAPIKeyStore);
