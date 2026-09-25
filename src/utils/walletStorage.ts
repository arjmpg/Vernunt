import { UserWallet, WalletTransaction } from '../types.ts';

const WALLET_STORAGE_KEY = 'vernunt_user_wallet_state';

export const INITIAL_DEFAULT_WALLET: UserWallet = {
  balance: 750, // Initial welcome reward / credit in INR for testing wallet transactions
  transactions: [
    {
      id: 'tx-welcome-001',
      type: 'deposit',
      amount: 750,
      description: 'Welcome Bonus Credit (Vernunt Community)',
      timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      channel: 'App Checkout',
      status: 'Completed',
      referenceId: 'VERN-BONUS-WELCOME'
    }
  ],
  lastUpdated: new Date().toISOString()
};

/**
 * Retrieves the user's wallet from localStorage (offline-first persistence)
 */
export function getStoredWallet(): UserWallet {
  if (typeof window === 'undefined') return INITIAL_DEFAULT_WALLET;
  try {
    const raw = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_WALLET));
      return INITIAL_DEFAULT_WALLET;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed?.balance === 'number' && Array.isArray(parsed?.transactions)) {
      return parsed;
    }
    return INITIAL_DEFAULT_WALLET;
  } catch (err) {
    console.warn('Failed to parse stored wallet:', err);
    return INITIAL_DEFAULT_WALLET;
  }
}

/**
 * Saves updated wallet state to localStorage and fires a custom event for instant cross-component synchronization
 */
export function saveStoredWallet(wallet: UserWallet): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
    window.dispatchEvent(new CustomEvent('vernunt_wallet_updated', { detail: wallet }));
  } catch (err) {
    console.error('Failed to persist wallet:', err);
  }
}

/**
 * Deposits funds into user's wallet (e.g. after online top-up via UPI or Razorpay)
 */
export function depositToWallet(
  amount: number,
  channel: 'Razorpay' | 'UPI' | 'Bank Transfer' | 'App Checkout' = 'Razorpay',
  referenceId?: string,
  description?: string
): UserWallet {
  const current = getStoredWallet();
  const safeAmount = Math.max(0, Number(amount));
  const newTx: WalletTransaction = {
    id: `tx-dep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'deposit',
    amount: safeAmount,
    description: description || `Added funds via ${channel}`,
    timestamp: new Date().toISOString(),
    channel: channel,
    status: 'Completed',
    referenceId: referenceId || `DEP-${Date.now().toString().slice(-8)}`
  };

  const updated: UserWallet = {
    balance: Math.round((current.balance + safeAmount) * 100) / 100,
    transactions: [newTx, ...current.transactions].slice(0, 50),
    lastUpdated: new Date().toISOString()
  };

  saveStoredWallet(updated);
  return updated;
}

/**
 * Withdraws funds from user wallet (e.g. payout to host / parent UPI or bank account)
 */
export function withdrawFromWallet(
  amount: number,
  destination: string, // UPI ID or Bank Account
  method: 'UPI' | 'Bank Transfer' = 'UPI'
): { success: boolean; wallet: UserWallet; error?: string } {
  const current = getStoredWallet();
  const safeAmount = Math.max(0, Number(amount));

  if (safeAmount <= 0) {
    return { success: false, wallet: current, error: 'Please enter a valid withdrawal amount.' };
  }
  if (current.balance < safeAmount) {
    return { success: false, wallet: current, error: `Insufficient wallet balance. Available: ₹${current.balance}` };
  }

  const newTx: WalletTransaction = {
    id: `tx-wdr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'withdrawal',
    amount: safeAmount,
    description: `Payout withdrawal to ${destination} (${method})`,
    timestamp: new Date().toISOString(),
    channel: method,
    status: 'Completed',
    referenceId: `WDR-${Date.now().toString().slice(-8)}`
  };

  const updated: UserWallet = {
    balance: Math.round((current.balance - safeAmount) * 100) / 100,
    transactions: [newTx, ...current.transactions].slice(0, 50),
    lastUpdated: new Date().toISOString()
  };

  saveStoredWallet(updated);
  return { success: true, wallet: updated };
}

/**
 * Debits funds from user wallet for an in-app payment (Event ticket, menu, specialist, store)
 */
export function debitFromWallet(
  amount: number,
  purpose: string,
  referenceId?: string
): { success: boolean; debitedAmount: number; remainingNeeded: number; wallet: UserWallet } {
  const current = getStoredWallet();
  const safeAmount = Math.max(0, Number(amount));

  // Determine how much wallet can cover
  const debitedAmount = Math.min(current.balance, safeAmount);
  const remainingNeeded = safeAmount - debitedAmount;

  if (debitedAmount > 0) {
    const newTx: WalletTransaction = {
      id: `tx-deb-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'payment_debit',
      amount: debitedAmount,
      description: purpose,
      timestamp: new Date().toISOString(),
      channel: 'App Checkout',
      status: 'Completed',
      referenceId: referenceId || `PAY-${Date.now().toString().slice(-8)}`
    };

    const updated: UserWallet = {
      balance: Math.round((current.balance - debitedAmount) * 100) / 100,
      transactions: [newTx, ...current.transactions].slice(0, 50),
      lastUpdated: new Date().toISOString()
    };

    saveStoredWallet(updated);
    return { success: true, debitedAmount, remainingNeeded, wallet: updated };
  }

  return { success: true, debitedAmount: 0, remainingNeeded: safeAmount, wallet: current };
}
