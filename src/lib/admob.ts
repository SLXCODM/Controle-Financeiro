import { AdMob, AdOptions, BannerAdOptions, BannerAdSize, BannerAdPosition, BannerAdPluginEvents, InterstitialAdPluginEvents, AdLoadInfo } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

const INTERSTITIAL_AD_ID = 'ca-app-pub-2053964731459379/5584140065';
const BANNER_AD_ID = 'ca-app-pub-2053964731459379/1313722563';

let isAdLoaded = false;
let isInitialized = false;
let navigationCount = 0;
const SHOW_AD_EVERY_N_NAVIGATIONS = 3;

export async function initializeAdMob(): Promise<void> {
  if (!Capacitor.isNativePlatform() || isInitialized) return;

  try {
    await AdMob.initialize({
      initializeForTesting: false,
    });
    isInitialized = true;

    AdMob.addListener(InterstitialAdPluginEvents.Loaded, (_info: AdLoadInfo) => {
      isAdLoaded = true;
    });

    AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      isAdLoaded = false;
      prepareInterstitial();
    });

    AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
      isAdLoaded = false;
    });

    await prepareInterstitial();
    await showBanner();
  } catch (error) {
    console.error('AdMob initialization error:', error);
  }
}

export async function prepareInterstitial(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isInitialized) return;

  try {
    const options: AdOptions = {
      adId: INTERSTITIAL_AD_ID,
    };
    await AdMob.prepareInterstitial(options);
  } catch (error) {
    console.error('Failed to prepare interstitial:', error);
  }
}

export async function showBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isInitialized) return;

  try {
    const options: BannerAdOptions = {
      adId: BANNER_AD_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
    };
    await AdMob.showBanner(options);
  } catch (error) {
    console.error('Failed to show banner:', error);
  }
}

export async function showInterstitialOnNavigation(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isInitialized) return;

  navigationCount++;

  if (navigationCount >= SHOW_AD_EVERY_N_NAVIGATIONS && isAdLoaded) {
    navigationCount = 0;
    try {
      await AdMob.showInterstitial();
    } catch (error) {
      console.error('Failed to show interstitial:', error);
    }
  }
}
