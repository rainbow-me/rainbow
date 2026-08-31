// eslint-disable-next-line @typescript-eslint/no-var-requires
const workletsResolver = require('react-native-worklets/jest/resolver');

// Reanimated 4.6.0 omits its Jest resolver from the published package.
// Keep this list aligned with the upstream resolver when upgrading.
const REANIMATED_WEB_ONLY_IN_JEST = [
  'initializers',
  'mutables',
  'mappers',
  'ConfigHelper',
  'UpdateLayoutAnimations',
  'useAnimatedRef',
  'useAnimatedStyle',
  'JSPropsUpdater',
  'updateProps',
  'util',
  'css/component/AnimatedComponent',
];

/** @type {import('jest-resolve').SyncResolver} */
module.exports = (request, options) => {
  const basename = request.split('/').pop();
  const usesWebImplementation = REANIMATED_WEB_ONLY_IN_JEST.some(entry =>
    entry.includes('/') ? request.endsWith(entry) : basename === entry
  );

  if (request.startsWith('.') && usesWebImplementation && options.basedir.includes('react-native-reanimated')) {
    return options.defaultResolver(request, {
      ...options,
      extensions: options.extensions?.filter(extension => !extension.includes('native')),
    });
  }

  return workletsResolver(request, options);
};
