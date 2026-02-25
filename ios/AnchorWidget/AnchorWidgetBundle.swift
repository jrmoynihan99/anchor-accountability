//
//  AnchorWidgetBundle.swift
//  AnchorWidget
//
//  Created by Jason Moynihan on 2/23/26.
//

import WidgetKit
import SwiftUI

// TODO: Widgets are disabled for now — data sync is commented out in app/(tabs)/_layout.tsx.
// Re-enable useWidgetDataSync and finish widget functionality before shipping these.
@main
struct AnchorWidgetBundle: WidgetBundle {
    var body: some Widget {
        QRCodeWidget()
        if #available(iOS 17.0, *) {
            ReachOutWidget()
        }
    }
}
