import { requireOptionalNativeModule } from 'expo';

type SoundPreviewNativeModule = {
  play: (name: string) => void;
  stop: () => void;
};

const native = requireOptionalNativeModule<SoundPreviewNativeModule>('SoundPreview');

export const soundPreviewAvailable = native != null;

export function playSoundPreview(name: string) {
  native?.play(name);
}

export function stopSoundPreview() {
  native?.stop();
}
