import SwiftUI
import WidgetKit

struct JamatTimelineProvider: TimelineProvider {
  func placeholder(in context: Context) -> PrayerTimelineEntry {
    PrayerTimelineProvider.current(showJamat: true)
  }

  func getSnapshot(in context: Context, completion: @escaping (PrayerTimelineEntry) -> Void) {
    completion(PrayerTimelineProvider.current(showJamat: true))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerTimelineEntry>) -> Void) {
    completion(Timeline(entries: PrayerTimelineProvider.entries(showJamat: true), policy: .atEnd))
  }
}

private extension PrayerTimelineEntry {
  var nextJamat: PrayerEntry? {
    dailyPrayers.first { ($0.jamat ?? .distantPast) > date } ?? dailyPrayers.first { $0.jamat != nil }
  }
}

struct JamatWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: PrayerTimelineEntry

  var body: some View {
    Group {
      if entry.moment == nil {
        MissingJamatView(title: WidgetStrings.current.openApp, message: WidgetStrings.current.timesAppearHere)
      } else if entry.mosqueName == nil {
        MissingJamatView(title: WidgetStrings.current.chooseMosque, message: WidgetStrings.current.chooseMosqueBody)
      } else if entry.nextJamat == nil {
        MissingJamatView(title: entry.mosqueName ?? "", message: WidgetStrings.current.noJamatToday)
      } else if family == .systemSmall {
        SmallJamatView(entry: entry)
      } else {
        MediumJamatView(entry: entry)
      }
    }
    .widgetURL(URL(string: entry.moment != nil && entry.mosqueName == nil ? "bonnetid://mosque-picker" : "bonnetid://"))
    .widgetLanguage(WidgetStrings.current)
  }
}

private struct SmallJamatView: View {
  let entry: PrayerTimelineEntry
  private var strings: WidgetStrings { WidgetStrings.current }

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      Text(strings.jamatTitle)
        .font(.caption.weight(.semibold))
        .foregroundStyle(PrayerColor.inkMuted)
        .lineLimit(1)
      Spacer(minLength: 0)
      if let prayer = entry.nextJamat, let jamat = prayer.jamat {
        HStack(spacing: 5) {
          Image(PrayerFormat.symbol(for: prayer.kind))
            .font(.headline)
            .foregroundStyle(PrayerColor.brand)
          Text(prayer.printedLabel)
            .font(.headline)
            .foregroundStyle(PrayerColor.brand)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
        }
        Text(PrayerFormat.time(jamat))
          .prayerTime(.system(.largeTitle, design: .default).weight(.bold))
          .foregroundStyle(PrayerColor.ink)
          .lineLimit(1)
          .minimumScaleFactor(0.6)
        Text("\(strings.adhan) \(PrayerFormat.time(prayer.at))")
          .prayerTime(.caption)
          .foregroundStyle(PrayerColor.inkSecondary)
          .lineLimit(1)
      }
      Spacer(minLength: 0)
      Text(entry.mosqueName ?? "")
        .font(.caption2)
        .foregroundStyle(PrayerColor.inkMuted)
        .lineLimit(1)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    .containerBackground(PrayerColor.surface, for: .widget)
  }
}

private struct MediumJamatView: View {
  let entry: PrayerTimelineEntry
  private var strings: WidgetStrings { WidgetStrings.current }

  var body: some View {
    let highlighted = entry.nextJamat?.at
    VStack(alignment: .leading, spacing: 0) {
      HStack(alignment: .firstTextBaseline) {
        Text(strings.jamatTitle)
          .font(.subheadline.weight(.bold))
          .foregroundStyle(PrayerColor.brand)
        Spacer(minLength: 6)
        Text(entry.mosqueName ?? "")
          .font(.caption)
          .foregroundStyle(PrayerColor.inkMuted)
          .lineLimit(1)
      }
      Spacer(minLength: 6)
      HStack(spacing: 4) {
        ForEach(entry.dailyPrayers, id: \.at) { prayer in
          JamatColumn(prayer: prayer, isNext: prayer.at == highlighted)
        }
      }
      Spacer(minLength: 0)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .containerBackground(PrayerColor.surface, for: .widget)
  }
}

private struct JamatColumn: View {
  let prayer: PrayerEntry
  let isNext: Bool

  var body: some View {
    VStack(spacing: 3) {
      Text(prayer.printedLabel)
        .font(.caption2)
        .foregroundStyle(isNext ? PrayerColor.onBrandPlate : PrayerColor.inkMuted)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
      Text(prayer.jamat.map(PrayerFormat.time) ?? "-")
        .prayerTime(.system(.headline, design: .default).weight(.bold))
        .foregroundStyle(isNext ? PrayerColor.onBrandPlate : PrayerColor.ink)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
      Text(PrayerFormat.time(prayer.at))
        .prayerTime(.caption2)
        .foregroundStyle(isNext ? PrayerColor.onBrandPlate : PrayerColor.inkMuted)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
    }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 8)
    .padding(.horizontal, 2)
    .background(
      RoundedRectangle(cornerRadius: 10, style: .continuous)
        .fill(isNext ? PrayerColor.brandPlate : Color.clear)
    )
  }
}

private struct MissingJamatView: View {
  let title: String
  let message: String

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Image("bt.mosque-pin")
        .font(.title3)
        .foregroundStyle(PrayerColor.brand)
      Text(title)
        .font(.headline)
        .foregroundStyle(PrayerColor.ink)
      Text(message)
        .font(.caption)
        .foregroundStyle(PrayerColor.inkSecondary)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .containerBackground(PrayerColor.surface, for: .widget)
  }
}

struct JamatWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "BonnetidJamatWidget", provider: JamatTimelineProvider()) { entry in
      JamatWidgetView(entry: entry)
    }
    .configurationDisplayName(WidgetStrings.current.jamatWidgetName)
    .description(WidgetStrings.current.jamatWidgetDescription)
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
