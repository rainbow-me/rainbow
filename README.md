<p align="center">
  <img src="https://pbs.twimg.com/profile_banners/1103191459409420288/1573207178/1500x500" alt="Rainbow Wallet Banner">
</p>

<h1 align="center">🌈 Rainbow Wallet</h1>

<p align="center">
  <strong>The Ethereum wallet that lives in your pocket!</strong>
</p>

<div align="center">

[![GitHub Repo stars](https://img.shields.io/github/stars/rainbow-me/rainbow?logo=github&color=yellow)](https://github.com/rainbow-me/rainbow/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/rainbow-me/rainbow?logo=github&color=blue)](https://github.com/rainbow-me/rainbow/network/members)
[![GitHub last commit](https://img.shields.io/github/last-commit/rainbow-me/rainbow?logo=git)](https://github.com/rainbow-me/rainbow/commits/main)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Twitter](https://img.shields.io/twitter/follow/rainbowdotme?style=social)](https://twitter.com/rainbowdotme)

</div>

---

## 📲 **Download Rainbow Wallet**

✅ **[iOS App Store](https://apps.apple.com/app/apple-store/id1457119021?pt=119997837&ct=github&mt=8)**  
✅ **[Google Play Store](https://play.google.com/store/apps/details?id=me.rainbow&utm_campaign=gh&utm_source=referral&utm_medium=gh)**  
✅ **Browser Extension** ([Download](https://rainbow.me/download?utm_campaign=gh&utm_source=referral&utm_medium=gh))  
🌐 **Available for**: [Chrome](https://chrome.google.com/webstore/detail/rainbow/opfgelmcmbiajamepnmloijbpoleiama?utm_campaign=gh&utm_source=referral&utm_medium=gh), [Brave](https://chrome.google.com/webstore/detail/rainbow/opfgelmcmbiajamepnmloijbpoleiama?utm_campaign=gh&utm_source=referral&utm_medium=gh), [Edge](https://chrome.google.com/webstore/detail/rainbow/opfgelmcmbiajamepnmloijbpoleiama?utm_campaign=gh&utm_source=referral&utm_medium=gh), [Firefox](https://addons.mozilla.org/en-US/firefox/addon/rainbow-extension/?utm_campaign=gh&utm_source=referral&utm_medium=gh), and [Arc](https://chrome.google.com/webstore/detail/rainbow/opfgelmcmbiajamepnmloijbpoleiama?utm_campaign=gh&utm_source=referral&utm_medium=gh).

---

## ⚙️ **Setup**

### ✅ **General Requirements**
- Install **NVM** or **Node.js 16**: [NVM GitHub](https://github.com/creationix/nvm)
- Install dependencies:

📌 Run:
```sh
yarn setup
```

---

## 🏗 **Installation Guide**

### **MacOS Setup**
1️⃣ **Install XCode** – [Download Here](https://developer.apple.com/xcode/)  
2️⃣ **Install Watchman**:
📌 Run:
```sh
brew install watchman
```
3️⃣ **Install CocoaPods**:
📌 Run:
```sh
sudo gem install cocoapods
```
4️⃣ **Install Required Dependencies**:
📌 Run:
```sh
yarn install-bundle && yarn install-pods
```

---

### **Linux Setup**
1️⃣ **Install Dependencies**:
📌 Run:
```sh
sudo apt install libsecret-tools watchman
```
2️⃣ **Follow React Native Setup** – [Guide Here](https://reactnative.dev/docs/environment-setup)  
   _(Includes installing Android Studio, SDK, Emulator, etc.)_
3️⃣ **Ensure Android Virtual Device (AVD) is Available**  
   _or use a physical device._

---

## 🚀 **Development**

### **Preflight Checklist**
1️⃣ **Use Correct Node Version**:
📌 Run:
```sh
nvm use
```
2️⃣ **Set Up `.env` File** (Use `env.example` as a guide).  
   🔹 _Some features are not yet accessible as we're working with our **Data Providers** to provide open-source API keys._  

3️⃣ **Generate API Keys**  
You'll need API keys from the following services to interact with certain features. Here are some helpful resources:  
- 🔹 **[Etherscan API](https://etherscan.io/apis)**  
- 🔹 **[Infura API](https://infura.io/)**  
- 🔹 **[ETH Gas Station API](https://docs.ethgasstation.info/)**  
- 🔹 **[Imgix API](https://www.imgix.com/)**  

4️⃣ **Add `google-services.json`**  
Ensure that the `google-services.json` file is placed in the relevant project directory to avoid compile errors.  
- You can use either:  
  - ✅ The **live Google Services configuration** (for internal development).  
  - ✅ A **self-provided configuration** for a personal Firebase project (third-party contributors).  
- **Important:** The file must be registered under the package name: `me.rainbow`.  

---

### 🖥 **Running on MacOS**

**Note:** Darwin versions of the application can only be developed/built on Darwin platforms with XCode.

📌 Start the React Native Webserver:
```sh
yarn start
```
📌 Open XCode and run:
```sh
open rainbow-wallet/ios/Rainbow.xcworkspace
```
📌 Click **Play** ▶️ to run the project.

---

### 📱 **Running on Linux**

**Note:** Linux development environments cannot develop or build Darwin versions of the project.

📌 Start React Native Webserver:
```sh
yarn start
```
📌 Build & Install the Android Debug Version:
```sh
yarn android
```

---

## 📜 **License**
This project is licensed under **MIT License**.  
See [LICENSE](LICENSE) for details.

---

## 📬 **Stay Connected**
<p align="left">
  <a href="https://x.com/rainbowdotme">
    <img src="https://img.shields.io/badge/Twitter-000000?logo=x&logoColor=white&style=for-the-badge" alt="Twitter (X)">
  </a>
</p>

