<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-title>Barcode Scan</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" :fullscreen="true">
      <ion-label>
        <h2>Part A: Scan &amp; Store</h2>
        <p>Dies ist die Testseite für das Hinzufügen von Barcodes zum Store.</p>
      </ion-label>

      <ion-button expand="block" @click="scanWithCameraAction">
        Scan mit Kamera
      </ion-button>
      <ion-button expand="block" @click="scanFromGalleryAction">
        Scan aus Galerie
      </ion-button>

      <p>Scannergebnisse im aktuellen Lauf: {{ barcodeCount }}</p>

      <ion-toast
        :is-open="toastOpen"
        :message="toastMessage"
        duration="2000"
        @didDismiss="toastOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonLabel,
  IonPage,
  IonTitle,
  IonToolbar,
  IonToast,
} from '@ionic/vue';
import { barcodeStore } from '../services/barcodeStore';
import { scanWithCamera, scanFromGallery } from '../services/barcodeScanner';

const toastOpen = ref(false);
const toastMessage = ref('');

function showToast(message: string) {
  toastMessage.value = message;
  toastOpen.value = true;
}

const barcodeCount = computed(() => barcodeStore.getBarcodes().length);

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
</script>
