const fs = require('fs');
const path = require('path');
const {
  IOSConfig,
  withDangerousMod,
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
} = require('expo/config-plugins');

const FILE = 'CarPlaySceneDelegate.swift';

module.exports = function withCarPlay(config) {
  config = withEntitlementsPlist(config, (modConfig) => {
    modConfig.modResults['com.apple.developer.carplay-driving-task'] = true;
    return modConfig;
  });

  config = withInfoPlist(config, (modConfig) => {
    const manifest = modConfig.modResults.UIApplicationSceneManifest ?? {};
    modConfig.modResults.UIApplicationSceneManifest = {
      ...manifest,
      UIApplicationSupportsMultipleScenes: true,
      UISceneConfigurations: {
        ...manifest.UISceneConfigurations,
        CPTemplateApplicationSceneSessionRoleApplication: [
          {
            UISceneClassName: 'CPTemplateApplicationScene',
            UISceneConfigurationName: 'CarPlay',
            UISceneDelegateClassName: 'BonnetidCarPlaySceneDelegate',
          },
        ],
      },
    };
    return modConfig;
  });

  config = withDangerousMod(config, [
    'ios',
    (modConfig) => {
      const target = path.join(
        modConfig.modRequest.platformProjectRoot,
        modConfig.modRequest.projectName,
        FILE,
      );
      fs.copyFileSync(path.join(__dirname, 'carplay', FILE), target);
      return modConfig;
    },
  ]);

  return withXcodeProject(config, (modConfig) => {
    const project = modConfig.modResults;
    const groupName = modConfig.modRequest.projectName;
    const filepath = `${groupName}/${FILE}`;
    if (!project.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath, groupName, project });
    }
    return modConfig;
  });
};
