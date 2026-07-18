export type NotificationSoundKey = 'default' | 'adhan' | 'adhan_kort';

export type NotificationSoundOption = {
  key: NotificationSoundKey;
  label: string;
  description: string;
  fileName: string | null;
  previewAsset: number | null;
};

export const NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
  {
    key: 'default',
    label: 'Standard',
    description: 'Systemets varsellyd',
    fileName: null,
    previewAsset: null,
  },
  {
    key: 'adhan_kort',
    label: 'Adhan (kort)',
    description: 'Takbir, ca. 4 sekunder',
    fileName: 'adhan_kort.wav',
    previewAsset: require('../../assets/sounds/adhan_kort.wav'),
  },
  {
    key: 'adhan',
    label: 'Adhan',
    description: 'Takbir og shahada, ca. 29 sekunder',
    fileName: 'adhan.wav',
    previewAsset: require('../../assets/sounds/adhan.wav'),
  },
];

export function getNotificationSound(key: NotificationSoundKey): NotificationSoundOption {
  return NOTIFICATION_SOUNDS.find((option) => option.key === key) ?? NOTIFICATION_SOUNDS[0];
}
