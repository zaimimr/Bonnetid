import { Linking, Platform } from 'react-native';

const VIPPS_APP_URL = 'vipps://';
const VIPPS_STORE_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/no/app/vipps/id984380185'
    : 'https://play.google.com/store/apps/details?id=no.dnb.vipps';

export function openVipps(): void {
  Linking.openURL(VIPPS_APP_URL).catch(() => {
    Linking.openURL(VIPPS_STORE_URL).catch(() => {});
  });
}
