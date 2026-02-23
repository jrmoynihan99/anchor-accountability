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
      ReachOutWidget()
    }
}
