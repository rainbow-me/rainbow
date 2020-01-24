//
//  Extensions.swift
//  Rainbow
//
//  Created by Alexey Kureev on 13/01/2020.
//

fileprivate func generateHapticFeedback(_ hapticEffect: String) {
  switch hapticEffect {
  case "error":
    let generator = UINotificationFeedbackGenerator()
    generator.notificationOccurred(.error)
    
  case "success":
    let generator = UINotificationFeedbackGenerator()
    generator.notificationOccurred(.success)
    
  case "warning":
    let generator = UINotificationFeedbackGenerator()
    generator.notificationOccurred(.warning)
    
  case "light":
    let generator = UIImpactFeedbackGenerator(style: .light)
    generator.impactOccurred()
    
  case "medium":
    let generator = UIImpactFeedbackGenerator(style: .medium)
    generator.impactOccurred()
    
  case "heavy":
    let generator = UIImpactFeedbackGenerator(style: .heavy)
    generator.impactOccurred()
  default:
    let generator = UISelectionFeedbackGenerator()
    generator.selectionChanged()
  }
}

extension UIView {
  static func fromNib<T: UIView>() -> T {
    return Bundle(for: T.self).loadNibNamed(String(describing: T.self), owner: nil, options: nil)![0] as! T
  }
  
  func animateQuickTap(
    duration: TimeInterval = 0.15,
    options: UIView.AnimationOptions = .curveEaseInOut,
    scale: CGFloat = 0.97
  ) {
    UIView.animate(withDuration: duration, delay: 0, options: [options, .autoreverse], animations: {
      self.transform = CGAffineTransform(scaleX: scale, y: scale)
    })
  }
  
  func animateTapStart(
    duration: TimeInterval = 0.15,
    options: UIView.AnimationOptions = .curveEaseInOut,
    scale: CGFloat = 0.97,
    useHaptic: String? = nil
  ) {
    if useHaptic != nil {
      generateHapticFeedback(useHaptic!)
    }
    UIView.animate(withDuration: duration, delay: 0, options: options, animations: {
      self.transform = CGAffineTransform(scaleX: scale, y: scale)
    })
  }
  
  func animateTapEnd(duration: TimeInterval = 0.15, options: UIView.AnimationOptions = .curveEaseInOut, scale: CGFloat = 0.97) {
    UIView.animate(withDuration: duration, delay: 0, usingSpringWithDamping: 0.3, initialSpringVelocity: 10.0, options: options, animations: {
      self.transform = .identity
    })
  }
}

extension UITableViewCell {
  func generateTextImage(_ text: String) -> UIImage? {
    let frame = CGRect(x: 0, y: 0, width: 120, height: 120)
    
    let nameLabel = MyBoundedLabel(frame: frame)
    nameLabel.textAlignment = .center
    nameLabel.backgroundColor = UIColor(red: 0.23, green: 0.24, blue: 0.32, alpha: 1.0)
    nameLabel.textColor = .white
    nameLabel.font = .systemFont(ofSize: 42, weight: .regular)
    nameLabel.text = text
    nameLabel.adjustsFontSizeToFitWidth = true
    
    UIGraphicsBeginImageContext(frame.size)
    if let currentContext = UIGraphicsGetCurrentContext() {
      nameLabel.layer.render(in: currentContext)
      return UIGraphicsGetImageFromCurrentImageContext()
    }
    return nil
  }
}

extension Date {
  func days(from date: Date) -> Int {
    return Calendar.current.dateComponents([.day], from: date, to: self).day ?? 0
  }
  
  func hours(from date: Date) -> Int {
    return Calendar.current.dateComponents([.hour], from: date, to: self).hour ?? 0
  }
  
  func minutes(from date: Date) -> Int {
    return Calendar.current.dateComponents([.minute], from: date, to: self).minute ?? 0
  }
  
  func seconds(from date: Date) -> Int {
    return Calendar.current.dateComponents([.second], from: date, to: self).second ?? 0
  }
}
