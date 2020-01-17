//
//  Button.swift
//  Rainbow
//
//  Created by Alexey Kureev on 16/01/2020.
//

class Button : RCTView {
  
  @objc lazy var onPress: RCTBubblingEventBlock = { _ in }
  
  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapStart()
  }
  
  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapEnd()
    onPress([:])
  }
  
  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent?) {
    animateTapEnd()
  }
}
