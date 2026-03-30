# 🎨📦🌈 Rainbow Design System 🌈📦🎨

The Rainbow Design System documentation is currently available at [https://rds-jxom.vercel.app](https://rds-jxom.vercel.app).

To view the documentation locally, run `yarn ds:install && yarn ds` and open http://localhost:3000.

## Playground

To view the design system components in isolation on a device/simulator, run `yarn ds:playground`. This starts Metro with a separate entry point that renders the playground instead of the wallet app.

The playground shell lives in `src/design-system/playground/` and imports `*.playground.tsx` files colocated with each component.

When adding a new text/heading size, please ensure that you've added an example to the respective `*.playground.tsx` file and validate that the space is being trimmed correctly above capital letters and below the baseline on both iOS and Android.
