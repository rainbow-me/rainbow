import * as keychain from './keychain';

/*
 * Public
 */

export async function createConnection(bridgeDomain, peerId, sessionKey, iv) {
  const connection = {
    bridgeDomain,
    peerId,
    sessionKey,
    iv,
  };
  return connection;
}

export async function saveConnection(connection) {
  const connections = await loadConnections();
  connections[connection.peerId] = connection;
  await saveConnections(connections);
}

export async function loadConnection(peerId) {
  const connections = await loadConnections();
  return connections[peerId];
}

export async function removeConnection(peerId) {
  const connections = await loadConnections();
  delete connections[peerId];
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
