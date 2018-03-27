import axios from 'axios';

export async function postRequest(url, bodyJson) {
    console.log(`url: ${url}`);
    console.log(`bodyJson: ${bodyJson}`);
    try {
        const response = await axios.post(url, bodyJson);

        // const response = await fetch(url, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: bodyJson,
        // });
        console.log(`status: ${response.status} data: ${JSON.stringify(response.data)}`);
        return response.data;
    } catch (error) {
        console.error(error);
        return null;
    }
}

// TODO: Check that addresses is an array of strings
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

    const responseJson = await postRequest(`${bridgeDomain}/update-device-details`, bodyJson);
    console.log(`updateConnectionDetails response ${JSON.stringify(responseJson)}`);
    return responseJson.deviceUuid;
}

// TODO: First parse the push notification to get this info, and call this API to get the actual transaction data
// The data returned is the encryptedPayload for the transaction, which I decrypt using my privkey from the server
// that payload contains all info needed to construct a transaction
// export async function getTransactionDetails(deviceUuid, transactionUuid) {}

// TODO: After attempting to send the transaction to the blockchain, call this API to report the success
// and if successful the transaction hash. Format is {deviceUuid, transactionUuid, encryptedPayload: {success: boolean, transactionHash: string}}
// Encrypted payload should be stringified and encrypted using the Dapp's pubkey
// export asunc function updateTransactionStatus(deviceUuid, transactionUuid, transactionHash, success) {}
