//
//  TransactionData.swift
//  Rainbow
//
//  Created by Alexey Kureev on 24/01/2020.
//

import Foundation

@objc(TransactionData)
class TransactionData: NSObject {
  @objc var transactions: [Transaction] = []
  @objc var requests: [TransactionRequest] = []
}
