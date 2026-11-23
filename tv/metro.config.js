const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const sharedRoot = path.resolve(projectRoot, '..');
const config = getDefaultConfig(projectRoot);

config.watchFolders = [path.join(sharedRoot, 'src')];
config.resolver.nodeModulesPaths = [path.join(projectRoot, 'node_modules')];
config.resolver.disableHierarchicalLookup = true;

const stubs = { 'expo-clipboard': path.join(projectRoot, 'stubs/clipboard.ts') };
const upstream = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (stubs[moduleName]) return { type: 'sourceFile', filePath: stubs[moduleName] };
  if (moduleName.startsWith('@/')) {
    return context.resolveRequest(context, path.join(sharedRoot, 'src', moduleName.slice(2)), platform);
  }
  return (upstream ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
