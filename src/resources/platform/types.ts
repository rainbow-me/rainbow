export type PlatformResponse<T> = {
  metadata: {
    requestTime: string;
    responseTime: string;
    requestId: string;
    success: boolean;
  };
  result: T;
};
