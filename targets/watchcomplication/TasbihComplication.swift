import SwiftUI
import WidgetKit

struct TasbihEntry: TimelineEntry {
  let date: Date
  let state: TasbihState?
}

struct TasbihProvider: TimelineProvider {
  func placeholder(in context: Context) -> TasbihEntry {
    TasbihEntry(date: Date(), state: nil)
  }

  func getSnapshot(in context: Context, completion: @escaping (TasbihEntry) -> Void) {
    let now = Date()
    completion(TasbihEntry(date: now, state: TasbihSave.read()?.resumable(at: now)))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<TasbihEntry>) -> Void) {
    let now = Date()
    let save = TasbihSave.read()
    var entries = [TasbihEntry(date: now, state: save?.resumable(at: now))]
    if let expiresAt = save?.expiresAt, expiresAt > now, entries[0].state != nil {
      entries.append(TasbihEntry(date: expiresAt, state: nil))
    }
    completion(Timeline(entries: entries, policy: .never))
  }
}

struct TasbihBeads: View {
  var body: some View {
    GeometryReader { proxy in
      let size = min(proxy.size.width, proxy.size.height)
      let radius = size * 88 / 256
      let bead = size * 15 / 128
      ZStack {
        ForEach(0..<12, id: \.self) { index in
          let angle = Double(index) / 12 * 2 * .pi
          Circle()
            .frame(width: bead, height: bead)
            .offset(x: radius * sin(angle), y: -radius * cos(angle))
        }
      }
      .frame(width: proxy.size.width, height: proxy.size.height)
    }
  }
}

struct TasbihComplicationView: View {
  @Environment(\.widgetFamily) private var family
  let entry: TasbihEntry

  var body: some View {
    Group {
      switch family {
      case .accessoryCircular:
        if let state = entry.state, let total = state.total {
          Gauge(value: Double(state.progress), in: 0...Double(total)) {
            Text("Tasbih")
          } currentValueLabel: {
            Text("\(state.progress)")
              .monospacedDigit()
          }
          .gaugeStyle(.accessoryCircularCapacity)
          .tint(Color.accentColor)
        } else if let state = entry.state {
          ZStack {
            AccessoryWidgetBackground()
            Text("\(state.progress)")
              .font(.system(size: 16, weight: .semibold, design: .rounded))
              .monospacedDigit()
              .minimumScaleFactor(0.5)
          }
        } else {
          ZStack {
            AccessoryWidgetBackground()
            TasbihBeads()
              .padding(8)
              .widgetAccentable()
          }
        }
      case .accessoryInline:
        Text(label)
      case .accessoryCorner:
        TasbihBeads()
          .padding(4)
          .widgetAccentable()
          .widgetLabel { Text(label) }
      default:
        HStack(spacing: 8) {
          TasbihBeads()
            .frame(width: 28, height: 28)
            .widgetAccentable()
          VStack(alignment: .leading, spacing: 1) {
            Text("Tasbih")
              .font(.headline)
              .widgetAccentable()
            Text(detail)
              .font(.body)
              .monospacedDigit()
          }
          Spacer(minLength: 0)
        }
      }
    }
    .widgetURL(URL(string: "bonnetidwatch://tasbih"))
    .containerBackground(.clear, for: .widget)
  }

  private var detail: String {
    guard let state = entry.state else { return "Trykk for å telle" }
    if let total = state.total { return "\(state.progress) av \(total)" }
    return "\(state.progress)"
  }

  private var label: String {
    guard let state = entry.state else { return "Tasbih" }
    return "Tasbih \(state.progress)"
  }
}

struct TasbihComplication: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: tasbihComplicationKind, provider: TasbihProvider()) { entry in
      TasbihComplicationView(entry: entry)
    }
    .configurationDisplayName("Tasbih")
    .description("Åpner tasbih og viser tellingen du er i gang med.")
    .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline, .accessoryCorner])
  }
}
