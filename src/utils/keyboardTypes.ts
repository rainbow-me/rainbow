export enum KeyboardType {
  default = 'default',
  numpad = 'numpad',
  password = 'password',
}

// This must be kept until everywhere using this file updates to TypeScript.
export default {
  // any keyboard without any accessory bar or autofill/autocomplete bar
  default: 'default',
  // keyboard with numpad
  numpad: 'numpad',
  // keyboard with the "password" autofill bar above it
  password: 'password',
};
