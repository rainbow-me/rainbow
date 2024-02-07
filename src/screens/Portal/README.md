# Portal

A low-level primitive for building new sheets that appear on top of other
content.

## Usage

```tsx
import * as portal from '@/screens/Portal';

export function Comp() {
  const { open } = portal.useOpen();

  const handlePress = () => {
    open(
      () => (
        <>
          <Box>
            <Text>Hello world</Text>
          </Box>
        </>
      ),
      { sheetHeight: 400 }
    );
  };

  return <Button onPress={handlePress}>Show some sheet</Button>;
}
```

There's also an API for use outside a React component, but try to use the hook
where possible.

```tsx
import * as portal from '@/screens/Portal';

portal.open(() => <>...</>, { ...options });
```

## Extension

We extend this primitive in some cases, like our `@/screens/Explain` sheet.
There, we re-export `useOpen` and `open`, as well as provide some pre-built
components that can be used to make consistent explainer sheets.

```tsx
import * as explain from '@/screens/Explain';

explain.open(
  () => (
    <>
      <explain.Emoji>💰</explain.Emoji>
      <explain.Title>This is a title</explain.Title>
      <explain.Body>And this is body text</explain.Body>
    </>
  ),
  { sheetHeight: 640 }
);
```

## Creating navigable routes

**All portals are rendered on the `Routes.PORTAL` route.** If you need to create
a separate route, maybe to deeplink to, then you'll need to create a new
`@/screens/<screen>`, assign it a separate route name in
`@/navigation/routeNames`, and add the new route to `Routes.ios.js` and
`Routes.android.js`.

You can use the `Portal` sheet wrapper as a starting point, though (it just uses
our `SimpleSheet` under the hood:

```tsx
export function Portal() {
  const { params } = useRoute<RouteProp<NavigationRouteParams, 'MyRoute'>>();

  return (
    <SimpleSheet backgroundColor="white" scrollEnabled={false}>
      <Box paddingVertical="44px" paddingHorizontal="32px" height="full" background="surfaceSecondary">
        ...
      </Box>
    </SimpleSheet>
  );
}
```
