//
//  TransactionListRequestViewCell.swift
//  Rainbow
//
//  Created by Alexey Kureev on 23/01/2020.
//


class TransactionListRequestViewCell: TransactionListBaseCell {
  @IBOutlet weak var openButton: UIButton!
  @IBOutlet weak var requestIcon: UILabel!
  @IBOutlet weak var transactionType: UILabel!
  @IBOutlet weak var walletName: UILabel!
  @IBOutlet weak var walletImage: CoinIconWithProgressBar!
  
  @IBAction func onOpenButtonPress(_ sender: Any) {
    onItemPress(["index": row!])
  }
  
  var onRequestExpire: RCTBubblingEventBlock = { _ in }
  
  var timer: Timer? = nil
  
  private let timeout = 3600.0 // 1h
  private let interval = 5.0 // 5s
  
  override func awakeFromNib() {
    super.awakeFromNib()
    addShadowLayer(walletImage)
    requestIcon.frame = requestIcon.frame.offsetBy(dx: CGFloat(0), dy: CGFloat(-0.25))
  }
  
  func set(request: TransactionRequest) {
    let expirationTime = request.requestedAt.addingTimeInterval(timeout)
    
    let minutes = expirationTime.minutes(from: Date())
    self.transactionType.text = "Expires in \(minutes) min"
    self.transactionType.addCharacterSpacing(kernValue: 0.5)
    
    timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true, block: { _ in
      let currentTime = Date()
      let minutes = expirationTime.minutes(from: currentTime)
      self.transactionType.text = "Expires in \(minutes) min"
      self.transactionType.addCharacterSpacing(kernValue: 0.5)
      let progress = CGFloat(
        (expirationTime.timeIntervalSince1970 - currentTime.timeIntervalSince1970) / self.timeout
      )
      if progress < 0 {
        self.timer?.invalidate()
        self.onRequestExpire(["index": self.row!])
      }
      self.walletImage.changeProgress(progress)
    })
    
    walletName.text = request.dappName
    walletName.addCharacterSpacing(kernValue: 0.5)
    walletName.setLineSpacing(lineHeightMultiple: 1.1)
    walletImage.image = generateTextImage(String(request.dappName.prefix(2).uppercased()))
    walletImage.layer.cornerRadius = walletImage.frame.width * 0.5
    
    if request.imageUrl != nil {
      let url = URL(string: request.imageUrl!)
      self.walletImage.sd_setImage(with: url)
    }
  }
  
  deinit {
    timer?.invalidate()
  }
}
