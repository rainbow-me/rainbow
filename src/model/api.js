import axios from 'axios';

export async function postRequest(url, bodyJson) {
    console.log(`url: ${url}`);
    console.log(`bodyJson: ${bodyJson}`);
    try {
        return await axios.post(url, bodyJson);
    } catch (error) {
        console.error(error);
        return null;
    }
}

// TODO: encryptedPayload should include a publicKey field with this device's RSA pubkey
// TODO: encrypt entire encryptedPayload string with Dapp's pubkey
export async function updateDeviceDetails(bridgeDomain, sessionToken, fcmToken, addresses) {
    const bodyJson = JSON.stringify({
        sessionToken,
        fcmToken,
        encryptedPayload: JSON.stringify({
            addresses,
        }),
    });

    const response = await postRequest(`${bridgeDomain}/update-device-details`, bodyJson);
    console.log(`updateConnectionDetails response status: ${response.status} data: ${JSON.stringify(response.data)}`);
    return response.data.deviceUuid;
}

// TODO: First parse the push notification to get this info, and call this API to get the actual transaction data
// The data returned is the encryptedPayload for the transaction, which I decrypt using my privkey
// that payload contains all info needed to construct a transaction
// export async function getTransactionDetails(deviceUuid, transactionUuid) {}

// After attempting to send the transaction to the blockchain, call this API to report the success
// TODO: Encrypted payload should be stringified and encrypted using the Dapp's pubkey
export async function updateTransactionStatus(bridgeDomain, deviceUuid, transactionUuid, success, transactionHash) {
    const bodyJson = JSON.stringify({
        deviceUuid,
        transactionUuid,
        encryptedPayload: JSON.stringify({
            success,
            transactionHash,
        }),
    });

    const response = await postRequest(`${bridgeDomain}/update-transaction-status`, bodyJson);
    console.log(`updateTransactionStatus response status: ${response.status} data: ${JSON.stringify(response.data)}`);
    return response.status;
}
