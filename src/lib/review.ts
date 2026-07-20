import { Linking, Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';

const IOS_APP_ID = '6792056685';
const ANDROID_PACKAGE = 'no.irn.bonnetid';

export const STORE_URL =
  Platform.OS === 'ios'
    ? `https://apps.apple.com/app/id${IOS_APP_ID}`
    : `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

const WRITE_REVIEW_URL =
  Platform.OS === 'ios'
    ? `itms-apps://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`
    : `market://details?id=${ANDROID_PACKAGE}`;

export async function openStoreReview(): Promise<void> {
  try {
    const canDeepLink = await Linking.canOpenURL(WRITE_REVIEW_URL);
    await Linking.openURL(canDeepLink ? WRITE_REVIEW_URL : STORE_URL);
  } catch {
    Linking.openURL(STORE_URL).catch(() => {});
  }
}

export async function requestInAppReview(): Promise<boolean> {
  try {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
