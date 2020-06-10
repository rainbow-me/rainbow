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
  @IBOutlet weak var walletInternalImage: UIImageView!

  @IBAction func onOpenButtonPress(_ sender: Any) {
    onItemPress(["index": row!])
  }
  
  var onRequestExpire: RCTBubblingEventBlock = { _ in }
  
  var timer: Timer? = nil
  
  private let timeout = 3600.0 // 1h
  private let interval = 1.0 // 1s
  
  override func awakeFromNib() {
    super.awakeFromNib()
    addRequestShadowLayer(walletImage)
    requestIcon.frame = requestIcon.frame.offsetBy(dx: CGFloat(0), dy: CGFloat(-0.25))
  }
  
  
  override func prepareForReuse() {
    super.prepareForReuse()
    walletInternalImage.image = nil;
    timer?.invalidate()
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
    walletInternalImage.layer.backgroundColor = UIColor.white.cgColor
    walletInternalImage.layer.cornerRadius = 12
    
    let words = request.dappName.split(separator: " ");
    let initials = words.map { $0.prefix(1).uppercased() }.joined(separator: "")
    
    if request.imageUrl != nil {
      let url = URL(string: request.imageUrl!)
      self.walletInternalImage.sd_setImage(with: url) { (image, error, cache, urls) in
        if (error != nil) {
          self.walletInternalImage.image = self.generateTextImage(String(initials), textColor: UIColor.white, backgroundColor: UIColor.RainbowTheme.Transactions.blueGreyDark)
        } else {
          self.walletInternalImage.image = image
        }
      }
  } else {
      self.walletInternalImage.image = self.generateTextImage(String(initials), textColor: UIColor.white, backgroundColor: UIColor.RainbowTheme.Transactions.blueGreyDark)
  }
    
    
    
    
    
    
  }
  
  deinit {
    timer?.invalidate()
  }
}
