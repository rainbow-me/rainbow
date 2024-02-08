/**
 * Wrap a function with mock definitions
 *
 * @example
 *
 *  import { myFunction } from "./library";
 *  jest.mock("./library");
 *
 *  const mockedFunction = mocked(myFunction)
 *  expect(mockedFunction.mock.calls[0][0]).toBe(42);
 */
export function mocked<T extends (...args: any[]) => any>(mockedFunction: T): jest.MockedFunction<T> {
  return mockedFunction as jest.MockedFunction<T>;
}
