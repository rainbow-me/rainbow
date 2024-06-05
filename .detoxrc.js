module.exports = {
  testRunner: {
    $0: 'jest',
    args: {
      config: 'e2e/jest.e2e.config.js',
      _: ['e2e'],
    },
  },
  devices: {
    'ios.simulator': {
      type: 'ios.simulator',
      device: { type: 'iPhone 15 Pro' },
    },
    'android.attached': {
      type: 'android.attached',
      device: {
        adbName: '.*', // any attached device
      },
    },
    'android.emulator': {
      type: 'android.emulator',
      device: { avdName: 'Pixel_7_Pro_API_34' },
    },
  },
  apps: {
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Rainbow.app',
      build:
        'xcodebuild -workspace ios/Rainbow.xcworkspace -scheme Rainbow -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/Rainbow.app',
      build:
        'xcodebuild -workspace ios/Rainbow.xcworkspace -scheme Rainbow -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: './android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd ..',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: './android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd ./android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..',
    },
  },
  configurations: {
    'ios.sim.release': {
      app: 'ios.release',
      device: 'ios.simulator',
      artifacts: {
        plugins: {
          screenshot: 'failing',
        },
      },
      behavior: {
        cleanup: {
          shutdownDevice: false,
        },
      },
    },
    'ios.sim.debug': {
      app: 'ios.debug',
      device: 'ios.simulator',
      artifacts: {
        plugins: {
          screenshot: 'failing',
        },
      },
      behavior: {
        cleanup: {
          shutdownDevice: false,
        },
      },
    },
    'android.emu.release': {
      app: 'android.release',
      device: 'android.emulator',
    },
    'android.emu.debug': {
      app: 'android.debug',
      device: 'android.emulator',
    },
  },
};
