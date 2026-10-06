const { withAndroidManifest } = require('expo/config-plugins');

const LOCKED_ACTIVITIES = ['com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity'];

module.exports = function withUnlockedOrientation(config) {
  return withAndroidManifest(config, (manifestConfig) => {
    const manifest = manifestConfig.modResults.manifest;
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    const application = manifest.application[0];
    const activities = (application.activity ?? []).filter(
      (activity) => !LOCKED_ACTIVITIES.includes(activity.$['android:name']),
    );
    application.activity = [
      ...activities,
      ...LOCKED_ACTIVITIES.map((name) => ({
        $: { 'android:name': name, 'android:screenOrientation': 'unspecified', 'tools:replace': 'android:screenOrientation' },
      })),
    ];
    return manifestConfig;
  });
};
