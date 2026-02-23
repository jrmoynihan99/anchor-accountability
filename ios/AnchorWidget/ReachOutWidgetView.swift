import SwiftUI
import WidgetKit
import AppIntents

struct ReachOutWidgetView: View {
    let entry: ReachOutEntry

    // Brand colors
    private let brandTan = Color(red: 0.796, green: 0.678, blue: 0.553)

    var body: some View {
        if !entry.isConfigured {
            unconfiguredView
        } else if entry.showSent {
            sentView
        } else {
            defaultView
        }
    }
    
    @ViewBuilder
    private var defaultView: some View {
        if #available(iOS 17.0, *) {
            Button(intent: ReachOutIntent()) {
                defaultContent
            }
            .buttonStyle(.plain)
            .containerBackground(for: .widget) { }
        } else {
            defaultContent
                .containerBackground(for: .widget) { }
        }
    }
    
    private var defaultContent: some View {
        VStack(spacing: 4) {
            Spacer()
            
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 64))
                .foregroundStyle(brandTan)
            
            Spacer()
            
            Text("Feeling tempted?")
                .font(.caption)
                .fontWeight(.medium)
                .foregroundStyle(.secondary)
            
            Text("Reach Out Now")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundStyle(.primary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(2)
    }
    
    private var sentView: some View {
        VStack(spacing: 4) {
            Spacer()
            
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundStyle(brandTan)
            
            Spacer()
            
            Text("Sent")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundStyle(.primary)
            
            Text("Support is coming")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(2)
        .containerBackground(for: .widget) { }
    }

    private var unconfiguredView: some View {
        VStack(spacing: 4) {
            Spacer()
            
            Image(systemName: "person.circle")
                .font(.system(size: 64))
                .foregroundStyle(brandTan)
            
            Spacer()
            
            Text("Log In")
                .font(.headline)
                .fontWeight(.bold)
                .foregroundStyle(.primary)
            
            Text("Open Anchor to setup")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(2)
        .containerBackground(for: .widget) { }
    }
}
