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

extension UIColor {
    convenience init(red: Int, green: Int, blue: Int) {
        let newRed = CGFloat(red)/255
        let newGreen = CGFloat(green)/255
        let newBlue = CGFloat(blue)/255
        
        self.init(red: newRed, green: newGreen, blue: newBlue, alpha: 1.0)
    }
}


class TransactionListViewCell: TransactionListBaseCell {
  // TODO use single source of truth
  static var avatarColors = [
    UIColor.init(red: 255, green: 73, blue: 74),
    UIColor.init(red: 2, green: 211, blue: 255),
    UIColor.init(red: 251, green: 96, blue: 196),
    UIColor.init(red: 63, green: 106, blue: 255),
    UIColor.init(red: 255, green: 217, blue: 99),
    UIColor.init(red: 177, green: 64, blue: 255),
    UIColor.init(red: 64, green: 235, blue: 193),
    UIColor.init(red: 244, green: 110, blue: 56),
    UIColor.init(red: 109, green: 126, blue: 143),
]
  
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
    transactionType.text = transaction.title
    coinName.text = transaction.transactionDescription
    nativeDisplay.text = transaction.nativeDisplay
    balanceDisplay.text = transaction.balanceDisplay

    balanceDisplay.addCharacterSpacing()

    setStatusColor(transaction)
    setBottomRowStyles(transaction)
    setTextSpacing()
    setIcon(transaction)

    transactionType.isAccessibilityElement = true;
    if transaction.title != nil && transaction.transactionDescription != nil {
      transactionType.accessibilityIdentifier = "\(transaction.title!)-\(transaction.transactionDescription!)";
    }

    
    if transaction.symbol != nil {
      if let img = UIImage.init(named: transaction.symbol.lowercased()) {
        coinImage.image = img
      } else if transaction.address != nil {
        let url = URL(string: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/\(transaction.address!)/logo.png");
        coinImage.sd_setImage(with: url) { (image, error, cache, urls) in
          if (error != nil) {
            let colorIndex = transaction.symbol.lowercased().utf8.compactMap{ Int($0) }.reduce(0, +) % TransactionListViewCell.avatarColors.count
            let color = TransactionListViewCell.avatarColors[colorIndex]
            self.coinImage.image = self.generateTextImage(transaction.symbol, backgroundColor: color)
          } else {
            self.coinImage.image = image
            self.coinImage.layer.backgroundColor = UIColor.white.cgColor
          }
          self.coinImage.layer.cornerRadius = self.coinImage.frame.width * 0.5
        }
      }
    }
  }
  
  private func setIcon(_ transaction: Transaction) {
    var iconFrame = CGRect(x: 69, y: 11, width: 12, height: 12)
    var statusFrame = CGRect(x: 81, y: 9, width: 206, height: 16)
    
    if (transaction.pending) {
      statusFrame = CGRect(x: 85, y: 9, width: 206, height: 16)
      transactionIcon.image = UIImage.init(named: "spinner");
      transactionIcon.image!.accessibilityIdentifier = "spinner"
      transactionIcon.rotate()
     } else if let image = UIImage.init(named: transaction.status) {
       if (transactionIcon.image != nil && transactionIcon.image?.accessibilityIdentifier == "spinner") {
         transactionIcon.stopRotating()
       }
       transactionIcon.image = image
       transactionIcon.image!.accessibilityIdentifier = "static";
     }

    // Purchase Overrides
    if transaction.type == "purchase" && transaction.status == "purchased" {
      transactionIcon.image = UIImage.init(named: "received")
    }

    // Authorize Overrides
    if transaction.type == "authorize" && transaction.status == "approved" {
      transactionIcon.image = UIImage.init(named: "self")
    }
    
    // Failed Overrides
    if transaction.status == "failed" {
      statusFrame = CGRect(x: 85, y: 9, width: 206, height: 16)
    }
    
    // Savings Overrides
    if (transaction.status ==  "deposited" || transaction.status == "withdrew") {
      transactionIcon.image = UIImage.init(named: "sunflower")
      iconFrame = CGRect(x: 69, y: 10, width: 13, height: 14)
      statusFrame = CGRect(x: 82, y: 9, width: 206, height: 16)
    }
    
    // Self Overrides
    if (transaction.status ==  "self" || transaction.status == "approved") {
      statusFrame = CGRect(x: 80, y: 9, width: 206, height: 16)
    }
    
    // Sent Overrides
    if transaction.status == "sent" {
      transactionIcon.image = UIImage.init(named: "sent")
      statusFrame = CGRect(x: 82, y: 9, width: 206, height: 16)
    }
    
    // Swap Overrides
    if transaction.status == "swapped" {
        transactionIcon.image = UIImage.init(named: "swapped")
        statusFrame = CGRect(x: 84, y: 9, width: 206, height: 16)
    }
    if transaction.status == "swapping" {
        transactionIcon.image = UIImage.init(named: "swapping")
    }
    
    transactionIcon.tintAdjustmentMode = .normal
    transactionIcon.frame = iconFrame
    transactionType.frame = statusFrame

  }
  
  private func setStatusColor(_ transaction: Transaction) {
    let transactionColors = UIColor.RainbowTheme.Transactions.self
    var color = transactionColors.blueGreyDark70
    
    if transaction.pending {
      if transaction.status == "swapping" {
        color = transactionColors.swapPurple
      } else {
        color = transactionColors.appleBlue
      }
    } else if transaction.isSwapped() {
      color = transactionColors.swapPurple
    }
    
    transactionIcon.tintColor = color
    transactionType.textColor = color
    transactionType.addCharacterSpacing(kernValue: 0.5)
  }
  
  private func setBottomRowStyles(_ transaction: Transaction) {
    let transactionColors = UIColor.RainbowTheme.Transactions.self
    var coinNameColor = transactionColors.dark
    var nativeDisplayColor = transactionColors.blueGreyDark50
    var nativeDisplayFont = UIFont(name: "SFRounded-Regular", size: 16)
    
    if transaction.status == "sent" {
      nativeDisplayColor = transactionColors.dark
      nativeDisplay.text = "- " + transaction.nativeDisplay
    }
    if transaction.status == "received" || transaction.status == "purchased" {
      nativeDisplayColor = transactionColors.green
      nativeDisplayFont = UIFont(name: "SFRounded-Medium", size: 16)
    }
    if transaction.status == "swapped" {
      coinNameColor = transactionColors.blueGreyDark50
      nativeDisplayColor = transactionColors.dark
      nativeDisplay.text = "- " + transaction.nativeDisplay
    }
    if transaction.type == "trade" && transaction.status == "received" {
      nativeDisplayColor = transactionColors.swapPurple
      nativeDisplayFont = UIFont(name: "SFRounded-Medium", size: 16)
    }
    
    coinName.textColor = coinNameColor
    nativeDisplay.textColor = nativeDisplayColor
    nativeDisplay.font = nativeDisplayFont
    nativeDisplay.addCharacterSpacing()
    nativeDisplay.setLineSpacing(lineHeightMultiple: 1.1)
  }

  private func setTextSpacing() {
    transactionType.addCharacterSpacing(kernValue: 0.5);
    if transactionType.text == "Savings" {
      transactionType.text = " " + transactionType.text!
    }
    coinName.addCharacterSpacing(kernValue: 0.5);
    coinName.setLineSpacing(lineHeightMultiple: 1.1)
    transactionType.addCharacterSpacing(kernValue: 0.5);
  }
}
