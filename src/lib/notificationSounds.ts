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
    label: t({ nb: 'Standard', en: 'Default', ar: 'افتراضي', ur: 'ڈیفالٹ' }),
    description: t({
      nb: 'Systemets varsellyd',
      en: 'System notification sound',
      ar: 'صوت إشعارات النظام',
      ur: 'سسٹم کی اطلاع کی آواز',
    }),
    fileName: null,
    previewName: null,
  },
  {
    key: 'adhan_kort',
    label: t({ nb: 'Adhan (kort)', en: 'Adhan (short)', ar: 'الأذان (قصير)', ur: 'اذان (مختصر)' }),
    description: t({
      nb: 'Takbir, ca. 4 sekunder',
      en: 'Takbir, about 4 seconds',
      ar: 'التكبير، نحو 4 ثوانٍ',
      ur: 'تکبیر، تقریباً 4 سیکنڈ',
    }),
    fileName: 'adhan_kort.wav',
    previewName: 'adhan_kort',
  },
  {
    key: 'adhan',
    label: t({ nb: 'Adhan', en: 'Adhan', ar: 'الأذان', ur: 'اذان' }),
    ...(Platform.OS === 'android'
      ? {
          description: t({
            nb: 'Hele adhan, ca. 2,5 minutter',
            en: 'Full adhan, about 2.5 minutes',
            ar: 'الأذان كاملًا، نحو دقيقتين ونصف',
            ur: 'مکمل اذان، تقریباً ڈھائی منٹ',
          }),
          fileName: 'adhan_full.mp3',
          previewName: 'adhan_full',
        }
      : {
          description: t({
            nb: 'Takbir og shahada, ca. 29 sekunder',
            en: 'Takbir and shahada, about 29 seconds',
            ar: 'التكبير والشهادة، نحو 29 ثانية',
            ur: 'تکبیر اور شہادت، تقریباً 29 سیکنڈ',
          }),
          fileName: 'adhan.wav',
          previewName: 'adhan',
        }),
  },
];

export function getNotificationSound(key: NotificationSoundKey): NotificationSoundOption {
  return NOTIFICATION_SOUNDS.find((option) => option.key === key) ?? NOTIFICATION_SOUNDS[0];
}
