import SwiftUI
import WidgetKit

struct ComplicationEntry: TimelineEntry {
  let date: Date
  let moment: PrayerMoment?
}

struct ComplicationProvider: TimelineProvider {
  func placeholder(in context: Context) -> ComplicationEntry {
    ComplicationEntry(date: Date(), moment: nil)
  }

  func getSnapshot(in context: Context, completion: @escaping (ComplicationEntry) -> Void) {
    let now = Date()
    completion(entry(at: now, snapshot: PrayerSnapshot.load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<ComplicationEntry>) -> Void) {
    let now = Date()
    let snapshot = PrayerSnapshot.load()
    let horizonEnd = now.addingTimeInterval(12 * 60 * 60)

    var dates: Set<Date> = [now]
    for minute in 1...60 {
      dates.insert(now.addingTimeInterval(Double(minute) * 60))
    }
    for minute in stride(from: 65, through: 12 * 60, by: 5) {
      dates.insert(now.addingTimeInterval(Double(minute) * 60))
    }
    for prayer in snapshot?.allPrayers ?? [] {
      for instant in [prayer.at, prayer.jummahEnd].compactMap({ $0 }) where instant > now && instant <= horizonEnd {
        dates.insert(instant)
      }
    }

    let entries = dates.sorted().map { entry(at: $0, snapshot: snapshot) }
    completion(Timeline(entries: entries, policy: .atEnd))
  }

  private func entry(at date: Date, snapshot: PrayerSnapshot?) -> ComplicationEntry {
    ComplicationEntry(date: date, moment: snapshot.flatMap { PrayerMoment.resolve(from: $0, at: date) })
  }
}

struct ComplicationView: View {
  @Environment(\.widgetFamily) private var family
  let entry: ComplicationEntry

  var body: some View {
    Group {
      if let moment = entry.moment {
        let next = moment.next
        let time = PrayerFormat.time(next.at)
        let countdown = PrayerFormat.countdown(to: next.at, from: entry.date)
        switch family {
        case .accessoryCircular:
          Gauge(value: moment.progress(at: entry.date)) {
            Text(next.printedLabel)
          } currentValueLabel: {
            Text(timerInterval: PrayerFormat.countdownRange(to: next.at, from: entry.date), countsDown: true)
              .font(.system(size: 12, weight: .semibold))
              .monospacedDigit()
              .minimumScaleFactor(0.6)
          }
          .gaugeStyle(.accessoryCircular)
          .tint(Color.accentColor)
        case .accessoryInline:
          Text("\(next.printedLabel) \(time) · \(countdown)")
        case .accessoryCorner:
          Image(systemName: PrayerFormat.symbol(for: next.kind))
            .font(.title3)
            .widgetAccentable()
            .widgetLabel {
              Text("\(next.printedLabel) \(countdown)")
            }
        default:
          VStack(alignment: .leading, spacing: 1) {
            HStack(spacing: 4) {
              Image(systemName: PrayerFormat.symbol(for: next.kind))
                .font(.caption)
              Text(next.printedLabel)
                .font(.headline)
                .lineLimit(1)
              Text(time)
                .font(.headline)
                .monospacedDigit()
            }
            .foregroundStyle(Color.accentColor)
            .widgetAccentable()
            Text(countdown)
              .font(.caption)
              .lineLimit(1)
            if let jamat = next.jamat {
              Text("Jamat \(PrayerFormat.time(jamat))")
                .font(.caption)
                .monospacedDigit()
                .foregroundStyle(.secondary)
                .lineLimit(1)
            }
          }
          .frame(maxWidth: .infinity, alignment: .leading)
        }
      } else {
        switch family {
        case .accessoryInline:
          Text("Åpne Bønnetid")
        case .accessoryRectangular:
          VStack(alignment: .leading) {
            Text("Bønnetid").font(.headline).widgetAccentable()
            Text("Åpne appen for tider").font(.caption)
          }
          .frame(maxWidth: .infinity, alignment: .leading)
        default:
          Image(systemName: "moon.stars")
            .widgetAccentable()
        }
      }
    }
    .containerBackground(.clear, for: .widget)
  }
}

@main
struct PrayerComplication: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "BonnetidWatchComplication", provider: ComplicationProvider()) { entry in
      ComplicationView(entry: entry)
    }
    .configurationDisplayName("Neste bønn")
    .description("Neste bønn og tiden som er igjen.")
    .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline, .accessoryCorner])
  }
}
