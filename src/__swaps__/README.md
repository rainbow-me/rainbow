### Swaps V2

Please keep ALL code related to Swaps V2 inside of this folder. Here is the underlying process of how Swaps V2 work will proceed:

1. We will develop Swaps V2 from the ground up with no overlap with the existing swaps flow.
2. When you create a file inside of this folder, PLEASE copy the folder structure of how it will fit into the app.

Please note: This entire folder will not be bundled into production.

This folder is behind the `swaps_v2` feature flag which can be enabled via the developer settings. See [this file](https://github.com/rainbow-me/rainbow/blob/e9f1c0a13e6c221e252a02013a2ab2414fa6ed9e/src/screens/SettingsSheet/components/DevSection.tsx#L425-L438), which can be accessed via Settings => scroll to the bottom.
