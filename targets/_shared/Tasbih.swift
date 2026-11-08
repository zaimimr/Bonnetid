import Foundation

let tasbihKey = "tasbih_watch_v1"
let tasbihComplicationKind = "BonnetidTasbih"

enum TasbihMode: String, Codable {
  case sequence
  case free
}

enum TasbihTap {
  case count, lap, step, done
}

struct TasbihState: Codable, Equatable {
  static let roundTarget = 33
  static let rounds = 3
  static let sequenceTotal = 100

  var mode: TasbihMode = .sequence
  var step = 0
  var count = 0
  var goal: Int? = 33
  var done = false

  var isUntouched: Bool { count == 0 && step == 0 }
  var isClosing: Bool { mode == .sequence && step >= Self.rounds }
  var shouldSave: Bool { !done && !isUntouched }

  var target: Int? {
    if mode == .free { return goal }
    return isClosing ? Self.sequenceTotal : Self.roundTarget
  }

  var progress: Int {
    if mode == .free || isClosing { return count }
    return step * Self.roundTarget + count
  }

  var total: Int? { mode == .sequence ? Self.sequenceTotal : goal }

  mutating func advance() -> TasbihTap {
    guard !done else { return .count }
    let next = count + 1
    if mode == .free {
      count = next
      if let goal, next == goal {
        done = true
        return .done
      }
      return next % Self.roundTarget == 0 ? .lap : .count
    }
    if isClosing {
      count = Self.sequenceTotal
      done = true
      return .done
    }
    if next < Self.roundTarget {
      count = next
      return .count
    }
    if step < Self.rounds - 1 {
      step += 1
      count = 0
      return .step
    }
    step = Self.rounds
    count = Self.sequenceTotal - 1
    return .step
  }
}

struct TasbihSave: Codable {
  static let fallbackLifetime: TimeInterval = 3 * 60 * 60

  let state: TasbihState
  let expiresAt: Date?

  func resumable(at date: Date) -> TasbihState? {
    guard state.shouldSave else { return nil }
    if let expiresAt, date >= expiresAt { return nil }
    return state
  }

  static func read() -> TasbihSave? {
    guard let data = UserDefaults(suiteName: appGroupIdentifier)?.data(forKey: tasbihKey) else { return nil }
    return try? JSONDecoder().decode(TasbihSave.self, from: data)
  }

  static func write(_ state: TasbihState, nextAdhan: Date?, now: Date = Date()) {
    let defaults = UserDefaults(suiteName: appGroupIdentifier)
    if state.done {
      defaults?.removeObject(forKey: tasbihKey)
      return
    }
    guard state.shouldSave else { return }
    let expiresAt = state.mode == .free ? nil : (nextAdhan ?? now.addingTimeInterval(fallbackLifetime))
    let save = TasbihSave(state: state, expiresAt: expiresAt)
    guard let data = try? JSONEncoder().encode(save) else { return }
    defaults?.set(data, forKey: tasbihKey)
  }

  static func clear() {
    UserDefaults(suiteName: appGroupIdentifier)?.removeObject(forKey: tasbihKey)
  }
}
