export default function createActionCreator(type) {
  const result = (payload) => ({
    type,
    payload,
  });

  result.type = type;

  return result;
}
