# Native sheet ownership

`RNCMScreen` owns the React screen view. `PanModalViewController` contains that
controller for one modal presentation, with a separate transparent root view.
PanModal animates its outer `PanContainerView`.

The container sizes the screen to its bounds. React cannot write that screen's
frame while it has a native container; `RNCMScreen.viewDidLayoutSubviews` sends
actual size changes to Yoga so React can lay out the screen's content. Moving
the outer sheet does not require republishing an unchanged content size.

The wrapper owns modal appearance and dismissal notifications. Covering it,
hiding it beneath a surviving sheet, and canceling dismissal retain its child.
Terminal disappearance detaches the child before notifying the screen stack,
which can immediately present that same screen again. React invalidation and
UIKit presentation lifetime are separate: invalidating the React view releases
its controller reference, while containment retains the child until teardown.

Context menus retain the explicit presentation-host routing introduced for iOS
18. The host is derived from UIKit's parent relationship, not stored separately.

## Bottom insets

The synthetic `bottomLayoutGuide` is removed. PanModal's existing inset rule is
unchanged: `ignoreBottomOffset: true` sets the tracked scroll view's bottom
content inset to zero; otherwise it uses the presenting controller's actual
bottom layout guide. A correctly loaded presenting sheet can therefore produce
different stacked-sheet insets than the former synthetic zero-length guide.

The shared sheet configuration explicitly opts out of that bottom inset. These
manual configurations in [Routes.ios.tsx](../../navigation/Routes.ios.tsx) do not:

| Route | Content | Follow-up |
| --- | --- | --- |
| `CONNECTED_DAPPS` | `ScrollableItems` scroll view in `ConnectedDappsSheet` | Check the last row and bottom spacing when opened over another sheet; choose the inset policy explicitly if the content already supplies the required spacing. |
| `SELECT_ENS_SHEET` | FlatList with 50 points of bottom content padding | Check interaction between native inset, existing padding, and the surrounding bottom bleed when stacked. |
| `SPEED_UP_AND_CANCEL_SHEET` | Outer `SlackSheet` has scrolling disabled | No tracked outer-scroll inset is expected; review the configuration if scrollable interior content is added or enabled. |

This is a source-based follow-up catalogue, not a claim that these screens have
been visually verified or that each needs a layout change. No replacement
zero-inset workaround is installed.

## Focused validation

[The native adapter suite](../../../tools/cool-modals-native-tests) compiles the
production adapter against UIKit without building Rainbow. Its React boundary
spies check calls into the bridge; they do not exercise Yoga, the real React
touch handler, or the production screen-stack reconciler. Full app interaction
and physical high-refresh presentation remain separate acceptance surfaces.
