const { withAppBuildGradle, withSettingsGradle } = require('expo/config-plugins');

const MARKER = '// bonnetid wear os';

const SETTINGS_BLOCK = `
${MARKER}
include ':wear'
project(':wear').projectDir = new File(rootDir, '../wear/watch')
`;

const GRADLE_BLOCK = `
${MARKER}
android {
    sourceSets {
        mobile {
            java.srcDirs += "$rootDir/../wear/phone/java"
            manifest.srcFile "$rootDir/../wear/phone/AndroidManifest.xml"
        }
    }
}

dependencies {
    mobileImplementation "com.google.android.gms:play-services-wearable:19.0.0"
}
`;

module.exports = function withWearOs(config) {
  const withSettings = withSettingsGradle(config, (settingsConfig) => {
    if (!settingsConfig.modResults.contents.includes(MARKER)) {
      settingsConfig.modResults.contents += SETTINGS_BLOCK;
    }
    return settingsConfig;
  });

  return withAppBuildGradle(withSettings, (gradleConfig) => {
    if (!gradleConfig.modResults.contents.includes(MARKER)) {
      gradleConfig.modResults.contents += GRADLE_BLOCK;
    }
    return gradleConfig;
  });
};
