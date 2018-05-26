import * as keychain from './keychain';

/*
 * Public
 */

export async function createConnection(bridgeDomain, sessionId, sessionKey, iv) {
    const connection = {
        bridgeDomain,
        sessionId,
        sessionKey,
        iv,
    };
    return connection;
}

export async function saveConnection(connection) {
    const connections = await loadConnections();
    connections[connection.sessionId] = connection;
    await saveConnections(connections);
}

export async function loadConnection(sessionId) {
    const connections = await loadConnections();
    return connections[sessionId];
}

export async function removeConnection(sessionId) {
    const connections = await loadConnections();
    delete connections[sessionId];
    await saveConnections(connections);
}

export async function removeAllConnections() {
    await removeConnections();
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
