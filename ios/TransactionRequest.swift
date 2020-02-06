//
//  TransactionRequest.swift
//  Rainbow
//
//  Created by Alexey Kureev on 24/01/2020.
//
//{
//  "clientId": "9ecf92ef-40e3-4dd7-a923-3ef37109e71d",
//  "dappName": "WalletConnect Example",
//  "displayDetails": {
//    "request": {},
//    "timestampInMs": 1579738528463
//  },
//  "imageUrl": "https://example.walletconnect.org/favicon.ico",
//  "payload": {
//    "id": 1579738528463854,
//    "jsonrpc": "2.0",
//    "method": "eth_sendTransaction",
//    "params": []
//  }
//}

import Foundation

@objcMembers class TransactionRequest: NSObject {
  var payloadId: NSNumber!
  var clientId: String!
  var dappName: String!
  var imageUrl: String!
  var requestedAt: Date!
}
