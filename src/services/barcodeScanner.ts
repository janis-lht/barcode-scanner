import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { barcodeFormatToLabel, barcodeValueTypeName } from '../utils/barcodeHelpers';
import type { BarcodeEntry } from './barcodeStore';

function normalizeBarcode(result: any): Omit<BarcodeEntry, 'id' | 'timestamp'> {
  const formatLabel = barcodeFormatToLabel(result.format);
  const valueTypeName = barcodeValueTypeName(result.valueType);

  return {
    displayValue: result.displayValue ?? String(result.rawValue ?? ''),
    format: formatLabel,
    valueType: valueTypeName,
    raw: result,
  };
}

async function requestCameraPermission(): Promise<boolean> {
  try {
    const checkResult = await BarcodeScanner.checkPermissions();
    if (checkResult.camera === 'granted') {
      return true;
    }

    const result = await BarcodeScanner.requestPermissions();
    return result.camera === 'granted';
  } catch (error) {
    console.warn('Permission request failed', error);
    return false;
  }
}

export async function scanWithCamera(): Promise<Array<Omit<BarcodeEntry, 'id' | 'timestamp'>>> {
  const permission = await requestCameraPermission();
  if (!permission) {
    return [];
  }

  const availableResult = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
  if (!availableResult.available) {
    await BarcodeScanner.installGoogleBarcodeScannerModule();
  }

  const result = await BarcodeScanner.scan();
  if (!result || !result.barcodes || result.barcodes.length === 0) {
    return [];
  }

  Haptics.impact({ style: ImpactStyle.Medium });
  return result.barcodes.map(normalizeBarcode);
}

export async function scanFromGallery(): Promise<Array<Omit<BarcodeEntry, 'id' | 'timestamp'>>> {
  const selection = await FilePicker.pickFiles({ limit: 1, types: ['image/*'] });
  if (!selection || !selection.files || selection.files.length === 0) {
    return [];
  }

  const file = selection.files[0];
  const imagePath = file.path;
  if (!imagePath) {
    return [];
  }

  const readResult = await BarcodeScanner.readBarcodesFromImage({ path: imagePath });
  if (!readResult || !readResult.barcodes || readResult.barcodes.length === 0) {
    return [];
  }

  Haptics.impact({ style: ImpactStyle.Medium });

  return readResult.barcodes.map(normalizeBarcode);
}
