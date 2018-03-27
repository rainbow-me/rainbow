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
export async function updateConnectionDetails(bridgeDomain, sessionToken, fcmToken, addresses) {
    const bodyJson = JSON.stringify({
        token: sessionToken,
        encryptedPayload: JSON.stringify({
            fcmToken,
            addresses,
        }),
    });

    const responseJson = await postRequest(`${bridgeDomain}/updateConnectionDetails`, bodyJson);
    console.log(`updateConnectionDetails response ${JSON.stringify(responseJson)}`);
}
