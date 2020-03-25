//
//  UIImageViewWithPersistentAnimations.swift
//  Rainbow
//
//  Created by Bruno Andres Barbieri on 3/25/20.
//  Copyright © 2020 Rainbow. All rights reserved.
//

import Foundation

class UIImageViewWithPersistentAnimations : UIImageView {
    private var persistentAnimations: [String: CAAnimation] = [:]
    private var persistentSpeed: Float = 0.0

    override init(frame: CGRect) {
        super.init(frame: frame)
        self.commonInit()
    }

    required init?(coder aDecoder: NSCoder) {
        super.init(coder: aDecoder)
        self.commonInit()
    }

    func commonInit() {
      
      NotificationCenter.default.addObserver(self,
      selector: #selector(didBecomeActive),
      name: UIApplication.didBecomeActiveNotification,
      object: nil)
      
      NotificationCenter.default.addObserver(self,
      selector: #selector(willResignActive),
      name: UIApplication.didEnterBackgroundNotification,
      object: nil)
      
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc func didBecomeActive() {
        self.restoreAnimations(withKeys: Array(self.persistentAnimations.keys))
        self.persistentAnimations.removeAll()
        if self.persistentSpeed == 1.0 { //if layer was plaiyng before backgorund, resume it
            self.layer.resume()
        }
    }

    @objc func willResignActive() {
        self.persistentSpeed = self.layer.speed

        self.layer.speed = 1.0 //in case layer was paused from outside, set speed to 1.0 to get all animations
        self.persistAnimations(withKeys: self.layer.animationKeys())
        self.layer.speed = self.persistentSpeed //restore original speed
        self.layer.pause()
    }

    func persistAnimations(withKeys: [String]?) {
        withKeys?.forEach({ (key) in
            if let animation = self.layer.animation(forKey: key) {
                self.persistentAnimations[key] = animation
            }
        })
    }

    func restoreAnimations(withKeys: [String]?) {
        withKeys?.forEach { key in
            if let persistentAnimation = self.persistentAnimations[key] {
                self.layer.add(persistentAnimation, forKey: key)
            }
        }
    }
}
