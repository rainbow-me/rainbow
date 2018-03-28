import axios from 'axios';
import * as connections from './connections';

export async function postRequest(url, body) {
    const bodyJson = body instanceof Object ? JSON.stringify(body) : body;
    console.log(`url: ${url}`);
    console.log(`bodyJson: ${bodyJson}`);

    try {
        return await axios.post(url, bodyJson);
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function updateDeviceDetails(connection, sessionToken, fcmToken, addresses) {
    const payload = {
        publicKey: connection.appPublicKey,
        addresses,
    };

    const encryptedPayload = await connections.encryptPayload(connection, payload);

    const body = {
        sessionToken,
        fcmToken,
        encryptedPayload,
    };

    const response = await postRequest(`${connection.bridgeDomain}/update-device-details`, body);
    console.log(`updateConnectionDetails response status: ${response.status} data: ${JSON.stringify(response.data)}`);
    return response.data.deviceUuid;
}

// TODO: First parse the push notification to get this info, and call this API to get the actual transaction data
// The data returned is the encryptedPayload for the transaction, which I decrypt using my privkey
// that payload contains all info needed to construct a transaction
// export async function getTransactionDetails(deviceUuid, transactionUuid) {}

// After attempting to send the transaction to the blockchain, call this API to report the success
export async function updateTransactionStatus(connection, deviceUuid, transactionUuid, success, transactionHash) {
    const payload = {
        success,
        transactionHash,
    };

    const encryptedPayload = await connections.encryptPayload(connection, payload);

    const body = {
        deviceUuid,
        transactionUuid,
        encryptedPayload,
    };

    const response = await postRequest(`${connection.bridgeDomain}/update-transaction-status`, body);
    console.log(`updateTransactionStatus response status: ${response.status} data: ${JSON.stringify(response.data)}`);
    return response.status;
}
