//
//  AnchorWidgetBundle.swift
//  AnchorWidget
//
//  Created by Jason Moynihan on 2/23/26.
//

import WidgetKit
import SwiftUI

@main
struct AnchorWidgetBundle: WidgetBundle {
    var body: some Widget {
        QRCodeWidget()
        if #available(iOS 17.0, *) {
            ReachOutWidget()
        }
    }
}
