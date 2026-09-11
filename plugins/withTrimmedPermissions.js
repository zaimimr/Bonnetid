const { withAndroidManifest } = require('expo/config-plugins');

const REMOVED_PERMISSIONS = ['android.permission.RECORD_AUDIO'];

module.exports = function withTrimmedPermissions(config) {
  return withAndroidManifest(config, (manifestConfig) => {
    const manifest = manifestConfig.modResults.manifest;
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    const kept = (manifest['uses-permission'] ?? []).filter(
      (permission) => !REMOVED_PERMISSIONS.includes(permission.$['android:name']),
    );
    manifest['uses-permission'] = [
      ...kept,
      ...REMOVED_PERMISSIONS.map((name) => ({
        $: { 'android:name': name, 'tools:node': 'remove' },
      })),
    ];
    return manifestConfig;
  });
};
