import { IMessageSender } from '@rainbow-me/provider';
import WebView from 'react-native-webview';

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

/**
 * Creates a generic messenger that can be used to send and receive messages between extension scripts.
 * @see https://www.notion.so/rainbowdotme/Cross-script-Messaging-141de5115294435f95e31b87abcf4314#6c19ef14227d468e8e9bc232a367f035
 */
export function createMessenger(messenger: Messenger) {
  return messenger;
}

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

export const appMessenger = (webViewRef: WebView, tabId: string, url: string) => {
  const listeners: { [topic: string]: (event: MessageEvent) => void } = {};

  return {
    ...createMessenger({
      available: true,
      name: 'appMessenger',
      async send(topic, payload, { id } = {}) {
        const data = { topic: `> ${topic}`, payload, id };
        webViewRef.injectJavaScript(`window.postMessage(${JSON.stringify(data)})`);
        // ... and also set up an event listener to listen for the response ('< {topic}').
        return new Promise((resolve, reject) => {
          const listener = (event: MessageEvent) => {
            if (!isValidReply({ id, message: event.data, topic })) return;
            const { response, error } = event.data.payload;
            delete listeners[topic];
            if (error) reject(new Error(error.message));
            resolve(response);
          };
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          listeners[topic] = listener as (event: MessageEvent) => void;

          window.addEventListener('message', listener);
        });
      },
      reply<TPayload, TResponse>(topic: string, callback: CallbackFunction<TPayload, TResponse>) {
        const listener = async (event: MessageEvent<SendMessage<TPayload>>) => {
          console.log('replying', topic, callback, event);
          if (!isValidSend({ message: event.data, topic })) {
            console.log('invalid send', { message: event.data, topic });
            return;
          } else {
            console.log('valid send!');
          }

          let error;
          let response;
          try {
            console.log('calling callback');
            response = await callback(event.data.payload, {
              topic: event.data.topic,
              sender: event.source as IMessageSender,
              id: event.data.id,
            });
            console.log('callback response', response);
          } catch (error_) {
            console.log('reply callback error', error_);
            error = error_;
          }

          const repliedTopic = event.data.topic.replace('>', '<');
          console.log('replying topic', repliedTopic, response);
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const data = {
            topic: repliedTopic,
            payload: { error, response },
            id: event.data.id,
          };
          webViewRef.injectJavaScript(`window.postMessage(${JSON.stringify(data)})`);
          console.log('sent!');
        };
        console.log('adding listener', topic);
        listeners[topic] = listener as (event: MessageEvent) => void;
        console.log(listeners);

        return () => {
          delete listeners[topic];
        };
      },
    }),
    url,
    tabId,
    listeners,
  };
};
