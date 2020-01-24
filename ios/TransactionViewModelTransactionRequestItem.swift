//
//  TransactionViewModelTransactionRequestItem.swift
//  Rainbow
//
//  Created by Alexey Kureev on 24/01/2020.
//

import Foundation

class TransactionViewModelTransactionRequestItem : TransactionViewModelProtocol {
  var type: TransactionSectionTypes = .requests
  var sectionTitle: String? = "Requests"
  
  var requests: [TransactionRequest]
  
  init(requests: [TransactionRequest]) {
    self.requests = requests;
  }
}
