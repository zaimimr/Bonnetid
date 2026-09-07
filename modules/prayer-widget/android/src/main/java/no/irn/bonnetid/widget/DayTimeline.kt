package no.irn.bonnetid.widget

import java.util.Calendar
import java.util.TimeZone

data class TimelineMark(
  val kind: String,
  val label: String,
  val at: Long,
  val fraction: Double,
  val isPrayer: Boolean,
)

data class DayTimeline(
  val dayStart: Long,
  val dayLength: Long,
  val marks: List<TimelineMark>,
) {
  fun fraction(of: Long): Double {
    if (dayLength <= 0) return 0.0
    return ((of - dayStart).toDouble() / dayLength.toDouble()).coerceIn(0.0, 1.0)
  }

  fun mark(at: Long): TimelineMark? = marks.firstOrNull { it.at == at }

  companion object {
    private const val OSLO = "Europe/Oslo"

    /**
     * Drops marks that would collide once drawn, keeping the highlighted one, then prayers,
     * then everything else. Mirrors DayTimeline.placeable in the iOS target.
     */
    fun placeable(marks: List<TimelineMark>, minGap: Double, highlighting: Long?): List<TimelineMark> {
      val ordered = marks.sortedWith(
        compareBy({ rank(it, highlighting) }, { it.at }),
      )
      val placed = mutableListOf<TimelineMark>()
      for (mark in ordered) {
        if (placed.any { Math.abs(it.fraction - mark.fraction) < minGap }) continue
        placed.add(mark)
      }
      return placed.sortedBy { it.at }
    }

    private fun rank(mark: TimelineMark, highlighting: Long?): Int {
      if (highlighting != null && mark.at == highlighting) return 0
      if (mark.kind == MIDNIGHT_KIND) return 3
      return if (mark.isPrayer) 1 else 2
    }

    fun build(snapshot: PrayerSnapshot, at: Long): DayTimeline? {
      val zone = if (snapshot.usesDeviceTimeZone) TimeZone.getDefault() else TimeZone.getTimeZone(OSLO)
      val calendar = Calendar.getInstance(zone)
      calendar.timeInMillis = at
      calendar.set(Calendar.HOUR_OF_DAY, 0)
      calendar.set(Calendar.MINUTE, 0)
      calendar.set(Calendar.SECOND, 0)
      calendar.set(Calendar.MILLISECOND, 0)
      val dayStart = calendar.timeInMillis
      calendar.add(Calendar.DAY_OF_YEAR, 1)
      val length = calendar.timeInMillis - dayStart
      if (length <= 0) return null

      val day = snapshot.dayFor(at) ?: return null
      val marks = mutableListOf<TimelineMark>()
      for (prayer in day.prayers) {
        val fraction = fractionWithinDay(prayer.at, dayStart, length) ?: continue
        marks.add(
          TimelineMark(
            kind = prayer.kind,
            label = prayer.displayLabel,
            at = prayer.at,
            fraction = fraction,
            isPrayer = prayer.isPrayer,
          ),
        )
      }

      val midnight = day.prayers.firstOrNull { it.kind == "isha" }?.end
      if (midnight != null) {
        fractionWithinDay(midnight, dayStart, length)?.let { fraction ->
          marks.add(
            TimelineMark(
              kind = MIDNIGHT_KIND,
              label = "Midnatt",
              at = midnight,
              fraction = fraction,
              isPrayer = false,
            ),
          )
        }
      }

      if (marks.isEmpty()) return null
      return DayTimeline(dayStart, length, marks.sortedBy { it.at })
    }

    private fun fractionWithinDay(at: Long, dayStart: Long, length: Long): Double? {
      val value = (at - dayStart).toDouble() / length.toDouble()
      if (value < 0.0 || value > 1.0) return null
      return value
    }
  }
}
