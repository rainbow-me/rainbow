//
//  TransactionListViewCell.swift
//  Rainbow
//
//  Created by Alexey Kureev on 28/12/2019.
//

import UIKit
import Kingfisher

class MyBoundedLabel: UILabel {
  override func drawText(in rect: CGRect) {
    super.drawText(in: rect.insetBy(dx: 2.0, dy: 2.0))
  }
}

class TransactionListViewCell: UITableViewCell {
  
  @IBOutlet weak var transactionType: UILabel!
  @IBOutlet weak var coinName: UILabel!
  @IBOutlet weak var balanceDisplay: UILabel!
  @IBOutlet weak var nativeDisplay: UILabel!
  @IBOutlet weak var coinImage: UIImageView!
  
  func set(transaction: Transaction) {
    transactionType.text = transaction.type
    coinName.text = transaction.coinName
    nativeDisplay.text = transaction.nativeDisplay
    balanceDisplay.text = transaction.balanceDisplay
    
    if transaction.coinImage != nil {
      coinImage.kf.setImage(with: URL(string: transaction.coinImage!))
    } else {
      coinImage.image = generateCoinImage(transaction.symbol)
      coinImage.layer.cornerRadius = coinImage.frame.width * 0.5
    }
  }
  
  fileprivate func generateCoinImage(_ coinCode: String) -> UIImage? {
    let frame = CGRect(x: 0, y: 0, width: 40, height: 40)
    
    let nameLabel = MyBoundedLabel(frame: frame)
    nameLabel.textAlignment = .center
    nameLabel.backgroundColor = UIColor(red: 0.23, green: 0.24, blue: 0.32, alpha: 1.0)
    nameLabel.textColor = .white
    nameLabel.font = .systemFont(ofSize: 14, weight: .regular)
    nameLabel.text = coinCode
    nameLabel.adjustsFontSizeToFitWidth = true
    
    UIGraphicsBeginImageContext(frame.size)
    if let currentContext = UIGraphicsGetCurrentContext() {
      nameLabel.layer.render(in: currentContext)
      return UIGraphicsGetImageFromCurrentImageContext()
    }
    return nil
  }
}
