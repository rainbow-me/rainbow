module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.e2e.config.js',
  skipLegacyWorkersInjection: true,
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 11',
      },
    },
  },
  apps: {
    'ios.release': {
      type: 'ios.app',
      binaryPath:
        'ios/build/Build/Products/Release-iphonesimulator/Rainbow.app',
      build:
        'xcodebuild -workspace ios/Rainbow.xcworkspace -scheme Rainbow -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Rainbow.app',
      build:
        'xcodebuild -workspace ios/Rainbow.xcworkspace -scheme Rainbow -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
  },
  configurations: {
    'ios.sim.release': {
      app: 'ios.release',
      device: 'simulator',
    },
    'ios.sim.debug': {
      app: 'ios.debug',
      device: 'simulator',
    },
    'android.emu.debug': {
      binaryPath: './android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd ./android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..',
      type: 'android.emulator',
      name: 'Pixel_3_API_29',
    },
    'android.emu.release': {
      type: 'android.emulator',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build:
        'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd ..',
      name: 'Pixel_3_API_29',
    },
  },
};
