<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Barcode Scanner</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding barcode-page" :fullscreen="true">
      <section class="hero">
        <ion-label>
          <h2>Barcodes scannen und verwalten</h2>
          <p>
            Scanne neue Barcodes mit Kamera oder Galerie. Gespeicherte Einträge bleiben nach einem
            Neustart erhalten und können direkt geteilt, kopiert, geöffnet oder gelöscht werden.
          </p>
        </ion-label>
      </section>

      <ion-card class="scan-card">
        <ion-card-content>
          <div class="scan-actions">
            <ion-button expand="block" @click="scanWithCameraAction">Scan mit Kamera</ion-button>
            <ion-button expand="block" fill="outline" @click="scanFromGalleryAction">
              Scan aus Galerie
            </ion-button>
          </div>
          <p class="scan-count">
            {{ barcodes.length }} {{ barcodes.length === 1 ? 'gespeicherter Barcode' : 'gespeicherte Barcodes' }}
          </p>
        </ion-card-content>
      </ion-card>

      <ion-card class="list-card">
        <ion-card-header>
          <ion-card-title>Gespeicherte Barcodes</ion-card-title>
          <ion-card-subtitle>
            Wert, Format, Werttyp und alle verfügbaren Aktionen pro Eintrag
          </ion-card-subtitle>
        </ion-card-header>

        <ion-card-content>
          <div v-if="barcodes.length === 0" class="empty-state">
            Noch keine Barcodes gespeichert.
          </div>

          <ion-list v-else lines="full" class="barcode-list">
            <ion-item-sliding v-for="barcode in barcodes" :key="barcode.id" class="barcode-item">
              <ion-item class="barcode-item-content">
                <ion-label class="ion-text-wrap barcode-label">
                  <h3>{{ barcode.displayValue || 'Ohne Wert' }}</h3>
                  <p>Format: {{ barcode.format }}</p>
                  <p>Werttyp: {{ barcode.valueType }}</p>
                </ion-label>
              </ion-item>

              <ion-item-options side="start">
                <ion-item-option v-if="isOpenable(barcode)" class="action-option action-option-open" aria-label="Öffnen" @click="openBarcode(barcode)">
                  <ion-icon :icon="openOutline" class="action-icon" />
                </ion-item-option>
                <ion-item-option class="action-option action-option-share" aria-label="Teilen" @click="shareBarcode(barcode)">
                  <ion-icon :icon="shareOutline" class="action-icon" />
                </ion-item-option>
              </ion-item-options>

              <ion-item-options side="end">
                <ion-item-option class="action-option action-option-copy" aria-label="Kopieren" @click="copyBarcode(barcode)">
                  <ion-icon :icon="copyOutline" class="action-icon" />
                </ion-item-option>
                <ion-item-option color="danger" class="action-option action-option-delete" aria-label="Löschen" @click="deleteBarcode(barcode)">
                  <ion-icon :icon="trashOutline" class="action-icon" />
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <ion-toast
        :is-open="toastOpen"
        :message="toastMessage"
        duration="2200"
        @didDismiss="toastOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonPage,
  IonIcon,
  IonTitle,
  IonToolbar,
  IonToast,
} from '@ionic/vue';
import { copyOutline, openOutline, shareOutline, trashOutline } from 'ionicons/icons';
import { Clipboard } from '@capacitor/clipboard';
import { AppLauncher } from '@capacitor/app-launcher';
import { DefaultWebViewOptions, InAppBrowser } from '@capacitor/inappbrowser';
import { Share } from '@capacitor/share';
import { barcodeStore, type BarcodeEntry } from '../services/barcodeStore';
import { scanWithCamera, scanFromGallery } from '../services/barcodeScanner';
import { isBarcodeOpenable } from '../utils/barcodeHelpers';

const toastOpen = ref(false);
const toastMessage = ref('');
const barcodes = computed(() => barcodeStore.state.barcodes);

function showToast(message: string) {
  toastMessage.value = message;
  toastOpen.value = true;
}

function formatBarcodeText(barcode: BarcodeEntry): string {
  return `${barcode.displayValue}\nFormat: ${barcode.format}\nWerttyp: ${barcode.valueType}`;
}

function getClipboardValue(barcode: BarcodeEntry): string {
  if (barcode.valueType === 'URL') {
    return normalizeUrl(barcode.displayValue);
  }

  if (barcode.valueType === 'PHONE') {
    return `tel:${normalizePhone(barcode.displayValue)}`;
  }

  return barcode.displayValue;
}

function isOpenable(barcode: BarcodeEntry): boolean {
  return isBarcodeOpenable(barcode.valueType);
}

function normalizeUrl(value: string): string {
  const trimmedValue = value.trim();
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmedValue)) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
}

function normalizePhone(value: string): string {
  return value.trim().replace(/\s+/g, '');
}

async function scanWithCameraAction() {
  try {
    const results = await scanWithCamera();
    if (!results || results.length === 0) {
      showToast('Scan abgebrochen oder kein Barcode gefunden.');
      return;
    }

    for (const result of results) {
      await barcodeStore.addBarcode(result);
    }

    showToast(`${results.length} Barcode(s) in den Store aufgenommen.`);
  } catch (error) {
    console.error('scanWithCameraAction error', error);
    showToast('Fehler beim Kamerascannen. Bitte erneut versuchen.');
  }
}

async function scanFromGalleryAction() {
  try {
    const results = await scanFromGallery();
    if (!results || results.length === 0) {
      showToast('Scan abgebrochen oder kein Barcode gefunden.');
      return;
    }

    for (const result of results) {
      await barcodeStore.addBarcode(result);
    }

    showToast(`${results.length} Barcode(s) in den Store aufgenommen.`);
  } catch (error) {
    console.error('scanFromGalleryAction error', error);
    showToast('Fehler beim Galerie-Scan. Bitte erneut versuchen.');
  }
}

async function shareBarcode(barcode: BarcodeEntry) {
  try {
    await Share.share({
      title: 'Barcode',
      text: formatBarcodeText(barcode),
    });
    showToast('Barcode geteilt.');
  } catch (error) {
    console.error('shareBarcode error', error);
    showToast('Barcode konnte nicht geteilt werden.');
  }
}

async function copyBarcode(barcode: BarcodeEntry) {
  try {
    await Clipboard.write({ string: getClipboardValue(barcode) });
    showToast('Barcode in die Zwischenablage kopiert.');
  } catch (error) {
    console.error('copyBarcode error', error);
    showToast('Barcode konnte nicht kopiert werden.');
  }
}

async function deleteBarcode(barcode: BarcodeEntry) {
  try {
    await barcodeStore.removeBarcode(barcode.id);
    showToast('Barcode gelöscht.');
  } catch (error) {
    console.error('deleteBarcode error', error);
    showToast('Barcode konnte nicht gelöscht werden.');
  }
}

async function openBarcode(barcode: BarcodeEntry) {
  try {
    if (barcode.valueType === 'URL') {
      await InAppBrowser.openInWebView({
        url: normalizeUrl(barcode.displayValue),
        options: DefaultWebViewOptions,
      });
      return;
    }

    if (barcode.valueType === 'PHONE') {
      await AppLauncher.openUrl({
        url: `tel:${normalizePhone(barcode.displayValue)}`,
      });
      return;
    }
  } catch (error) {
    console.error('openBarcode error', error);
    showToast('Barcode konnte nicht geöffnet werden.');
  }
}
</script>

<style scoped>
.barcode-page {
  --background: linear-gradient(180deg, #f6f8fc 0%, #eef2f8 100%);
}

.hero {
  margin-bottom: 16px;
}

.scan-card,
.list-card {
  border-radius: 20px;
  box-shadow: 0 12px 30px rgba(19, 33, 68, 0.08);
}

.scan-actions {
  display: grid;
  gap: 12px;
}

.scan-count {
  margin: 14px 4px 0;
  color: var(--ion-color-medium-shade);
}

.empty-state {
  padding: 20px 8px;
  color: var(--ion-color-medium-shade);
}

.barcode-list {
  background: transparent;
}

.barcode-item {
  margin-bottom: 10px;
}

/* Damit ion-item-options beim Swipen nicht vom übergeordneten Card-Container abgeschnitten werden */
.list-card,
.list-card ion-card-content,
.barcode-list,
.barcode-item {
  overflow: visible;
}

.barcode-label h3 {
  margin: 0 0 6px;
  font-size: 1.05rem;
  font-weight: 700;
}

.barcode-label {
  width: 100%;
}

.barcode-label p {
  margin: 0;
  color: var(--ion-color-medium-shade);
}

.action-option {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-width: 84px;
}

.action-icon {
  font-size: 1.15rem;
}

.action-option-share {
  --background: var(--ion-color-primary);
}

.action-option-open {
  --background: var(--ion-color-tertiary);
}

.action-option-copy {
  --background: var(--ion-color-secondary);
}

.action-option-delete {
  --background: var(--ion-color-danger);
}
</style>
