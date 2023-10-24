export const proxyRpcEndpoint = (endpoint: string, chainId: number) => {
  if (process.env.RPC_PROXY_ENABLED === 'true') {
    return `${process.env.RPC_PROXY_BASE_URL}/${chainId}/${
      process.env.RPC_PROXY_API_KEY
    }?custom_rpc=${encodeURIComponent(endpoint)}`;
  }
  return endpoint;
};
