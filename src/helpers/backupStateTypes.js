export default {
  done: 'done', // Backup flow completed, no action required
  immediate: 'immediate', // Existing user needs to backup the wallet ASAP
  pending: 'pending', // Backup flow is pending and needs to be completed
  ready: 'ready', // Backup flow wasn't triggered yet (new users)
};
