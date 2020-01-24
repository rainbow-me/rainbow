//
//  TransactionData.swift
//  Rainbow
//
//  Created by Alexey Kureev on 24/01/2020.
//

import Foundation

@objc class TransactionData: NSObject {
  var transactions: [Transaction] = []
  var requests: [TransactionRequest] = []
}
