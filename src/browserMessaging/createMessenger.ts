import { IMessageSender } from '@rainbow-me/provider';

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
