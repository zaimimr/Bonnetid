const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const SOURCE_DIR = path.join(__dirname, 'symbols');

module.exports = function withSymbols(config) {
  return withDangerousMod(config, [
    'ios',
    (modConfig) => {
      const catalog = path.join(
        modConfig.modRequest.platformProjectRoot,
        modConfig.modRequest.projectName,
        'Images.xcassets',
      );
      fs.cpSync(SOURCE_DIR, catalog, { recursive: true });
      return modConfig;
    },
  ]);
};
