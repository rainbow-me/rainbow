//
//  TransactionListRequestViewCell.swift
//  Rainbow
//
//  Created by Alexey Kureev on 23/01/2020.
//

import Kingfisher

class TransactionListRequestViewCell: UITableViewCell {
  @IBOutlet weak var openButton: UIView!
  @IBOutlet weak var transactionType: UILabel!
  @IBOutlet weak var walletName: UILabel!
  @IBOutlet weak var walletImage: UIImageView!
  
  private let duration = 0.1
  private let scaleTo: CGFloat = 0.97
  private let hapticType = "select"
  
  var timer: Timer? = nil
  var onItemPress: (Dictionary<AnyHashable, Any>) -> Void = { _ in }
  var row: Int? = nil
  
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
  
  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapStart(
      duration: duration,
      options: .curveEaseOut,
      scale: scaleTo,
      useHaptic: hapticType
    )
  }
  
  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapEnd(duration: duration, options: .curveEaseOut, scale: scaleTo)
    if row != nil {
      onItemPress(["index":row!])
    }
  }
  
  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapEnd(duration: duration, options: .curveEaseOut, scale: scaleTo)
  }
  
  deinit {
    timer?.invalidate()
  }
}
