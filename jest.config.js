module.exports = {
  preset: "react-native",
  setupFiles: [
    "./config/test/jest-setup.js"
  ],
  transform: {
      "\\.[jt]sx?$": "ts-jest"
  },
}
