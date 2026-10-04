module.exports = (config) => ({
  type: 'watch-widget',
  name: 'bonnetidcomplication',
  displayName: 'Bønnetid',
  bundleIdentifier: '.watchkitapp.complication',
  deploymentTarget: '10.0',
  colors: {
    $accent: '#6FBA9D',
    $widgetBackground: '#000000',
  },
  frameworks: ['SwiftUI', 'WidgetKit'],
  entitlements: {
    'com.apple.security.application-groups':
      config.ios.entitlements['com.apple.security.application-groups'],
  },
});
