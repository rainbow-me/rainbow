export default function createActionCreateor(type) {
  return (payload) => ({ payload, type });
}
