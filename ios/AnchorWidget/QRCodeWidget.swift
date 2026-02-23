import WidgetKit
import SwiftUI
import CoreImage.CIFilterBuiltins

struct QRCodeEntry: TimelineEntry {
    let date: Date
    let orgName: String?
    let deepLink: String?
    let qrImage: UIImage?
}

struct QRCodeProvider: TimelineProvider {
    func placeholder(in context: Context) -> QRCodeEntry {
        QRCodeEntry(
            date: Date(),
            orgName: "Your Community",
            deepLink: nil,
            qrImage: generateQRCode(from: "https://anchoraccountability.com")
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (QRCodeEntry) -> Void) {
        let data = WidgetData.load()
        let link = data.deepLink ?? "https://anchoraccountability.com"
        let entry = QRCodeEntry(
            date: Date(),
            orgName: data.orgName,
            deepLink: data.deepLink,
            qrImage: generateQRCode(from: link)
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<QRCodeEntry>) -> Void) {
        let data = WidgetData.load()
        let link = data.deepLink ?? "https://anchoraccountability.com"
        let entry = QRCodeEntry(
            date: Date(),
            orgName: data.orgName,
            deepLink: data.deepLink,
            qrImage: generateQRCode(from: link)
        )
        // QR data rarely changes — refresh once per hour
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

func generateQRCode(from string: String) -> UIImage? {
    let filter = CIFilter.qrCodeGenerator()
    filter.message = Data(string.utf8)
    filter.correctionLevel = "M"

    guard let outputImage = filter.outputImage else { return nil }

    // Scale up — CIFilter output is tiny by default
    let scale: CGFloat = 10.0
    let scaledImage = outputImage.transformed(
        by: CGAffineTransform(scaleX: scale, y: scale)
    )

    // Render with transparent background
    let format = UIGraphicsImageRendererFormat()
    format.opaque = false
    
    let size = scaledImage.extent.size
    let renderer = UIGraphicsImageRenderer(size: size, format: format)
    
    return renderer.image { context in
        // Draw QR code with transparent background
        let ciContext = CIContext()
        if let cgImage = ciContext.createCGImage(scaledImage, from: scaledImage.extent) {
            context.cgContext.draw(cgImage, in: CGRect(origin: .zero, size: size))
        }
    }
}

struct QRCodeWidget: Widget {
    let kind: String = "QRCodeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: QRCodeProvider()) { entry in
            QRCodeWidgetView(entry: entry)
                .widgetURL(URL(string: "anchor://home"))
        }
        .configurationDisplayName("Community QR Code")
        .description("Share your community's join link as a QR code.")
        .supportedFamilies([.systemSmall])
    }
}
