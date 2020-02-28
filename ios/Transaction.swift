//
//  Transaction.swift
//  Rainbow
//
//  Created by Alexey Kureev on 24/01/2020.
//
// Example:
// {
//    balance =     {
//        amount = "0.00040681643538399";
//        display = "0.000407 ETH";
//    };
//    from = 0x91d6e260a5965a3c33d5bc4bf4adcf96c449ed2e;
//    hash = "0x51bae6f008cfa5f3d36c890d30d9c10eb50fb2962f08c3f6abe7e49290e00baa-0";
//    minedAt = 1563165543;
//    name = Ethereum;
//    native =     {
//        amount = "0.0911065407042445605";
//        display = "$0.0911";
//    };
//    nonce = 3229;
//    pending = 0;
//    protocol = "<null>";
//    status = received;
//    symbol = ETH;
//    to = 0xf0f21ab2012731542731df194cff6c77d29cb31a;
//    type = receive;
// }

import Foundation

@objcMembers class Transaction: NSObject {
  var status: String!
  var symbol: String!
  var coinImage: String?
  var coinName: String!
  var nativeDisplay: String!
  var balanceDisplay: String!
  var from: String!
  var to: String!
  var type: String!
  var pending: Bool = false
  var minedAt: Date!
}
