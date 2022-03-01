//
//  Constants.swift
//  Rainbow
//
//  Created by Ben Goldberg on 11/20/21.
//  Copyright © 2021 Rainbow. All rights reserved.
//

import Foundation
import UIKit

@available(iOS 14.0, *)
struct Constants {
  static let eth = TokenDetails(name: "Ethereum", coinGeckoId: "ethereum", symbol: "ETH", color: "#282C2C", address: "eth")
  
  static let topTokenAddresses = ["0xd7c49cee7e9188cca6ad8ff264c1da2e69d4cf3b": 48, "0xe1be5d3f34e89de342ee97e6e90d405884da6c67": 10, "0x45804880de22913dafe09f4980848ece6ecbaf78": 101, "0x3103df8f05c4d8af16fd22ae63e406b97fec6938": 47, "0x514910771af9ca656af840dff83e8264ecf986ca": 4, "0x85eee30c52b0b379b046fb0f85f4f3dc3009afec": 96, "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2": 33, "0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0": 16, "0xff56cc6b1e6ded347aa0b7676c85ab0b3d08b0fa": 100, "0xe41d2489571d322189246dafa5ebde1f4699f498": 55, "0xf34960d9d60be18cc1d5afc1a6f012a723a28811": 43, "0xaea46a60368a7bd060eec7df8cba43b7ef41ad85": 76, "0x7dd9c5cba05e151c895fde1cf355c9a1d5da6429": 81, "0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3": 29, "0x8dae6cb04688c62d939ed9b68d32bc62e49970b1": 46, "0x8400d94a5cb0fa0d041a3788e395285d61c9ee5e": 98, "0xcca0c9c383076649604ee31b20248bc04fdf61ca": 97, "0xc00e94cb662c3520282e6f5717214004a7f26888": 36, "0x3883f5e181fccaf8410fa61e12b59bad963fb645": 13, "0xeb4c2781e4eba804ce9a9803c67d0893436bb27d": 53, "0x8207c1ffc5b6804f6024322ccf34f29c3541ae26": 91, "0x6c6ee5e31d828de241282b9606c8e98ea48526e2": 31, "0x0fd10b9899882a6f2fcb5c371e17e70fdee00c38": 86, "0x4575f41308ec1483f3d399aa9a2826d74da13deb": 93, "0x6f259637dcd74c767781e37bc6133cd6a68aa161": 44, "0x92d6c1e31e14520e676a687f0a93788b716beff5": 57, "0x16631e53c20fd2670027c6d53efe2642929b285c": 34, "0xe83cccfabd4ed148903bf36d4283ee7c8b3494d1": 30, "0x6fb3e0a217407efff7ca062d46c26e5d60a14d69": 41, "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd": 90, "0x8a2279d4a90b6fe1c4b30fa660cc9f926797baa2": 74, "0xd850942ef8811f2a866692a623011bde52a462c1": 7, "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f": 39, "0x467bccd9d29f223bce8043b84e8c8b282827790f": 49, "0xe452e6ea2ddeb012e20db73bf5d3863a3ac8d77a": 37, "0xfa1a856cfa3409cfa145fa4e20eb270df3eb21ab": 64, "0xc944e90c64b2c07662a292be6244bdf05cda44a7": 17, "0xb8c77482e45f1f44de1745f52c74426c631bdd52": 2, "0x23b608675a2b2fb1890d3abbd85c5775c51691d5": 80, "0xd26114cd6ee289accf82350c8d8487fedb8a0c07": 32, "0x6810e776880c02933d47db1b9fc05908e5386b96": 72, "0x853d955acef822db058eb8505911ed77f175b99e": 65, "0xc7283b66eb1eb5fb86327f08e1b5816b0720212b": 79, "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": 5, "0x55296f69f40ea6d20e478533c15a6b08b654e758": 68, "0x111111111117dc0aa78b770fa6a738034120c302": 69, "0xb62132e35a6c13ee1ee0f84dc5d40bad8d815206": 40, "0x3506424f91fd33084466f402d5d97f05f8e3b4af": 27, "0x967da4048cd07ab37855c090aaf366e4ce1b9f48": 92, "0x58b6a8a3302369daec383334672404ee733ab239": 42, "0x767fe9edc9e0df98e07454847909b5e959d7ca0e": 71, "0x744d70fdbe2ba4cf95131626614a1763df805b9e": 94, "0x39bb259f66e1c59d5abef88375979b4d20d98022": 60, "0xe28b3b32b6c345a34ff64674606124dd5aceca30": 82, "0xfc82bb4ba86045af6f327323a46e80412b91b27d": 103, "0x761d38e5ddf6ccf6cf7c55759d5210750b5d60f3": 62, "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984": 6, "0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec": 78, "0xba11d00c5f74255f56a5e366f4f77f5a186d7f55": 95, "0x4a220e6096b25eadb88358cb44068a3248254675": 19, "0x8c15ef5b4b21951d50e53e4fbda8298ffad25057": 85, "0xc18360217d8f7ab5e7c516566761ea12ce7f9d72": 56, "0x2af5d2ad76741191d15dfe7bf6ac92d4bd912ca3": 20, "0x75231f58b43240c9718dd58b4967c5114342a86c": 9, "0x04fa0d235c4abf4bcf4787af4cf447de572ef828": 59, "0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b": 8, "0xbbbbca6a901c926f240b89eacb641d8aec7aeafd": 18, "0x3597bfd533a99c9aa083587b074434e61eb0a258": 77, "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c": 54, "0xfd09cf7cfffa9932e33668311c4777cb9db3c9be": 22, "0x6e1a19f235be7ed8e3369ef73b196c07257494de": 11, "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2": 25, "0xa1faa113cbe53436df28ff0aee54275c13b40975": 84, "0xaaaebe6fe48e54f431b0c390cfaf0b017d09d42d": 38, "0x0f2d719407fdbeff09d87557abb7232601fd9f29": 89, "0x3845badade8e6dff049820680d1f14bd3903a5d0": 35, "0xff20817765cb7f73d4bde2e66e067e58d11095c2": 24, "0xaa7a9ca87d3694b5755f213b5d04094b8d0f0a6f": 66, "0xba9d4199fab4f26efe3551d490e3821486f135ba": 75, "0x0d8775f648430679a709e98d2b0cb6250d2887ef": 45, "0x0316eb71485b0ab14103307bf65a021042c6d380": 26, "0x8ce9137d39326ad0cd6491fb5cc0cba0e089b6a9": 88, "0x05f4a42e251f2d52b8ed15e9fedaacfcef1fad27": 50, "0x4691937a7508860f876c9c0a2a617e7d9e945d4b": 67, "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0": 63, "0x2b591e99afe9f32eaa6214f7b7629768c40eeb39": 3, "0x799a4202c12ca952cb311598a024c80ed371a41e": 23, "0xae7ab96520de3a18e5e111b5eaab095312d7fe84": 15, "0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c": 28, eth.address: 1, "0x69af81e73a73b40adf4f3d4223cd9b1ece623074": 83, "0xfd1e80508f243e64ce234ea88a5fd2827c71d4b7": 73, "0x41ab1b6fcbb2fa9dced81acbdec13ea6315f2bf2": 52, "0x4f9254c83eb525f9fcf346490bbb3ed28a81c667": 70, "0x4e15361fd6b4bb609fa63c81a2be19d873717870": 14, "0xb4efd85c19999d84251304bda99e90b92300bd93": 61, "0x476c5e26a75bd202a9683ffd34359c0cc15be0ff": 58, "0x607f4c5bb672230e8672085532f7e901544a7375": 102, "0xf16e81dce15b08f326220742020379b855b87df9": 99, "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e": 51, "0xd291e7a03283640fdc51b121ac401383a46cc623": 87]
  
  struct Currencies {
    static let eth = CurrencyDetails(identifier: "eth", display: "Ethereum", symbol: "Ξ", rank: 1)
    static let usd = CurrencyDetails(identifier: "usd", display: "United States Dollar", symbol: "$", rank: 2)
    static let eur = CurrencyDetails(identifier: "eur", display: "Euro", symbol: "€", rank: 3)
    static let gbp = CurrencyDetails(identifier: "gbp", display: "British Pound", symbol: "£", rank: 4)
    static let aud = CurrencyDetails(identifier: "aud", display: "Australian Dollar", symbol: "A$", rank: 5)
    static let cny = CurrencyDetails(identifier: "cny", display: "Chinese Yuan", symbol: "¥", rank: 6)
    static let krw = CurrencyDetails(identifier: "krw", display: "South Korean Won", symbol: "₩", rank: 7)
    static let rub = CurrencyDetails(identifier: "rub", display: "Russian Ruble", symbol: "₽", rank: 8)
    static let inr = CurrencyDetails(identifier: "inr", display: "Indian Rupee", symbol: "₹", rank: 9)
    static let jpy = CurrencyDetails(identifier: "jpy", display: "Japanese Yen", symbol: "¥", rank: 10)
    static let `try` = CurrencyDetails(identifier: "try", display: "Turkish Lira", symbol: "₺", rank: 11)
    static let cad = CurrencyDetails(identifier: "cad", display: "Canadian Dollar", symbol: "CA$", rank: 12)
    static let nzd = CurrencyDetails(identifier: "nzd", display: "New Zealand Dollar", symbol: "NZ$", rank: 13)
    static let zar = CurrencyDetails(identifier: "zar", display: "South African Rand", symbol: "R", rank: 14)
  }
   
  static let currencyDict = [Currencies.eth.identifier: Currencies.eth,
                             Currencies.usd.identifier: Currencies.usd,
                             Currencies.eur.identifier: Currencies.eur,
                             Currencies.gbp.identifier: Currencies.gbp,
                             Currencies.aud.identifier: Currencies.aud,
                             Currencies.cny.identifier: Currencies.cny,
                             Currencies.krw.identifier: Currencies.krw,
                             Currencies.rub.identifier: Currencies.rub,
                             Currencies.inr.identifier: Currencies.inr,
                             Currencies.jpy.identifier: Currencies.jpy,
                             Currencies.try.identifier: Currencies.try,
                             Currencies.cad.identifier: Currencies.cad,
                             Currencies.nzd.identifier: Currencies.nzd,
                             Currencies.zar.identifier: Currencies.zar]
}
