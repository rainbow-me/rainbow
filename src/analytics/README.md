# `@/analytics`

Our analytics wrapper.

```typescript
import { analytics } from '@/analytics';

analytics.identify({
  ...userProperties,
});

analytics.track(analytics.event.applicationDidMount);
analytics.track(analytics.event.appStateChange, {
  category: 'app state',
  label: 'foo',
});

analytics.screen(Routes.SWIPE_LAYOUT, {
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

## Direct PostHog analytics

The existing `analytics.track`, `identify`, and `screen` calls use `posthog-react-native` directly. Event names, wallet metadata, and typed call sites remain unchanged. `track` becomes `capture`; `identify` updates person properties; `screen` emits PostHog's `$screen` event.

### Configuration

Set both values in the app's `.env` and the Bitrise environment that generates it:

```dotenv
POSTHOG_API_KEY=phc_your_project_key
POSTHOG_HOST=https://us.i.posthog.com
```

Use the **same project** as the interim RudderStack destination to retain existing people and reports. For EU Cloud, use `https://eu.i.posthog.com`; for self-hosting or a proxy, use that project's ingestion host. This is the public project key, not a personal API key. Missing configuration logs a warning and skips PostHog initialization.

The persisted Rainbow `deviceId` bootstraps PostHog's `distinct_id` before lifecycle events are emitted. Events queued before app initialization wait for that ID. Existing privacy settings control SDK initialization and opt-in/opt-out. SDK persistence and batching handle offline events. No PostHog provider, touch autocapture, replay, surveys, feature flags, or automatic error capture is enabled.

### AppsFlyer

`appsflyer.ts`, its native SDK, and its initialization/stop calls are retained. When the cached real UID is available, tracking attaches it as `properties.appsflyer_id`; `$os` remains available alongside PostHog's `$os_name` and `$os_version`. Missing UIDs are not fabricated or repaired by this change.

RudderStack no longer receives events from this app version, so its AppsFlyer conversion gate, S3 destination, and other destinations no longer run for these events. The replacement AppsFlyer conversion route is separate work; the retained SDK still owns native attribution/install/session reporting.

### Rollout and rollback

1. Configure the project key and ingestion host, then run `yarn install` and `bundle exec pod install` in `ios` before a native build. RudderStack's native pods and resource references have been removed; PostHog adds no native module in this configuration.
2. On an internal build, verify a track event, `$screen`, and a person-property update in PostHog. Confirm `distinct_id` matches the existing Rainbow device ID and check wallet metadata and `appsflyer_id` when available. Toggle analytics off/on and test offline delivery after reconnecting.
3. Keep the interim RudderStack destination active for older app versions. This version sends each event only through the direct SDK. Complete the separate AppsFlyer route and S3-consumer review before retiring shared RudderStack infrastructure.
4. Roll back by reverting this migration and rebuilding with the previous RudderStack build configuration. Rainbow's persisted identity and privacy settings are unchanged; old SDK storage is not deleted.

PostHog has its own lifecycle history. The first direct-SDK launch suppresses `Application Installed` for returning users; it cannot reconstruct the prior RudderStack build for that migration's `Application Updated` event. Later installs/updates use PostHog's persisted build history. The wrapper also persists the last observed version/build and emits one `Application Updated` when the version changes without a build change, as iOS releases can reuse build numbers. Build changes remain handled by the SDK to avoid duplicate update events. Foreground events retain `Application Opened` and `from_background`; session IDs and SDK/device enrichment now come from PostHog, so session boundaries can differ from RudderStack.
