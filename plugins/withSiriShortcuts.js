const fs = require('fs');
const path = require('path');
const { IOSConfig, withDangerousMod, withXcodeProject } = require('expo/config-plugins');

const SOURCE_DIR = path.join(__dirname, 'siri');
const FILES = ['PrayerIntents.swift', 'nb.lproj/AppShortcuts.strings'];

module.exports = function withSiriShortcuts(config) {
  config = withDangerousMod(config, [
    'ios',
    (modConfig) => {
      const target = path.join(
        modConfig.modRequest.platformProjectRoot,
        modConfig.modRequest.projectName,
      );
      for (const file of FILES) {
        fs.mkdirSync(path.dirname(path.join(target, file)), { recursive: true });
        fs.copyFileSync(path.join(SOURCE_DIR, file), path.join(target, file));
      }
      return modConfig;
    },
  ]);

  return withXcodeProject(config, (modConfig) => {
    const project = modConfig.modResults;
    const groupName = modConfig.modRequest.projectName;
    for (const file of FILES) {
      const filepath = `${groupName}/${file}`;
      if (project.hasFile(filepath)) continue;
      if (file.endsWith('.swift')) {
        IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath, groupName, project });
      } else {
        IOSConfig.XcodeUtils.addResourceFileToGroup({ filepath, groupName, project, isBuildFile: true });
      }
    }
    const regions = project.pbxProjectSection()[project.getFirstProject().uuid].knownRegions;
    if (!regions.includes('nb')) regions.push('nb');
    return modConfig;
  });
};
