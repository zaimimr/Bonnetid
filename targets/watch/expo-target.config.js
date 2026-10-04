module.exports = (config) => ({
  type: 'watch',
  name: 'bonnetidwatch',
  displayName: 'Bønnetid',
  bundleIdentifier: '.watchkitapp',
  icon: '../../assets/images/icon.png',
  deploymentTarget: '10.0',
  colors: {
    $accent: '#6FBA9D',
  },
  frameworks: ['SwiftUI', 'WidgetKit', 'WatchConnectivity'],
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
