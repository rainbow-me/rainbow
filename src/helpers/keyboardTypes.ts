export enum KeyboardType {
  default = 'default',
  password = 'password',
}

// This must be kept until everywhere using this file updates to TypeScript.
export default {
  default: 'default', // any keyboard without any accessory bar or autofill/autocomplete bar
  password: 'password', // keyboard with the "password" autofill bar above it
};
