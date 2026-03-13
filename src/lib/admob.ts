import { AdMob, AdOptions, BannerAdOptions, BannerAdSize, BannerAdPosition, InterstitialAdPluginEvents, RewardAdPluginEvents, AdLoadInfo, RewardAdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

const INTERSTITIAL_AD_ID = 'ca-app-pub-2053964731459379/5584140065';
const BANNER_AD_ID = 'ca-app-pub-2053964731459379/1313722563';
const REWARDED_AD_ID = 'ca-app-pub-2053964731459379/5584140065'; // Use same or separate rewarded ID

let isInterstitialLoaded = false;
let isRewardedLoaded = false;
let isInitialized = false;
let navigationCount = 0;
const SHOW_INTERSTITIAL_EVERY_N = 4; // Every 4 page transitions
let lastInterstitialTime = 0;
const MIN_INTERSTITIAL_INTERVAL_MS = 60000; // Minimum 60s between interstitials

export async function initializeAdMob(): Promise<void> {
  if (isInitialized) return;
  
  // Only run on native platforms
  if (!Capacitor.isNativePlatform()) {
    console.log('AdMob: Not a native platform, skipping initialization');
    return;
  }

  try {
    // Check if the plugin is actually available
    if (!AdMob || typeof AdMob.initialize !== 'function') {
      console.warn('AdMob plugin not available');
      return;
    }

    await AdMob.initialize({
      initializeForTesting: false,
    });
    isInitialized = true;

    // Interstitial listeners
    AdMob.addListener(InterstitialAdPluginEvents.Loaded, (_info: AdLoadInfo) => {
      isInterstitialLoaded = true;
    });

    AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      isInterstitialLoaded = false;
      setTimeout(() => prepareInterstitial(), 3000);
    });

    AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, () => {
      isInterstitialLoaded = false;
      setTimeout(() => prepareInterstitial(), 15000);
    });

    // Rewarded listeners
    AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
      isRewardedLoaded = true;
    });

    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      isRewardedLoaded = false;
      setTimeout(() => prepareRewarded(), 3000);
    });

    AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
      isRewardedLoaded = false;
      setTimeout(() => prepareRewarded(), 15000);
    });

    await prepareInterstitial();
    await prepareRewarded();
    await showBanner();
  } catch (error) {
    console.error('AdMob initialization error:', error);
    // Don't crash the app if AdMob fails
    isInitialized = false;
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
    // Retry after longer delay
    setTimeout(() => prepareInterstitial(), 30000);
  }
}

export async function prepareRewarded(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isInitialized) return;

  try {
    const options: RewardAdOptions = {
      adId: REWARDED_AD_ID,
    };
    await AdMob.prepareRewardVideoAd(options);
  } catch (error) {
    console.error('Failed to prepare rewarded:', error);
    setTimeout(() => prepareRewarded(), 30000);
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
    // Retry banner after delay
    setTimeout(() => showBanner(), 30000);
  }
}

export async function showInterstitialOnNavigation(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isInitialized) return;

  navigationCount++;
  const now = Date.now();

  if (
    navigationCount >= SHOW_INTERSTITIAL_EVERY_N &&
    isInterstitialLoaded &&
    now - lastInterstitialTime >= MIN_INTERSTITIAL_INTERVAL_MS
  ) {
    navigationCount = 0;
    lastInterstitialTime = now;
    try {
      await AdMob.showInterstitial();
    } catch (error) {
      console.error('Failed to show interstitial:', error);
      prepareInterstitial();
    }
  }
}

/**
 * Show a rewarded video ad (e.g., after completing a transaction).
 * Returns true if the ad was shown, false otherwise.
 */
export async function showRewardedAd(): Promise<boolean> {
  if (!Capacitor.isNativePlatform() || !isInitialized || !isRewardedLoaded) {
    return false;
  }

  try {
    await AdMob.showRewardVideoAd();
    return true;
  } catch (error) {
    console.error('Failed to show rewarded ad:', error);
    prepareRewarded();
    return false;
  }
}
