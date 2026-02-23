import WidgetKit
import SwiftUI

@main
struct AnchorWidgetBundle: WidgetBundle {
    var body: some Widget {
        QRCodeWidget()
        ReachOutWidget()
    }
}
