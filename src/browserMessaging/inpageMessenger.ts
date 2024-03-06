// dapp tx flow in bx
// - inpage => content script => bg => popup

import { Messenger } from './createMessenger';

// dapp tx flow in mobile
// - inpage => bg => popup

// const messengerProviderRequest = async (
//     messenger: Messenger,
//     request: ProviderRequestPayload,
//   ) => {
//     const { addPendingRequest } = pendingRequestStore.getState();
//     // Add pending request to global background state.
//     addPendingRequest(request);

//     // Wait for response from the popup.
//     const payload: unknown | null = await new Promise((resolve) =>
//       // eslint-disable-next-line no-promise-executor-return
//       messenger.reply(`message:${request.id}`, async (payload) =>
//         resolve(payload),
//       ),
//     );
//     if (!payload) {
//       throw new UserRejectedRequestError('User rejected the request.');
//     }
//     return payload;
//   };
