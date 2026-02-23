import SwiftUI
import WidgetKit

struct QRCodeWidgetView: View {
    let entry: QRCodeEntry

    // Brand colors (Warm & Earthy palette)
    private let brandTan = Color(red: 0.796, green: 0.678, blue: 0.553)       // #CBAD8D
    private let brandBrown = Color(red: 0.227, green: 0.176, blue: 0.157)     // #3A2D28

    var body: some View {
        if let qrImage = entry.qrImage, entry.deepLink != nil {
            VStack(spacing: 6) {
                Image(uiImage: qrImage)
                    .interpolation(.none)
                    .resizable()
                    .scaledToFit()

                if let orgName = entry.orgName {
                    Text(orgName)
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundStyle(brandBrown)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }
            }
            .padding(12)
            .containerBackground(for: .widget) { }
        } else {
            // Not configured
            VStack(spacing: 8) {
                Image(systemName: "qrcode")
                    .font(.largeTitle)
                    .foregroundStyle(brandTan)
                Text("Open Anchor to set up")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding()
            .containerBackground(for: .widget) { }
        }
    }
}
