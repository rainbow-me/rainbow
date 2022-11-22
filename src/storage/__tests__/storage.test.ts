import { jest, test, expect, beforeEach } from '@jest/globals';
import { Storage } from '@/storage';

jest.mock('react-native-mmkv', () => ({
  MMKV: class MMKVMock {
    _store = new Map();

    set(key: string, value: unknown) {
      this._store.set(key, value);
    }

    getString(key: string) {
      return this._store.get(key);
    }

    delete(key: string) {
      return this._store.delete(key);
    }
  },
}));

type Schema = {
  boo: boolean;
  str: string | null;
  num: number;
  obj: Record<string, unknown>;
};

// fancy string template type
type Wallet = `0x${string}`;

const wallet: Wallet = `0x12345`;
const store = new Storage<[Wallet], Schema>({ id: 'test' });

beforeEach(() => {
  store.removeMany([wallet], ['boo', 'str', 'num', 'obj']);
});

test(`stores and retrieves data`, () => {
  store.set([wallet, 'boo'], true);
  store.set([wallet, 'str'], 'string');
  store.set([wallet, 'num'], 1);
  expect(store.get([wallet, 'boo'])).toEqual(true);
  expect(store.get([wallet, 'str'])).toEqual('string');
  expect(store.get([wallet, 'num'])).toEqual(1);
});

test(`removes data`, () => {
  store.set([wallet, 'boo'], true);
  expect(store.get([wallet, 'boo'])).toEqual(true);
  store.remove([wallet, 'boo']);
  expect(store.get([wallet, 'boo'])).toEqual(undefined);
});

test(`removes multiple keys at once`, () => {
  store.set([wallet, 'boo'], true);
  store.set([wallet, 'str'], 'string');
  store.set([wallet, 'num'], 1);
  store.removeMany([wallet], ['boo', 'str', 'num']);
  expect(store.get([wallet, 'boo'])).toEqual(undefined);
  expect(store.get([wallet, 'str'])).toEqual(undefined);
  expect(store.get([wallet, 'num'])).toEqual(undefined);
});

test(`concatenates keys`, () => {
  store.remove([wallet, 'str']);
  store.set([wallet, 'str'], 'concat');
  // @ts-ignore accessing these properties for testing purposes only
  expect(store.store.getString(`${wallet}${store.sep}str`)).toBeTruthy();
});

test(`can store falsy values`, () => {
  store.set([wallet, 'str'], null);
  store.set([wallet, 'num'], 0);
  expect(store.get([wallet, 'str'])).toEqual(null);
  expect(store.get([wallet, 'num'])).toEqual(0);
});

test(`can store objects`, () => {
  const obj = { foo: true };
  store.set([wallet, 'obj'], obj);
  expect(store.get([wallet, 'obj'])).toEqual(obj);
});
