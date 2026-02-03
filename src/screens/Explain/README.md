# Explain sheet

A wrapper around our `@/screens/Portal` primitive that provides prebuilt
components for consistent explainer sheets.

```tsx
import * as explain from '@/screens/Explain';

explain.open(
  () => (
    <>
      <explain.Title>Pre-built title component</explain.Title>
    </>
  ),
  { sheetHeight: 400 }
);
```
