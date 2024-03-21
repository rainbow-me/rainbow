# `@/analytics`

Our analytics wrapper.

```typescript
import { analyticsV2 } from '@/analytics';

analyticsV2.identify({
  ...userProperties,
});

analyticsV2.track(analyticsV2.event.applicationDidMount);
analyticsV2.track(analyticsV2.event.appStateChange, {
  category: 'app state',
  label: 'foo',
});

analyticsV2.screen(Routes.SWAPS_PROMO_SHEET, {
  ...metadata,
});
```

## Events

Events are managed as const objects in `@/analytics/event` to reduce the possibility of developer
error and help us strictly type their payloads where we can. Event names should
adhere to a naming convention as much as possible. Rougly:

```bash
<name_or_category>.<action>
```

Here, `name_or_category` should be descriptive, can contain multiple `.` separated
parts, and increase in specificity from left to right. For instance, swaps
related events might start with `swaps`. But different features within swaps
might warrant bucketing into separate sub-categories, like:

```bash
swaps.user_form
swaps.backend_processing
```

Finally, the `action` should be the _past-tense_ action that occurred:

```bash
swaps.user_form.submitted
swaps.backend_processing.network_failed
```

### Adding a new event

Add to the `event` object in `@/analytics/event`. Use a camelCase value for the
key, and the event name (following the convention above) as the value.

```typescript
export const event = {
  swapsUserFormSubmitted: 'swaps.user_form.submitted',
};
```

You'll also need to define the payload for the event on the `EventProperties` type. If your event doesn't have a payload, use `undefined` as its value. See the file for examples.

### Updating old events

**Important:** once an event name has been used in production, it should not be
changed. What we _can_ do is rename the key to better suit where it's called, or
the naming conventions we've evolved to use e.g.:

```typescript
export const event = {
  // value stays the same
  financeSwapsFormUserSubmitted: 'swaps.user_form.submitted',
};
```

Also consider if we might just double-emit during a transition period. In this
case, we continue to send the old events, but also send new events with new
payloads. After a sufficient period of time has passed, we can remove the old
event and rely entirely on the new one.
