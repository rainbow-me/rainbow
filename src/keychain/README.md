# `@/keychain`

A wrapper around `react-native-keychain` that provides better type safety and
error handling. It smooths over the core library's polymorphic return type and
thrown exceptions by implementing a discriminated union and pre-defined error
codes that are backwards compatible with our pre-existing keychain wrapper.

**Instead of using `react-native-keychain` directly, use this module.** That way we
can continue to improve our interface independent of the base library, and if we
ever need to swap out the base library in the future, we can more easily do
that. It will also help in testing because we can mock this module more easily
than the base library.

#### A note on the API design

Some non-private values are cached in MMKV for faster reads. These values exist
in keychain so that they may persist between app installs. Loading from keychain
into MMKV gives us the resilience of keychain, with the speed of MMKV.

## Usage

The API is essentially the same as our pre-existing keychain wrapper, except
the return type.

```typescript
import * as keychain from '@/keychain';

await keychain.set('my-keychain-key', 'value', await keychain.getPrivateAccessControlOptions());
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
access of values or errors i.e. no more `?.` coalescing for values. Error
handling is also codified, and this wrapper _will not throw._

```typescript
const { value, error } = await keychain.getObject('my-object');

if (value) {
   console.log(value.foo) // safe property access
} else {
   switch(error) {
      case(keychain.ErrorType.Unavailable):
      case(keychain.ErrorType.UserCanceled):
      case(keychain.ErrorType.NotAuthenticated):
         console.log(...)
         break;
      case(keychain.ErrorType.Unknown):
      default:
         console.log(`An unknown error occurred: ${error}`)
   }
}
```
