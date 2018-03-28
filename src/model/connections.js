import { RSA } from 'react-native-rsa-native';
import * as keychain from './keychain';

/*
 * Public
 */

export async function createConnection(bridgeDomain, serverPublicKey, deviceUuid) {
    const keys = await RSA.generate();
    const connection = {
        bridgeDomain,
        serverPublicKey,
        appPublicKey: keys.public,
        appPrivateKey: keys.private,
        deviceUuid,
    };
    return connection;
}

export async function saveConnection(connection) {
    const connections = await loadConnections();
    connections[connection.deviceUuid] = connection;
    await saveConnections(connections);
}

export async function loadConnection(deviceUuid) {
    const connections = await loadConnections();
    return connections[deviceUuid];
}

export async function removeConnection(deviceUuid) {
    const connections = await loadConnections();
    delete connections[deviceUuid];
    await saveConnections(connections);
}

export async function removeAllConnections() {
    await removeConnections();
}

// Encrypts a payload to send to the server, uses the server's public key
export async function encryptPayload(connection, payload) {
    const payloadString = payload instanceof Object ? JSON.stringify(payload) : payload;
    const encryptedPayload = await RSA.encrypt(payloadString, connection.serverPublicKey);
    return encryptedPayload;
}

// Decrypts a payload received from the server, uses the app private key
export async function decryptPayload(connection, encryptedPayload) {
    const payload = await RSA.decrypt(encryptPayload, connection.appPrivateKey);
    return payload;
}

/*
 * Private
 */

const connectionsKey = 'connectionsKey';

async function loadConnections() {
    const connections = await keychain.loadObject(connectionsKey);
    return connections || {};
}

async function saveConnections(connections) {
    await keychain.saveObject(connectionsKey, connections);
}

async function removeConnections() {
    await keychain.removeObject(connectionsKey);
}
