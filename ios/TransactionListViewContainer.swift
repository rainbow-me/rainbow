//
//  TransactionListViewController.swift
//  Rainbow
//
//  Created by Alexey Kureev on 28/12/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

import Foundation

class TransactionListViewContainer: UIView {
  @objc var transactions: [NSDictionary] = [] {
    didSet {
      tableView.reloadData()
    }
  }
  var bridge: RCTBridge
  var tableView: UITableView
  
  init(bridge: RCTBridge) {
    self.bridge = bridge
    self.tableView = UITableView()
    
    super.init(frame: CGRect.zero)
    
    tableView.dataSource = self
    tableView.delegate = self
    tableView.rowHeight = 60
    tableView.register(UINib(nibName: "TransactionListViewCell", bundle: nil), forCellReuseIdentifier: "TransactionListViewCell")
    
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
    let identifier = "TransactionListViewCell"
    let cell = tableView.dequeueReusableCell(withIdentifier: identifier, for: indexPath) as! TransactionListViewCell
    let transaction = transactions[indexPath.row];
    
    let asset = transaction.value(forKey: "asset") as! NSDictionary
    let type = transaction.value(forKey: "type") as! String
    let native = transaction.value(forKey: "native") as! NSDictionary
    let balance = transaction.value(forKey: "balance") as! NSDictionary
    
    cell.set(transaction: Transaction(
      type: type == "send" ? "Sent" : "Received",
      coinImage: (asset.value(forKey: "icon_url") as? String),
      coinName: (asset.value(forKey: "name") as! String),
      nativeDisplay: (native.value(forKey: "display") as! String),
      balanceDisplay: (balance.value(forKey: "display") as! String)
    ))
    
    return cell;
  }
}
