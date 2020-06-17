//
//  Transaction.swift
//  Rainbow
//
//  Created by Alexey Kureev on 24/01/2020.
//
//  Example:
//  {
//    "nonce": 852,
//    "protocol": "uniswap",
//    "type": "trade",
//    "minedAt": 1587390398,
//    "pending": false,
//    "address": "0x6b175474e89094c44da98b954eedeac495271d0f",
//    "balance": {
//      "amount": "0.00176391284123519",
//      "display": "0.00176 DAI"
//    },
//    "from": "0x2a1530c4c41db0b0b2bb646cb5eb1a67b7158667",
//    "hash": "0x460a4b5c4f01af6458b737a1b2e11804429a94e8bd10cae3212b89a98bd87140-1",
//    "name": "Dai",
//    "native": {
//      "amount": "0.001792323109029349483617062",
//      "display": "$0.00179"
//    },
//    "status": "received",
//    "symbol": "DAI",
//    "to": "0xf0f21ab2012731542731df194cff6c77d29cb31a"
//  }

import Foundation

@objcMembers class Transaction: NSObject {
  var originalIndex: NSNumber!;
  var transactionDescription: String!
  var title: String!
  var type: String!
  var minedAt: Date!
  var pending: Bool = false
  var address: String?
  var status: String!
  var symbol: String!
  var coinImage: String?
  var coinName: String!
  var nativeDisplay: String!
  var balanceDisplay: String!
  var from: String!
  var to: String!
  
  func isSwapped() -> Bool {
    return status == "swapped"
  }
}
