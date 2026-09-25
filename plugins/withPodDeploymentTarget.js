const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const MINIMUM = '15.1';

const snippet = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        current = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current && Gem::Version.new(current) < Gem::Version.new('${MINIMUM}')
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MINIMUM}'
        end
      end
    end
`;

module.exports = function withPodDeploymentTarget(config) {
  return withDangerousMod(config, [
    'ios',
    (modConfig) => {
      const podfilePath = path.join(modConfig.modRequest.platformProjectRoot, 'Podfile');
      const podfile = fs.readFileSync(podfilePath, 'utf8');
      if (!podfile.includes(snippet)) {
        fs.writeFileSync(
          podfilePath,
          podfile.replace('post_install do |installer|', `post_install do |installer|${snippet}`),
        );
      }
      return modConfig;
    },
  ]);
};
