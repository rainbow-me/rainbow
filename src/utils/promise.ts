const PromiseAllWithFails = async (promises: any) =>
  Promise.all(
    promises.map((promise: any) =>
      promise && promise.catch ? promise.catch((error: any) => error) : promise
    )
  );

export default {
  PromiseAllWithFails,
};
