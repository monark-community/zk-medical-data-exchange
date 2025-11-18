import { create } from "zustand";

interface BlockchainTxStatusState {
  message: string | null;
  error: string | null;
  isVisible: boolean;
  // eslint-disable-next-line no-unused-vars
  show: (message: string) => void;
  // eslint-disable-next-line no-unused-vars
  showError: (error: string) => void;
  hide: () => void;
}

export const useTxStatusState = create<BlockchainTxStatusState>((set) => ({
  message: null,
  error: null,
  isVisible: false,

  show: (message: string) => {
    set({ message, error: null, isVisible: true });
  },

  showError: (error: string) => {
    set({ error, message: null, isVisible: true });
  },

  hide: () => {
    set({ isVisible: false });
    // Clear after animation
    setTimeout(() => {
      set({ message: null, error: null });
    }, 300);
  },
}));
