//
//  TransactionViewModel.swift
//  Rainbow
//
//  Created by Alexey Kureev on 24/01/2020.
//

import Foundation

class TransactionViewModel : NSObject, UITableViewDataSource {
  var items = [TransactionViewModelProtocol]()
  var onTransactionPress: RCTBubblingEventBlock = { _ in }
  var onRequestPress: RCTBubblingEventBlock = { _ in }
  var onRequestExpire: RCTBubblingEventBlock = { _ in }
  var sections: [TransactionSectionProtocol] {
    get {
      return items.flatMap { $0.sections }
    }
  }
  
  init(data: TransactionData) {
    super.init()
    let transactions = data.value(forKey: "transactions") as! [Transaction]
    let requests = data.value(forKey: "requests") as! [TransactionRequest]
    
    if !requests.isEmpty {
      let item = TransactionViewModelTransactionRequestItem(requests: requests)
      items.append(item)
    }
    
    if !transactions.isEmpty {
      let item = TransactionViewModelTransactionItem(transactions: transactions)
      items.append(item)
    }
  }
  
  // MARK: UITableViewDataSource
  
  func numberOfSections(in tableView: UITableView) -> Int {
    return sections.count
  }
  
  func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
    if sections.count == 0 {
      return 0
    }
    return sections[section].data.count
  }
  
  func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let item = sections[indexPath.section]
    
    if item.type == .transactions {
      let cell = tableView.dequeueReusableCell(withIdentifier: "TransactionListViewCell", for: indexPath) as! TransactionListViewCell
      let transaction = sections[indexPath.section].data[indexPath.row] as! Transaction
      
      cell.onItemPress = onTransactionPress
      cell.row = indexPath.row
      cell.set(transaction: transaction)
      cell.selectionStyle = .none
      
      return cell;
    } else {
      let cell = tableView.dequeueReusableCell(withIdentifier: "TransactionListRequestViewCell", for: indexPath) as! TransactionListRequestViewCell
      let request = sections[indexPath.section].data[indexPath.row] as! TransactionRequest
      
      cell.onItemPress = onRequestPress
      cell.onRequestExpire = onRequestExpire
      cell.row = indexPath.row
      cell.set(request: request)
      cell.selectionStyle = .none
      
      return cell;
    }
  }
}
