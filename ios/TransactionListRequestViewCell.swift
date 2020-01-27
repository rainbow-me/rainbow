//
//  TransactionListRequestViewCell.swift
//  Rainbow
//
//  Created by Alexey Kureev on 23/01/2020.
//

import Kingfisher

class TransactionListRequestViewCell: TransactionListBaseCell {
  @IBOutlet weak var openButton: UIView!
  @IBOutlet weak var transactionType: UILabel!
  @IBOutlet weak var walletName: UILabel!
  @IBOutlet weak var walletImage: UIImageView!
  
  var timer: Timer? = nil
  
  override func awakeFromNib() {
    super.awakeFromNib()
    addShadowLayer(walletImage)
  }
  
  func set(request: TransactionRequest) {
    let expirationTime = request.requestedAt.addingTimeInterval(3600.0)
    
    let minutes = expirationTime.minutes(from: Date())
    self.transactionType.text = "Expires in \(minutes) min"

    timer = Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true, block: { _ in
      let minutes = expirationTime.minutes(from: Date())
      self.transactionType.text = "Expires in \(minutes) min"
    })
    
    walletName.text = request.dappName
    
    walletImage.image = generateTextImage(String(request.dappName.prefix(2).uppercased()))
    walletImage.layer.cornerRadius = walletImage.frame.width * 0.5

    if request.imageUrl != nil {
      let url = URL(string: request.imageUrl!)
      self.walletImage.kf.setImage(with: url)
    }
  }
  
  deinit {
    timer?.invalidate()
  }
}
