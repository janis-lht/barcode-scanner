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

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function addBarcode(entry: Omit<BarcodeEntry, 'id' | 'timestamp'>): Promise<BarcodeEntry> {
  const barcode: BarcodeEntry = {
    ...entry,
    id: createId(),
    timestamp: Date.now(),
  };
  state.barcodes.unshift(barcode);
  return barcode;
}

export function getBarcodes(): BarcodeEntry[] {
  return readonly(state.barcodes) as BarcodeEntry[];
}

export const barcodeStore = {
  state: readonly(state),
  getBarcodes,
  addBarcode,
};
