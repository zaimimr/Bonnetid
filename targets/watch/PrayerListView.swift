import SwiftUI

enum WatchColor {
  static let brand = Color(hex: 0x6FBA9D)
  static let brandPlate = Color(hex: 0x27362F)
  static let onBrandPlate = Color(hex: 0xD3EAE0)
  static let ink = Color(hex: 0xF6F8F7)
  static let inkSecondary = Color(hex: 0xC6D0CB)
  static let inkMuted = Color(hex: 0x8C9A93)
  static let track = Color(hex: 0x1C2823)
  static let backdrop = Color(hex: 0x0F1714)
}

private extension Color {
  init(hex: UInt32) {
    self.init(
      red: Double((hex >> 16) & 0xFF) / 255,
      green: Double((hex >> 8) & 0xFF) / 255,
      blue: Double(hex & 0xFF) / 255
    )
  }
}

struct PrayerListView: View {
  let snapshot: PrayerSnapshot?

  var body: some View {
    if let snapshot {
      TimelineView(.everyMinute) { context in
        PrayerPages(snapshot: snapshot, now: context.date)
      }
    } else {
      VStack(spacing: 8) {
        Image(systemName: "moon.stars")
          .font(.title2)
          .foregroundStyle(WatchColor.brand)
        Text("Åpne Bønnetid på iPhone for å hente tidene")
          .font(.footnote)
          .multilineTextAlignment(.center)
          .foregroundStyle(WatchColor.inkSecondary)
      }
      .padding()
    }
  }
}

private struct PrayerPages: View {
  let snapshot: PrayerSnapshot
  let now: Date

  var body: some View {
    let moment = PrayerMoment.resolve(from: snapshot, at: now)
    let prayers = snapshot.dailyPrayers(for: moment?.next.at ?? now, now: now)

    NavigationStack {
      TabView {
        if let moment {
          NextPrayerPage(moment: moment, mosqueName: snapshot.mosqueName, now: now)
            .navigationTitle(snapshot.locationName)
            .containerBackground(WatchColor.backdrop, for: .tabView)
        }
        TodayPage(prayers: prayers, nextAt: moment?.next.at, hijriText: snapshot.hijriText(for: now))
          .navigationTitle("I dag")
          .containerBackground(WatchColor.backdrop, for: .tabView)
      }
      .tabViewStyle(.verticalPage)
    }
  }
}

private struct NextPrayerPage: View {
  let moment: PrayerMoment
  let mosqueName: String?
  let now: Date

  var body: some View {
    let next = moment.next

    VStack(alignment: .leading, spacing: 6) {
      Text(moment.isNow ? "Nå" : "Neste bønn")
        .font(.footnote.weight(.medium))
        .foregroundStyle(WatchColor.inkMuted)

      HStack(alignment: .firstTextBaseline, spacing: 6) {
        Image(systemName: PrayerFormat.symbol(for: next.kind))
          .font(.system(size: 20, weight: .semibold))
          .foregroundStyle(WatchColor.brand)
        Text(next.printedLabel)
          .font(.system(size: 30, weight: .semibold, design: .rounded))
          .foregroundStyle(WatchColor.brand)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
      }

      Text(PrayerFormat.time(next.at))
        .font(.system(size: 44, weight: .semibold, design: .rounded))
        .monospacedDigit()
        .foregroundStyle(WatchColor.ink)

      Spacer(minLength: 4)

      ProgressBar(value: moment.progress(at: now))

      HStack(spacing: 6) {
        Text(PrayerFormat.countdown(to: next.at, from: now))
          .font(.footnote)
          .monospacedDigit()
          .foregroundStyle(WatchColor.inkSecondary)
        Spacer(minLength: 0)
        if let jamat = next.jamat {
          Text("\(next.isJummah == true ? "Jumuah" : "Jamat") \(PrayerFormat.time(jamat))")
            .font(.footnote.weight(.semibold))
            .monospacedDigit()
            .foregroundStyle(WatchColor.onBrandPlate)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Capsule().fill(WatchColor.brandPlate))
        }
      }

      if let mosqueName {
        Text(mosqueName)
          .font(.caption2)
          .foregroundStyle(WatchColor.inkMuted)
          .lineLimit(1)
      }
    }
    .padding(.horizontal, 6)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

private struct ProgressBar: View {
  let value: Double

  var body: some View {
    GeometryReader { proxy in
      ZStack(alignment: .leading) {
        Capsule().fill(WatchColor.track)
        Capsule()
          .fill(WatchColor.brand)
          .frame(width: max(6, proxy.size.width * value))
      }
    }
    .frame(height: 6)
  }
}

private struct TodayPage: View {
  let prayers: [PrayerEntry]
  let nextAt: Date?
  let hijriText: String

  var body: some View {
    let showJamat = prayers.contains { $0.jamat != nil }

    VStack(spacing: 2) {
      if showJamat {
        HStack {
          Spacer()
          Text("Adhan")
            .frame(width: 44, alignment: .trailing)
          Text("Jamat")
            .frame(width: 44, alignment: .trailing)
        }
        .font(.system(size: 11, weight: .medium))
        .foregroundStyle(WatchColor.inkMuted)
        .padding(.horizontal, 8)
      }
      ForEach(prayers, id: \.at) { prayer in
        PrayerRow(prayer: prayer, isNext: prayer.at == nextAt, showJamat: showJamat)
      }
      if !hijriText.isEmpty {
        Text(hijriText)
          .font(.caption2)
          .foregroundStyle(WatchColor.inkMuted)
          .lineLimit(1)
          .frame(maxWidth: .infinity, alignment: .leading)
          .padding(.horizontal, 8)
          .padding(.top, 4)
      }
    }
    .padding(.trailing, 6)
  }
}

private struct PrayerRow: View {
  let prayer: PrayerEntry
  let isNext: Bool
  let showJamat: Bool

  var body: some View {
    HStack(spacing: 6) {
      Image(systemName: PrayerFormat.symbol(for: prayer.kind))
        .font(.system(size: 13, weight: .medium))
        .foregroundStyle(isNext ? WatchColor.onBrandPlate : WatchColor.brand)
        .frame(width: 18)
      Text(prayer.printedLabel)
        .font(.system(size: 16, weight: isNext ? .semibold : .regular))
        .lineLimit(1)
        .minimumScaleFactor(0.8)
      Spacer(minLength: 4)
      Text(PrayerFormat.time(prayer.at))
        .font(.system(size: 16, weight: isNext ? .semibold : .regular))
        .monospacedDigit()
        .frame(width: 44, alignment: .trailing)
      if showJamat {
        Text(prayer.jamat.map(PrayerFormat.time) ?? "–")
          .font(.system(size: 16, weight: isNext ? .semibold : .regular))
          .monospacedDigit()
          .foregroundStyle(isNext ? WatchColor.onBrandPlate : WatchColor.brand)
          .frame(width: 44, alignment: .trailing)
      }
    }
    .foregroundStyle(isNext ? WatchColor.onBrandPlate : WatchColor.ink)
    .padding(.vertical, 3)
    .padding(.horizontal, 8)
    .background(
      RoundedRectangle(cornerRadius: 10, style: .continuous)
        .fill(isNext ? WatchColor.brandPlate : Color.clear)
    )
  }
}
