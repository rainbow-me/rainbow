# `@/keychain`

A wrapper around `react-native-keychain` that provides better type safety and
error handling. It smooths over the core library's polymorphic return type and
thrown exceptions by implementing a discriminated union and pre-defined error
codes that are backwards compatible with our pre-existing keychain wrapper.

Instead of using `react-native-keychain` directly, use this module. That way we
can continue to improve our interface independent of the base library, and if we
ever need to swap out the base library in the future, we can more easily do
that. It will also help in testing because we can mock this module more easily
than the base library.

## Usage

The API is essentially the same as our pre-existing keychain wrapper, except
the return type.

```typescript
import * as keychain from '@/keychain';

await keychain.set(
  'my-keychain-key',
  'value',
  await keychain.getPrivateAccessControlOptions()
);
const bool = await keychain.has('my-keychain-key');
const result = await keychain.get('my-keychain-key');

await keychain.setObject('my-object', { foo: 'bar' });
const result = await keychain.getObject('my-object');

await keychain.setSharedWebCredentials('username', 'password');
const result = await keychain.getSharedWebCredentials('username', 'password');

const biometryType = await keychain.getSupportedBiometryType();

await keychain.remove('my-keychain-key');
await keychain.remove('my-object');

await keychain.clear();
```

The returned result type is a discriminated union, which allows for type-safe
access of values or errors:

```typescript
const { value, error } = await keychain.get('my-keychain-key');

if (value) {
  // value is defined
  // error is undefined
} else {
  // error is defined
  // value is undefined
}
```
