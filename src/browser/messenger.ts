export interface Tab {
  /**
   * Optional.
   * The title of the tab. This property is only present if the extension's manifest includes the "tabs" permission.
   */
  title?: string | undefined;
  /**
   * Optional.
   * The ID of the tab. Tab IDs are unique within a browser session. Under some circumstances a Tab may not be assigned an ID, for example when querying foreign tabs using the sessions API, in which case a session ID may be present. Tab ID can also be set to chrome.tabs.TAB_ID_NONE for apps and devtools windows.
   */
  id?: number | undefined;
}

export interface IMessageSender {
  /**
   * The URL of the page or frame that opened the connection. If the sender is in an iframe, it will be iframe's URL not the URL of the page which hosts it.
   * @since Chrome 28.
   */
  url?: string | undefined;
  /** The tabs.Tab which opened the connection, if any. This property will only be present when the connection was opened from a tab (including content scripts), and only if the receiver is an extension, not an app. */
  tab?: Tab | undefined;
}

export type CallbackOptions = {
  /** The sender of the message. */
  sender: IMessageSender;
  /** The topic provided. */
  topic: string;
  /** An optional scoped identifier. */
  id?: number | string;
};

export type CallbackFunction<TPayload, TResponse> = (payload: TPayload, callbackOptions: CallbackOptions) => Promise<TResponse>;

export type Source = 'background' | 'content' | 'inpage' | 'popup';

export type Messenger = {
  /** Whether or not the messenger is available in the context. */
  available: boolean;
  /** Name of the messenger */
  name: string;
  /** Sends a message to the `reply` handler. */
  send: <TPayload, TResponse>(
    /** A scoped topic that the `reply` will listen for. */
    topic: string,
    /** The payload to send to the `reply` handler. */
    payload: TPayload,
    options?: {
      /** Identify & scope the request via an ID. */
      id?: string | number;
    }
  ) => Promise<TResponse>;
  /** Replies to `send`. */
  reply: <TPayload, TResponse>(
    /** A scoped topic that was sent from `send`. */
    topic: string,
    callback: CallbackFunction<TPayload, TResponse>
  ) => () => void;
};

export type SendMessage<TPayload> = {
  topic: string;
  payload: TPayload;
  id?: number | string;
};

export type ReplyMessage<TResponse> = {
  topic: string;
  id: number | string;
  payload: { response: TResponse; error: Error };
};

export function isValidSend({ topic, message }: { topic: string; message: SendMessage<unknown> }) {
  if (!message.topic) return false;
  if (topic !== '*' && message.topic !== `> ${topic}`) return false;
  if (topic === '*' && message.topic.startsWith('<')) return false;
  return true;
}
export function isValidReply<TResponse>({ id, topic, message }: { id?: number | string; topic: string; message: ReplyMessage<TResponse> }) {
  if (message.topic !== `< ${topic}`) return;
  if (typeof id !== 'undefined' && message.id !== id) return;
  if (!message.payload) return;
  return true;
}

export function createMessenger(messenger: Messenger) {
  return messenger;
}

/**
 * Creates a generic transport that can be used to send and receive messages between extension scripts
 * under a given topic & set of types.
 *
 * @see https://www.notion.so/rainbowdotme/Cross-script-Messaging-141de5115294435f95e31b87abcf4314#3b63e155df6a4b71b0e6e74f7a2c416b
 */
export function createTransport<TPayload, TResponse>({ messenger, topic }: { messenger: Messenger; topic: string }) {
  if (!messenger.available) {
    console.error(`Messenger "${messenger.name}" is not available in this context.`);
  }
  return {
    async send(payload: TPayload, { id }: { id: number }) {
      return messenger.send<TPayload, TResponse>(topic, payload, { id });
    },
    async reply(callback: (payload: TPayload, callbackOptions: CallbackOptions) => Promise<TResponse>) {
      messenger.reply(topic, callback);
    },
  };
}

export enum rpcMethods {
  eth_chainId = 'eth_chainId',
  eth_accounts = 'eth_accounts',
  eth_sendTransaction = 'eth_sendTransaction',
  eth_signTransaction = 'eth_signTransaction',
  personal_sign = 'personal_sign',
  eth_signTypedData = 'eth_signTypedData',
  eth_signTypedData_v3 = 'eth_signTypedData_v3',
  eth_signTypedData_v4 = 'eth_signTypedData_v4',
  eth_getCode = 'eth_getCode',
  wallet_addEthereumChain = 'wallet_addEthereumChain',
  wallet_switchEthereumChain = 'wallet_switchEthereumChain',
  eth_requestAccounts = 'eth_requestAccounts',
  eth_blockNumber = 'eth_blockNumber',
  eth_call = 'eth_call',
  eth_estimateGas = 'eth_estimateGas',
  personal_ecRecover = 'personal_ecRecover',
  eth_gasPrice = 'eth_gasPrice',
  eth_getBlockByNumber = 'eth_getBlockByNumber',
  eth_getBalance = 'eth_getBalance',
  eth_getTransactionByHash = 'eth_getTransactionByHash',
}

export type RPCMethod = keyof typeof rpcMethods | string;

export type RequestArguments = {
  method: RPCMethod;
  params?: Array<unknown>;
};
export type RequestResponse =
  | {
      id: number;
      error: Error;
      result?: never;
    }
  | {
      id: number;
      error?: never;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result: any;
    };

export type ProviderRequestPayload = RequestArguments & {
  id: number;
  meta?: CallbackOptions;
};
type ProviderResponse = RequestResponse;

export const messenger = createMessenger({
  available: typeof window !== 'undefined',
  name: 'webviewMessenger',
  async send(topic, payload, { id } = {}) {
    // Since the window messenger cannot reply asynchronously, we must include the direction in our message ('> {topic}')...
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    window.ReactNativeWebView.postMessage(JSON.stringify({ topic: `> ${topic}`, payload, id }));
    // ... and also set up an event listener to listen for the response ('< {topic}').
    return new Promise((resolve, reject) => {
      const listener = (event: any) => {
        if (!isValidReply({ id, message: event.data, topic })) return;
        if (event.source != window) return;

        window.removeEventListener('message', listener);

        const { response, error } = event.data.payload;
        if (error) reject(new Error(error.message));
        resolve(response);
      };
      window.addEventListener('message', listener);
    });
  },
  reply(topic, callback) {
    const listener = async (event: any) => {
      if (!isValidSend({ message: event.data, topic })) return;

      const sender = event.source;
      if (sender != window) return;

      let error;
      let response;
      try {
        response = await callback(event.data.payload, {
          topic: event.data.topic,
          sender: event.source,
          id: event.data.id,
        });
      } catch (error_) {
        error = error_;
      }

      const repliedTopic = event.data.topic.replace('>', '<');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          topic: repliedTopic,
          payload: { error, response },
          id: event.data.id,
        })
      );
    };
    window.addEventListener('message', listener, false);
    return () => window.removeEventListener('message', listener);
  },
});

export const providerRequestTransport = createTransport<ProviderRequestPayload, ProviderResponse>({
  messenger: messenger,
  topic: 'providerRequest',
});
