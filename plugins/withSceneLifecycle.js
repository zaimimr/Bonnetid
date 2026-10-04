const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const WINDOW_START = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

`;

module.exports = function withSceneLifecycle(config) {
  config = withAppDelegate(config, (modConfig) => {
    const source = modConfig.modResults.contents;
    if (!source.includes(WINDOW_START)) {
      throw new Error('withSceneLifecycle: AppDelegate template changed, update the plugin');
    }
    modConfig.modResults.contents = source
      .replace(
        'class AppDelegate: ExpoAppDelegate {',
        'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {',
      )
      .replace(WINDOW_START, '');
    return modConfig;
  });

  return withInfoPlist(config, (modConfig) => {
    const manifest = modConfig.modResults.UIApplicationSceneManifest ?? {};
    modConfig.modResults.UIApplicationSceneManifest = {
      ...manifest,
      UIApplicationSupportsMultipleScenes: manifest.UIApplicationSupportsMultipleScenes ?? false,
      UISceneConfigurations: {
        ...manifest.UISceneConfigurations,
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
          },
        ],
      },
    };
    return modConfig;
  });
};
