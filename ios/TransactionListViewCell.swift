//
//  TransactionListViewCell.swift
//  Rainbow
//
//  Created by Alexey Kureev on 28/12/2019.
//

import UIKit

class MyBoundedLabel: UILabel {
  override func drawText(in rect: CGRect) {
    super.drawText(in: rect.insetBy(dx: 2.0, dy: 2.0))
  }
}

class TransactionListViewCell: TransactionListBaseCell {
  
  @IBOutlet weak var transactionType: UILabel!
  @IBOutlet weak var transactionIcon: UIImageView!
  @IBOutlet weak var coinName: UILabel!
  @IBOutlet weak var balanceDisplay: UILabel!
  @IBOutlet weak var nativeDisplay: UILabel!
  @IBOutlet weak var coinImage: UIImageView!
  
  override func awakeFromNib() {
    super.awakeFromNib()
    addShadowLayer(coinImage)
  }
  
  func set(transaction: Transaction) {
    transactionType.text = transaction.status
    coinName.text = transaction.coinName
    nativeDisplay.text = transaction.nativeDisplay
    balanceDisplay.text = transaction.balanceDisplay
    
   
    setStatusColor(transaction)
    setCellColors(transaction)
    setText(transaction)
    setIcon(transaction)

    if transaction.symbol != nil {
      if let img = UIImage.init(named: transaction.symbol.lowercased()) {
        coinImage.image = img
      } else {
        coinImage.image = generateTextImage(transaction.symbol)
        coinImage.layer.cornerRadius = coinImage.frame.width * 0.5
      }
    }
  }
  
  private func setIcon(_ transaction: Transaction) {
    if (transaction.pending) {
       transactionIcon.image = UIImage.init(named: "spinner");
       transactionIcon.image!.accessibilityIdentifier = "spinner"
       transactionIcon.rotate()
     } else if let image = UIImage.init(named: transaction.status.lowercased()) {
       if (transactionIcon.image != nil && transactionIcon.image?.accessibilityIdentifier == "spinner") {
         transactionIcon.stopRotating()
       }
       transactionIcon.image = image
       transactionIcon.image!.accessibilityIdentifier = "static";
     }

    // Savings Overrides
    if (transaction.status.lowercased() ==  "deposited" || transaction.status.lowercased() == "withdrew") {
      transactionIcon.image = UIImage.init(named: "sunflower")
    }
    
    // Swap Overrides
    if transaction.type.lowercased() == "trade" && transaction.status.lowercased() == "sent" {
        transactionIcon.image = UIImage.init(named: "swapped")
    }
    
    // Authorize Overrides
    if transaction.type.lowercased() == "authorize" && transaction.status.lowercased() == "approved" {
      transactionIcon.image = UIImage.init(named: "self")
    }
    
    transactionIcon.tintAdjustmentMode = .normal

  }
  
  private func setStatusColor(_ transaction: Transaction) {
    let transactionColors = UIColor.RainbowTheme.Transactions.self
    var color = transactionColors.blueGreyMediumLight
    
    if transaction.pending {
      color = transactionColors.primaryBlue
    } else if transaction.type == "trade"  && transaction.status.lowercased() == "sent" {
      color = transactionColors.swapPurple
      transactionType.text = "Swapped"
    }
    
    transactionIcon.tintColor = color
    transactionType.textColor = color
  }
  
  private func setCellColors(_ transaction: Transaction) {
    coinName.alpha = 1.0
    nativeDisplay.alpha = 1.0
    
    if transaction.type == "trade" {
      if transaction.status.lowercased() == "sent" {
        coinName.alpha = 0.5
        nativeDisplay.alpha = 0.5
      }
    }
    
    switch transaction.status {
      case "Sent":
        nativeDisplay.textColor = UIColor.RainbowTheme.Transactions.dark
        nativeDisplay.text = "- " + transaction.nativeDisplay
        break
      case "Received":
        nativeDisplay.textColor = UIColor.RainbowTheme.Transactions.green
        break
      default:
        break
    }
  }
  
  private func setText(_ transaction: Transaction) {
    if let type = transaction.type {
      if (type.lowercased() == "deposit" || type.lowercased() == "withdraw") {
        if let status = transaction.status {
          if (status.lowercased() == "depositing" || status.lowercased() == "withdrawing" || status.lowercased() == "sending") {
            transactionType.text = " \(status.capitalized)";
            coinName.text = "\(transaction.symbol!)";
          } else if (status.lowercased() == "deposited" || status.lowercased() == "withdrew") {
            transactionType.text = " Savings";
            coinName.text = "\(status.capitalized) \(transaction.symbol!)";
          } else if (transaction.status.lowercased() == "failed") {
            coinName.text = "\(type.lowercased() == "withdraw" ? "Withdrew" : "Deposited") \(transaction.symbol!)";
          }
        }
      }
    }
  }
}
