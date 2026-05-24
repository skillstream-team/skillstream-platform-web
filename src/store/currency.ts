import { create } from 'zustand';
import { hasSupabaseConfig, supabase } from '../lib/supabase';

const STORAGE_KEY = 'skillstream_platform_currency';
const DEFAULT_CURRENCY = 'USD';

export const SUPPORTED_CURRENCIES: Array<{ code: string; name: string }> = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'CHF', name: 'Swiss Franc' },
];

interface CurrencyState {
  currency: string;
}
interface CurrencyActions {
  loadCurrency: () => Promise<void>;
  setCurrency: (code: string) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState & CurrencyActions>((set) => ({
  currency: DEFAULT_CURRENCY,

  loadCurrency: async () => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (stored) {
      set({ currency: stored });
      return;
    }
    if (!hasSupabaseConfig) return;
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'platformCurrency')
      .maybeSingle();
    if (data?.value && typeof data.value === 'string') {
      set({ currency: data.value });
      localStorage.setItem(STORAGE_KEY, data.value);
    }
  },

  setCurrency: async (code: string) => {
    set({ currency: code });
    localStorage.setItem(STORAGE_KEY, code);
    if (!hasSupabaseConfig) return;
    await supabase
      .from('platform_settings')
      .upsert({ key: 'platformCurrency', value: code }, { onConflict: 'key' });
  },
}));
