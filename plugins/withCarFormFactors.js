const fs = require('fs');
const path = require('path');
const { withAppBuildGradle, withDangerousMod } = require('expo/config-plugins');

const CAR_APP_VERSION = '1.4.0';
const MARKER = '// bonnetid car form factors';

const GRADLE_BLOCK = `
${MARKER}
android {
    flavorDimensions "formfactor"
    productFlavors {
        mobile {
            dimension "formfactor"
            isDefault = true
        }
        automotive {
            dimension "formfactor"
            minSdkVersion 29
        }
    }
}

dependencies {
    mobileImplementation "androidx.car.app:app-projected:${CAR_APP_VERSION}"
    automotiveImplementation "androidx.car.app:app-automotive:${CAR_APP_VERSION}"
}
`;

const AUTOMOTIVE_MANIFEST = `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

  <uses-feature
      android:name="android.hardware.type.automotive"
      android:required="true"
      tools:replace="android:required" />

  <application>
    <activity
        android:name=".MainActivity"
        tools:node="remove" />

    <activity
        android:name="androidx.car.app.activity.CarAppActivity"
        android:exported="true"
        android:launchMode="singleTask"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
      <meta-data
          android:name="distractionOptimized"
          android:value="true" />
    </activity>
  </application>
</manifest>
`;

/**
 * Two Android artifacts out of one codebase: the phone build that projects into Android Auto,
 * and the Automotive OS build that runs on the car's own head unit and has no phone UI.
 */
module.exports = function withCarFormFactors(config) {
  const withFlavors = withAppBuildGradle(config, (gradleConfig) => {
    if (!gradleConfig.modResults.contents.includes(MARKER)) {
      gradleConfig.modResults.contents += GRADLE_BLOCK;
    }
    return gradleConfig;
  });

  return withDangerousMod(withFlavors, [
    'android',
    (dangerousConfig) => {
      const target = path.join(
        dangerousConfig.modRequest.platformProjectRoot,
        'app',
        'src',
        'automotive',
      );
      fs.mkdirSync(target, { recursive: true });
      fs.writeFileSync(path.join(target, 'AndroidManifest.xml'), AUTOMOTIVE_MANIFEST);
      return dangerousConfig;
    },
  ]);
};
