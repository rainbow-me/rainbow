const PromiseAllWithFails = async promises =>
  Promise.all(
    promises.map(promise =>
      promise && promise.catch ? promise.catch(error => error) : promise
    )
  );

export default {
  PromiseAllWithFails,
};
