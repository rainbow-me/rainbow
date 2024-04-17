# Logger

The main log handler of the Rainbow app, with support for log levels, debug
contexts, and separate transports for production, dev, and test mode.

<details>
  <summary><strong>Coming from <code>@/utils/logger</code>?</strong> Here's a cheatsheet:</summary>

Methods `debug` and `warn` are the same, use them as you have been.
`prettyLog` is deprecated, just use one of the other methods.

The old `Logger.log` is now `logger.info`.

The old `Logger.sentry` and `Logger.error` should now look like this (see
below for more info):

```typescript
import { logger, RainbowError } from '@/logger';

try {
  // some async code
} catch (e) {
  const error = new RainbowError('Descriptive error message');
  logger.error(error, { ...metadata });
}
```

</details>

<details>
  <summary><strong>Coming from <code>@/utils/sentry</code>?</strong> Peep this:</summary>

All `addBreadcrumb` utils can be replicated with `logger.info`. Essentially,
this:

```typescript
addDataBreadcrumb('Message', { clicked: true });
```

Becomes this:

```typescript
import { logger } from '@/logger';

logger.info(`Message`, { clicked: true });
```

And for specific types of breadcrumbs, we can now use the built-in Sentry types
(see source file for options) like this:

```typescript
logger.info(`From ${prevRoute} to ${nextRoute}`, { type: 'nav' });
```

</details>

## At a Glance

The basic interface looks like this:

```typescript
import { logger } from '@/logger'

logger.debug(message[, metadata, debugContext])
logger.info(message[, metadata])
logger.log(message[, metadata])
logger.warn(message[, metadata])
logger.error(error[, metadata])
```

#### Usage Heuristics

- Use `logger.error` for all exceptions, and always pass it a descriptive
  `RainbowError`.
- Use `logger.warn` for anything that might be an exception now or in the future,
  or something we _need_ to know about, but isn't critical at the moment. These
  show up as separate Issues in Sentry _as well as_ breadcrumbs.
- Use `logger.info` for events or messages that you want to keep track of in
  Sentry. These show up as separate Issues in Sentry _as well as_ breadcrumbs.
- Use `logger.info` for anything you think would be helpful when tracing errors in
  Sentry. Think about what your coworkers might find helpful, and use these
  frequently. These show up as breadcrumbs.
- Use `logger.debug` for noisy lower-level stuff that's only helpful locally when
  developing or debugging. We have the option to send these to Sentry, but by
  default they aren't, so use these frequently as you see fit. These show up as
  breadcrumbs, if enabled.
- Use `console.log` _locally only_. We strip these out when building for
  production.

#### Modes

The "modes" referred to here are inferred from the values exported from `@/env`.
Basically, the booleans `IS_DEV`, `IS_TEST`, and `IS_PROD`.

#### Log Levels

Log levels are used to filter which logs are either printed to the console
and/or sent to Sentry and other reporting services.

In dev mode, our log level defaults to `info`, meaning `debug` are ignored. We
do this to prevent spamming the console. To configure this, set the
`LOG_LEVEL` environment variable to one of `debug`,
`info`, `log`, `warn`, or `error`.

In production mode, the log level defaults to `info`, so that `info` logs are
sent to our reporting services.

## Usage

```typescript
import { logger } from '@/logger';
```

### `logger.debug`

Debug level is for **local development only,** and is disabled by default. To
enabled it, set `LOG_LEVEL=debug` before running the Metro server.

```typescript
logger.debug(message);
```

Inspired by [debug](https://www.npmjs.com/package/debug), when writing debug
logs, you can optionally pass a _context_, which can be then filtered when in
debug mode.

This value should be related to the feature, component, or screen
the code is running within, and **it should be defined in `@/logger/debugContext`**.
This way we know if a relevant context already exists, and we can trace all
active contexts in use in our app. This const enum is conveniently available on
the `logger` at `logger.DebugContext`.

For example, a debug log like this:

```typescript
// src/components
logger.debug(message, logger.DebugContext.swaps);
```

Would be logged to the console in dev mode if `LOG_LEVEL=debug`, _or_ if you
pass a separate environment variable `LOG_DEBUG=swaps`. This variable supports
multiple contexts using commas like `LOG_DEBUG=swaps,ethers`, and _automatically
sets the log level to `debug`, regardless of `LOG_LEVEL`._

> For more advanced usage, you we can namespace our debug contexts i.e.
> `swaps:utils` or `swaps:forms`, which can then be targeted individually, or
> using a wildcard `LOG_LEVEL=swaps:*` to filter for all `swaps:` debug logs.

### `logger.info`

The `info` level should be used for information that would be helpful in a
tracing context, like Sentry. In fact, in production mode, `info` logs are sent
to Sentry as breadcrumbs.

`info` logs should be used liberally, but we must be vigilant to prevent private
information from being sent in these logs.

```typescript
logger.info(message);
```

`info`, along with `log`, `warn`, and `error` support an additional parameter, `metadata: Record<string, unknown>`. Use this to provide values to the [Sentry
breadcrumb](https://docs.sentry.io/platforms/react-native/enriching-events/breadcrumbs/#manual-breadcrumbs).
The object will also be pretty printed to the console in dev mode if
`LOG_LEVEL=info`.

```typescript
logger.info(message, {
  duration: '256ms',
});
```

### `logger.log`

The `log` level should be used sparingly because these messages will show up as
separate Issues in Sentry. They also get sent as breadcrumbs for convenience.

Use them a little like an analytics event, but one that will only be used by
devs. They support the optional second param, `metadata`.

```typescript
logger.log(message, { ...metadata });
```

### `logger.warn`

The `warn` level is probably the least used, and should typically be used for
things out of our control. Example: a flaky network call where we warn on the
first failure, retry, and throw an error if it fails again.

`warn` _could_ also be
used to deprecate code paths, by firing a warning into the local console that
directs the engineer towards the new recommended codepath.

These logs will be sent to Sentry as a separate Issue with level `warning`, as
well as as breadcrumbs, with a severity level of `warning`. They also support
the optional second parameter, `metadata`.

```typescript
logger.warn(message, { ...metadata });
```

### `logger.error`

The `error` level is for... well, errors. These are sent to our reporting
services in production mode. The optional `metadata` parameter is here as well.

In an effort to avoid leakage of private information, we force ourselves to pass
our own `RainbowError` subclass here instead of whatever random `Error` was
thrown.

For example, this exception will be ignored and a separate `RainbowError` will
be reported instead so that we can track down the incorrect usage.

```typescript
try {
  // some async code
} catch (e) {
  logger.error(e, { ...metadata });
}
```

The correct way to handle exceptions is to always create a new `RainbowError`
with a descriptive message of what happened. Be sure to avoid any PII.

```typescript
import { RainbowError } from '@/logger';

try {
  // some async code
} catch (e) {
  const error = new RainbowError('Descriptive error message');
  logger.error(error, { ...metadata });
}
```
