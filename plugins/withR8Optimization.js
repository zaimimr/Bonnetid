const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = function withR8Optimization(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    gradleConfig.modResults.contents = gradleConfig.modResults.contents.replace(
      'getDefaultProguardFile("proguard-android.txt")',
      'getDefaultProguardFile("proguard-android-optimize.txt")',
    );
    return gradleConfig;
  });
};
