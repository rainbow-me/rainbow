//
//  TransactionListViewController.swift
//  Rainbow
//
//  Created by Alexey Kureev on 28/12/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

class TransactionListViewContainer: UIView {
  
  var transactions: [Transaction] = []
  var bridge: RCTBridge
  var tableView: UITableView
  
  init(bridge: RCTBridge) {
    self.bridge = bridge
    self.tableView = UITableView()
    
    super.init(frame: CGRect.zero)
    
    tableView.dataSource = self
    tableView.delegate = self
    tableView.register(TransactionListViewCell.self, forCellReuseIdentifier: "TransactionListViewCell")
    
    transactions = fetchData()
    
    addSubview(tableView)
  }
  
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
  
  override func layoutSubviews() {
    tableView.frame = self.bounds
  }
}

extension TransactionListViewContainer: UITableViewDataSource, UITableViewDelegate {
  func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
    return transactions.count
  }
  
  func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: "TransactionListViewCell") as! TransactionListViewCell
    let transaction = transactions[indexPath.row]
    cell.set(transaction: transaction)
    return cell
  }
}

extension TransactionListViewContainer {
  func fetchData() -> [Transaction] {
    return [Transaction(type: "Sent"), Transaction(type: "Received")]
  }
}

