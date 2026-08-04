export function barcodeFormatToLabel(format: unknown): string {
  if (format === undefined || format === null) {
    return 'UNKNOWN';
  }

  return String(format).replace(/_/g, ' ');
}

export function barcodeValueTypeName(valueType: unknown): string {
  if (valueType === undefined || valueType === null) {
    return 'UNKNOWN';
  }

  return String(valueType).replace(/_/g, ' ');
}

export function isBarcodeOpenable(valueTypeName: string): boolean {
  return valueTypeName === 'URL' || valueTypeName === 'PHONE';
}
