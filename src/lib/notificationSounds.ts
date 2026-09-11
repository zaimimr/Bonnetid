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
    label: 'Standard',
    description: 'Systemets varsellyd',
    fileName: null,
    previewName: null,
  },
  {
    key: 'adhan_kort',
    label: 'Adhan (kort)',
    description: 'Takbir, ca. 4 sekunder',
    fileName: 'adhan_kort.wav',
    previewName: 'adhan_kort',
  },
  {
    key: 'adhan',
    label: 'Adhan',
    description: 'Takbir og shahada, ca. 29 sekunder',
    fileName: 'adhan.wav',
    previewName: 'adhan',
  },
];

export function getNotificationSound(key: NotificationSoundKey): NotificationSoundOption {
  return NOTIFICATION_SOUNDS.find((option) => option.key === key) ?? NOTIFICATION_SOUNDS[0];
}
