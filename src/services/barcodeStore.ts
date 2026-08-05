import { Preferences } from '@capacitor/preferences';
import { reactive, readonly } from 'vue';

export type BarcodeEntry = {
  id: string;
  displayValue: string;
  format: string;
  valueType: string;
  timestamp: number;
  raw?: Record<string, unknown>;
};

const state = reactive({
  barcodes: [] as BarcodeEntry[],
});

const STORAGE_KEY = 'barcode-scanner-barcodes';

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function persistBarcodes(): Promise<void> {
  await Preferences.set({
    key: STORAGE_KEY,
    value: JSON.stringify(state.barcodes),
  });
}

export async function loadBarcodes(): Promise<void> {
  const storedValue = await Preferences.get({ key: STORAGE_KEY });

  if (!storedValue.value) {
    state.barcodes.splice(0, state.barcodes.length);
    return;
  }

  try {
    const parsed = JSON.parse(storedValue.value);
    if (!Array.isArray(parsed)) {
      state.barcodes.splice(0, state.barcodes.length);
      return;
    }

    state.barcodes.splice(0, state.barcodes.length, ...parsed);
  } catch (error) {
    console.warn('Failed to load stored barcodes', error);
    state.barcodes.splice(0, state.barcodes.length);
  }
}

export async function addBarcode(entry: Omit<BarcodeEntry, 'id' | 'timestamp'>): Promise<BarcodeEntry> {
  const barcode: BarcodeEntry = {
    ...entry,
    id: createId(),
    timestamp: Date.now(),
  };
  state.barcodes.unshift(barcode);
  await persistBarcodes();
  return barcode;
}

export async function removeBarcode(id: string): Promise<void> {
  const index = state.barcodes.findIndex((barcode) => barcode.id === id);
  if (index === -1) {
    return;
  }

  state.barcodes.splice(index, 1);
  await persistBarcodes();
}

export function getBarcodes(): BarcodeEntry[] {
  return readonly(state.barcodes) as BarcodeEntry[];
}

export const barcodeStore = {
  state: readonly(state),
  loadBarcodes,
  getBarcodes,
  addBarcode,
  removeBarcode,
};
