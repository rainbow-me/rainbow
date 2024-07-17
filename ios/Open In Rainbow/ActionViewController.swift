//
//  ActionViewController.swift
//  Open In Rainbow
//
//  Created by Matthew Wall on 7/17/24.
//  Copyright © 2024 Rainbow. All rights reserved.
//

import UIKit
import MobileCoreServices
import UniformTypeIdentifiers

class ActionViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
    
        for item in extensionContext?.inputItems as? [NSExtensionItem] ?? [] {
            for provider in item.attachments ?? [] {

            // URL in the form of a text
            if provider.hasItemConformingToTypeIdentifier(UTType.text.identifier) {
                    provider.loadItem(forTypeIdentifier: UTType.text.identifier, options: nil) { text, _ in
                        guard let text = text as? String else { return }
                        guard let url = URL(string: text) else {
                            return
                        }
                        self.openApp(url: url)
                    }
                    break
                }

            // URL in URL form
            if provider.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                provider.loadItem(forTypeIdentifier: UTType.text.identifier, options: nil) { url, _ in
                    guard let url = url as? URL else { return }
                    self.openApp(url: url)
                }
                break
            }

            }
        }
    }

    func openApp(url: URL) {
        var responder = self as UIResponder?
        responder = (responder as? UIViewController)?.parent
        while (responder != nil && !(responder is UIApplication)) {
            responder = responder?.next
        }
        if responder != nil{
            let selectorOpenURL = sel_registerName("openURL:")
            if responder!.responds(to: selectorOpenURL) {
                responder!.perform(selectorOpenURL, with: url)
            }
        }
    
        self.done()
    }

    @IBAction func done() {
        self.extensionContext!.completeRequest(returningItems: self.extensionContext!.inputItems, completionHandler: nil)
    }

}
