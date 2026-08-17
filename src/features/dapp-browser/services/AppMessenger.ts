import { type RefObject } from 'react';

import type WebView from 'react-native-webview';

import { type IMessageSender } from '@rainbow-me/provider';

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
  dispatch: (event: MessengerEvent) => void;
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

export type MessengerEvent<TPayload = unknown> = {
  data: SendMessage<TPayload>;
  meta: { sender: IMessageSender };
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

export function isValidReply<TResponse>(
  message: SendMessage<unknown>,
  { id, topic }: { id?: number | string; topic: string }
): message is ReplyMessage<TResponse> {
  if (message.topic !== `< ${topic}`) return false;
  if (typeof id !== 'undefined' && message.id !== id) return false;
  if (!message.payload) return false;
  return true;
}

export const appMessenger = (webViewRef: RefObject<WebView | null>, tabId: string, url: string) => {
  const listeners: { [topic: string]: (event: MessengerEvent) => void } = {};

  return {
    ...createMessenger({
      available: true,
      name: 'appMessenger',
      async send<TPayload, TResponse>(topic: string, payload: TPayload, { id }: { id?: number | string } = {}) {
        const data = { topic: `> ${topic}`, payload, id };
        const response = new Promise<TResponse>((resolve, reject) => {
          const listener = (event: MessengerEvent) => {
            const message = event.data;
            if (!isValidReply<TResponse>(message, { id, topic })) return;
            delete listeners[topic];
            if (message.payload.error) reject(new Error(message.payload.error.message));
            resolve(message.payload.response);
          };
          listeners[topic] = listener;
        });

        webViewRef.current?.injectJavaScript(`window.postMessage(${JSON.stringify(data)})`);
        return response;
      },
      reply<TPayload, TResponse>(topic: string, callback: CallbackFunction<TPayload, TResponse>) {
        const listener = async (event: MessengerEvent<TPayload>) => {
          if (!isValidSend({ message: event.data, topic })) {
            return;
          }
          let error;
          let response;
          try {
            response = await callback(event.data.payload, {
              topic: event.data.topic,
              sender: event.meta.sender,
              id: event.data.id,
            });
          } catch (error_) {
            console.error('[MESSENGER]: Error while getting response from callback: ', error_);
            error = error_;
          }

          const repliedTopic = event.data.topic.replace('>', '<');
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const data = {
            topic: repliedTopic,
            payload: { error, response },
            id: event.data.id,
          };
          webViewRef.current?.injectJavaScript(`window.postMessage(${JSON.stringify(data)})`);
        };
        listeners[topic] = listener as (event: MessengerEvent) => void;

        return () => {
          delete listeners[topic];
        };
      },
      dispatch(event) {
        if (typeof event.data.topic !== 'string') return;
        const topic = event.data.topic.slice(2);
        listeners[topic]?.(event);
      },
    }),
    url,
    tabId,
  };
};
