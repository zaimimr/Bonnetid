import { Platform } from 'react-native';
import { t } from './i18n.ts';

export type NotificationSoundKey = 'default' | 'adhan' | 'adhan_kort';

export type NotificationSoundOption = {
  key: NotificationSoundKey;
  label: string;
  description: string;
  fileName: string | null;
  previewName: string | null;
};

export const NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
  {
    key: 'default',
    label: t('notifications.default.label'),
    description: t('notifications.default.description'),
    fileName: null,
    previewName: null,
  },
  {
    key: 'adhan_kort',
    label: t('notifications.adhanKort.label'),
    description: t('notifications.adhanKort.description'),
    fileName: 'adhan_kort.wav',
    previewName: 'adhan_kort',
  },
  {
    key: 'adhan',
    label: t('notifications.adhan.label'),
    ...(Platform.OS === 'android'
      ? {
          description: t('notifications.fullAdhanAbout2'),
          fileName: 'adhan_full.mp3',
          previewName: 'adhan_full',
        }
      : {
          description: t('notifications.takbirAndShahadaAbout'),
          fileName: 'adhan.wav',
          previewName: 'adhan',
        }),
  },
];

export function getNotificationSound(key: NotificationSoundKey): NotificationSoundOption {
  return NOTIFICATION_SOUNDS.find((option) => option.key === key) ?? NOTIFICATION_SOUNDS[0];
}
