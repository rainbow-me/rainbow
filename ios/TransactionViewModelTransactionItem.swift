//
//  TransactionViewModelTransactionItem.swift
//  Rainbow
//
//  Created by Alexey Kureev on 24/01/2020.
//

import Foundation

class TransactionViewModelTransactionItem : TransactionViewModelProtocol {
  var type: TransactionSectionTypes = .transactions
  var transactions: [Transaction]
  var sectionTitle: String? = nil
  
  init(title: String, transactions: [Transaction]) {
    self.sectionTitle = title
    self.transactions = transactions
  }
}
