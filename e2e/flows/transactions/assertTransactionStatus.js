function asLower(value) {
  return String(value || '').toLowerCase();
}

function assertReceiptStatus(receipt, expectedStatus, message) {
  const actualStatus = asLower(receipt && receipt.status);
  if (actualStatus !== expectedStatus) {
    throw new Error(`${message}. Expected ${expectedStatus}, got ${actualStatus || 'missing'}`);
  }
}

function isEmptyData(value) {
  const normalized = asLower(value);
  return normalized === '' || normalized === '0x' || normalized === '0x0' || normalized === '0x00';
}

function flattenPendingTransactions(poolResult) {
  const pending = (poolResult && poolResult.pending) || {};
  const transactions = [];

  Object.keys(pending).forEach(address => {
    const byNonce = pending[address] || {};
    Object.keys(byNonce).forEach(nonce => {
      const entry = byNonce[nonce];
      if (!entry) return;
      if (Array.isArray(entry)) {
        entry.forEach(tx => transactions.push(tx));
        return;
      }
      transactions.push(entry);
    });
  });

  return transactions;
}

function normalizePendingTx(tx) {
  return {
    from: asLower(tx.from),
    to: asLower(tx.to),
    nonce: asLower(tx.nonce),
    hash: asLower(tx.hash),
    input: asLower(tx.input),
    value: asLower(tx.value),
    gas: asLower(tx.gas),
    gasPrice: asLower(tx.gasPrice),
    maxFeePerGas: asLower(tx.maxFeePerGas),
    maxPriorityFeePerGas: asLower(tx.maxPriorityFeePerGas),
  };
}

function assertPendingTxMetadata(tx, anvil) {
  if (!tx.nonce || tx.nonce === '0x') {
    throw new Error('Pending tx nonce is undefined or empty');
  }

  if (!tx.gas || tx.gas === '0x0' || tx.gas === '0x' || BigInt(tx.gas) === 0n) {
    throw new Error('Pending tx gasLimit (gas) is zero or undefined, got: ' + tx.gas);
  }

  if (anvil) {
    var onChainNonce = anvil.eth_getTransactionCount(tx.from, 'latest');
    if (BigInt(tx.nonce) < BigInt(onChainNonce)) {
      throw new Error('Pending tx nonce (' + tx.nonce + ') is less than on-chain nonce (' + onChainNonce + ')');
    }
  }

  return tx;
}

function pickPendingSwapLikeTxFromPool(txPoolContent, fromAddress) {
  const pendingTransactions = flattenPendingTransactions(txPoolContent);
  if (!pendingTransactions.length) {
    throw new Error('No pending transaction found in txpool');
  }

  const normalizedFrom = asLower(fromAddress);
  const fromFiltered = normalizedFrom ? pendingTransactions.filter(tx => asLower(tx.from) === normalizedFrom) : pendingTransactions;

  if (!fromFiltered.length) {
    throw new Error('No pending transaction found for requested address');
  }

  const swapLikeTransactions = fromFiltered.filter(tx => {
    const txFrom = asLower(tx.from);
    const txTo = asLower(tx.to);
    return !isEmptyData(tx.input) && txFrom && txTo && txFrom !== txTo;
  });

  const candidateTransactions = swapLikeTransactions.length ? swapLikeTransactions : fromFiltered;
  const sortedByNonce = [...candidateTransactions].sort((a, b) => {
    const aNonce = BigInt(a.nonce || '0x0');
    const bNonce = BigInt(b.nonce || '0x0');
    if (aNonce === bNonce) return 0;
    return aNonce > bNonce ? 1 : -1;
  });

  return normalizePendingTx(sortedByNonce[sortedByNonce.length - 1]);
}

function assertReplacementFeeIncrease(originalTx, replacementTx) {
  if (originalTx.maxFeePerGas && replacementTx.maxFeePerGas) {
    const maxFeeIncreased = BigInt(replacementTx.maxFeePerGas) > BigInt(originalTx.maxFeePerGas);
    const priorityFeeIncreased = BigInt(replacementTx.maxPriorityFeePerGas) > BigInt(originalTx.maxPriorityFeePerGas);
    if (!maxFeeIncreased && !priorityFeeIncreased) {
      throw new Error('Expected replacement tx to increase EIP-1559 gas fees');
    }
    return;
  }

  if (originalTx.gasPrice && replacementTx.gasPrice) {
    if (BigInt(replacementTx.gasPrice) <= BigInt(originalTx.gasPrice)) {
      throw new Error('Expected replacement tx to increase gasPrice');
    }
    return;
  }

  throw new Error('Could not compare replacement tx gas fees');
}

function assertSpeedUpState(initialTxPoolContent, currentTxPoolContent, fromAddress) {
  const originalTx = pickPendingSwapLikeTxFromPool(initialTxPoolContent, fromAddress);
  const replacementTx = pickPendingSwapLikeTxFromPool(currentTxPoolContent, originalTx.from);

  if (replacementTx.hash === originalTx.hash) {
    throw new Error('Expected replacement tx hash to change after speed up');
  }
  if (replacementTx.nonce !== originalTx.nonce) {
    throw new Error('Expected speed up tx to reuse the original nonce');
  }
  if (replacementTx.from !== originalTx.from) {
    throw new Error('Expected speed up tx to use the same sender');
  }
  if (replacementTx.to !== originalTx.to) {
    throw new Error('Expected speed up tx to keep the same destination');
  }
  if (replacementTx.input !== originalTx.input) {
    throw new Error('Expected speed up tx to keep the same calldata');
  }

  assertReplacementFeeIncrease(originalTx, replacementTx);
  return replacementTx;
}

function assertCanceledState(initialTxPoolContent, currentTxPoolContent, fromAddress) {
  const originalTx = pickPendingSwapLikeTxFromPool(initialTxPoolContent, fromAddress);
  const replacementTx = pickPendingSwapLikeTxFromPool(currentTxPoolContent, originalTx.from);

  if (replacementTx.hash === originalTx.hash) {
    throw new Error('Expected cancellation tx hash to change');
  }
  if (replacementTx.nonce !== originalTx.nonce) {
    throw new Error('Expected cancellation tx to reuse the original nonce');
  }
  if (replacementTx.from !== originalTx.from) {
    throw new Error('Expected cancellation tx to use the same sender');
  }
  if (replacementTx.to !== replacementTx.from) {
    throw new Error('Expected cancellation tx to be a self-transfer');
  }
  if (!isEmptyData(replacementTx.input)) {
    throw new Error('Expected cancellation tx calldata to be empty');
  }
  if (BigInt(replacementTx.value || '0x0') !== 0n) {
    throw new Error('Expected cancellation tx value to be zero');
  }

  return replacementTx;
}

function assertTransactionInLatestBlock(anvil, txHash) {
  const block = anvil.eth_getBlockByNumber('latest', true);
  const normalizedHash = asLower(txHash);
  const transactions = (block && block.transactions) || [];
  const transaction = transactions.find(tx => asLower(tx.hash) === normalizedHash);
  if (!transaction) {
    throw new Error('Latest block does not include expected tx hash');
  }
  return transaction;
}

function assertConfirmedState(anvil, txHash) {
  const transaction = assertTransactionInLatestBlock(anvil, txHash);
  const receipt = anvil.eth_getTransactionReceipt(txHash);
  if (!receipt) {
    throw new Error('Transaction receipt not found for confirmed tx');
  }
  assertReceiptStatus(receipt, '0x1', 'Expected transaction to be confirmed successfully');
  return transaction;
}

function assertFailedState(anvil, txHash) {
  const transaction = assertTransactionInLatestBlock(anvil, txHash);
  const receipt = anvil.eth_getTransactionReceipt(txHash);
  if (!receipt) {
    throw new Error('Transaction receipt not found for failed tx');
  }
  assertReceiptStatus(receipt, '0x0', 'Expected transaction to be failed');
  return transaction;
}

// eslint-disable-next-line no-undef
output.assertTransactionStatus = function (anvil, config) {
  const state = asLower(config && config.state);
  const fromAddress = config && config.fromAddress;

  if (state === 'pending') {
    const txPoolContent = (config && config.txPoolContent) || anvil.txpool_content();
    const tx = pickPendingSwapLikeTxFromPool(txPoolContent, fromAddress);
    if (config && config.validateMetadata) {
      assertPendingTxMetadata(tx, anvil);
    }
    return tx;
  }

  if (state === 'speedup') {
    if (!(config && config.initialTxPoolContent)) {
      throw new Error('initialTxPoolContent is required for speedup state assertion');
    }
    return assertSpeedUpState(config.initialTxPoolContent, anvil.txpool_content(), fromAddress);
  }

  if (state === 'canceled') {
    if (!(config && config.initialTxPoolContent)) {
      throw new Error('initialTxPoolContent is required for canceled state assertion');
    }
    return assertCanceledState(config.initialTxPoolContent, anvil.txpool_content(), fromAddress);
  }

  if (state === 'confirmed') {
    if (!(config && config.txHash)) {
      throw new Error('txHash is required for confirmed state assertion');
    }
    return assertConfirmedState(anvil, config.txHash);
  }

  if (state === 'failed') {
    if (!(config && config.txHash)) {
      throw new Error('txHash is required for failed state assertion');
    }
    return assertFailedState(anvil, config.txHash);
  }

  if (state === 'replaced') {
    if (!(config && config.txHash)) {
      throw new Error('txHash is required for replaced state assertion');
    }
    var block = anvil.eth_getBlockByNumber('latest', true);
    var normalizedHash = asLower(config.txHash);
    var transactions = (block && block.transactions) || [];
    var found = transactions.find(function (tx) {
      return asLower(tx.hash) === normalizedHash;
    });
    if (found) {
      throw new Error('Expected original tx hash to NOT be in latest block (it should be replaced)');
    }
    return { hash: config.txHash, replaced: true };
  }

  if (state === 'empty') {
    var poolContent = anvil.txpool_content();
    var allPending = flattenPendingTransactions(poolContent);
    if (allPending.length > 0) {
      throw new Error('Expected txpool to be empty but found ' + allPending.length + ' pending tx(s)');
    }
    return { empty: true };
  }

  throw new Error(`Unknown tx state: ${state}`);
};
