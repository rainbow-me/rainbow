# 🎨📦🌈 Rainbow Design System 🌈📦🎨

The Rainbow Design System documentation is currently available at [https://rds-jxom.vercel.app](https://rds-jxom.vercel.app).

To view the documentation locally while working on the app, run `yarn ds` and open http://localhost:3000.

## Contribution

To view the design system components in isolation, ensure the following line is in `src/config/debug.js`.

```
export const designSystemPlaygroundEnabled = true;
```

This causes the app to render the design system playground instead of the regular app. The playground code is sourced from `src/design-system/playground/Playground.tsx`. This screen imports files named `*.docs.tsx` from each component folder.

When adding a new component, please ensure that it has a matching docs file and that it's imported in the main `Playground` component.

When adding a new text/heading size, please ensure that you've added an example to the respective `*.docs.tsx` file and validate that the space is being trimmed correctly above capital letters and below the baseline on both iOS and Android.
