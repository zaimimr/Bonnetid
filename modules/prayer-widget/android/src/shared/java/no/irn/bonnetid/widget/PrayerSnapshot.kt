package no.irn.bonnetid.widget

import android.content.Context
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import org.json.JSONObject

const val SNAPSHOT_PREFS = "prayer_widget"
const val SNAPSHOT_KEY = "prayer_snapshot_v1"

data class PrayerEntry(
  val kind: String,
  val label: String,
  val displayLabel: String,
  val at: Long,
  val isPrayer: Boolean,
  val jamat: Long?,
  val isJummah: Boolean,
  val end: Long? = null,
  /** This Friday's congregation, which stands in for the Dhuhr jamat until [jummahEnd]. */
  val jummahAt: Long? = null,
  val jummahEnd: Long? = null,
) {
  fun printedAt(showJamat: Boolean): Long {
    if (!showJamat && isJummah && jamat != null) return jamat
    return at
  }

  /**
   * Friday reads as Jumuah until half an hour after the last congregation, then it is an
   * ordinary Dhuhr again. Resolved per render so a widget flips on its own, offline.
   */
  fun resolveJummah(at: Long): PrayerEntry {
    if (jummahAt == null) return this
    val isOpen = jummahEnd == null || at < jummahEnd
    return copy(
      displayLabel = if (isOpen) "Jumuah" else label,
      isJummah = isOpen,
      jamat = if (isOpen) jummahAt else jamat,
    )
  }
}

data class SnapshotCoords(
  val lat: Double,
  val lon: Double,
)

data class SnapshotMosque(
  val orgNr: String,
  val name: String,
  val address: String?,
  val lat: Double,
  val lon: Double,
)

data class PrayerDaySnapshot(
  val date: String,
  val hijriText: String,
  val prayers: List<PrayerEntry>,
)

data class PrayerSnapshot(
  val version: Int,
  val generatedAt: Long,
  val locationName: String,
  val mosqueName: String?,
  val showJamat: Boolean,
  val lockScreenEnabled: Boolean,
  val days: List<PrayerDaySnapshot>,
  val origin: SnapshotCoords? = null,
  val mosques: List<SnapshotMosque> = emptyList(),
  val mode: String? = null,
) {
  val usesDeviceTimeZone: Boolean
    get() = mode == "calculated"

  val allPrayers: List<PrayerEntry>
    get() = days.flatMap { it.prayers }.sortedBy { it.at }

  val hasJamatTimes: Boolean
    get() = days.any { day -> day.prayers.any { it.jamat != null || it.jummahAt != null } }

  fun hijriText(at: Long): String {
    val key = dayKey(at)
    return days.firstOrNull { it.date == key }?.hijriText ?: days.firstOrNull()?.hijriText ?: ""
  }

  fun dayFor(at: Long): PrayerDaySnapshot? {
    val key = dayKey(at)
    return days.firstOrNull { it.date == key } ?: days.firstOrNull()
  }

  fun dailyPrayers(at: Long, now: Long = at): List<PrayerEntry> {
    return dayFor(at)?.prayers?.filter { it.isPrayer }?.map { it.resolveJummah(now) } ?: emptyList()
  }

  fun windowEnd(prayer: PrayerEntry): Long? {
    return prayer.end ?: allPrayers.firstOrNull { it.at > prayer.at }?.at
  }

  fun currentPrayer(at: Long): PrayerEntry? {
    val key = dayKey(at)
    val index = days.indexOfFirst { it.date == key }
    if (index < 0) return null
    val started = days[index].prayers
      .filter { it.isPrayer }
      .sortedBy { it.at }
      .lastOrNull { it.at <= at }
      ?: days.getOrNull(index - 1)?.prayers?.filter { it.isPrayer }?.maxByOrNull { it.at }
      ?: return null
    val end = started.end
    if (end != null && at >= end) return null
    return started.resolveJummah(at)
  }

  companion object {
    fun load(context: Context): PrayerSnapshot? {
      val raw = context
        .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
        .getString(SNAPSHOT_KEY, null)
        ?: return null
      return parse(raw)
    }

    fun parse(raw: String): PrayerSnapshot? {
      return try {
        val root = JSONObject(raw)
        val days = mutableListOf<PrayerDaySnapshot>()
        val dayArray = root.optJSONArray("days")
        for (dayIndex in 0 until (dayArray?.length() ?: 0)) {
          val dayJson = dayArray!!.getJSONObject(dayIndex)
          val prayers = mutableListOf<PrayerEntry>()
          val prayerArray = dayJson.optJSONArray("prayers")
          for (prayerIndex in 0 until (prayerArray?.length() ?: 0)) {
            val prayerJson = prayerArray!!.getJSONObject(prayerIndex)
            val at = parseInstant(optStringOrNull(prayerJson, "at")) ?: continue
            val label = prayerJson.optString("label")
            prayers.add(
              PrayerEntry(
                kind = prayerJson.optString("kind"),
                label = label,
                displayLabel = prayerJson.optString("displayLabel").ifEmpty { label },
                at = at,
                isPrayer = prayerJson.optBoolean("isPrayer", true),
                jamat = parseInstant(optStringOrNull(prayerJson, "jamat")),
                isJummah = prayerJson.optBoolean("isJummah", false),
                end = parseInstant(optStringOrNull(prayerJson, "end")),
                jummahAt = parseInstant(optStringOrNull(prayerJson, "jummahAt")),
                jummahEnd = parseInstant(optStringOrNull(prayerJson, "jummahEnd")),
              ),
            )
          }
          days.add(
            PrayerDaySnapshot(
              date = dayJson.optString("date"),
              hijriText = dayJson.optString("hijriText"),
              prayers = prayers,
            ),
          )
        }

        val mosques = mutableListOf<SnapshotMosque>()
        val mosqueArray = root.optJSONArray("mosques")
        for (index in 0 until (mosqueArray?.length() ?: 0)) {
          val mosqueJson = mosqueArray!!.getJSONObject(index)
          val lat = mosqueJson.optDouble("lat", Double.NaN)
          val lon = mosqueJson.optDouble("lon", Double.NaN)
          if (lat.isNaN() || lon.isNaN()) continue
          mosques.add(
            SnapshotMosque(
              orgNr = mosqueJson.optString("orgNr"),
              name = mosqueJson.optString("name"),
              address = optStringOrNull(mosqueJson, "address"),
              lat = lat,
              lon = lon,
            ),
          )
        }

        val originJson = root.optJSONObject("origin")
        val origin = originJson?.let {
          val lat = it.optDouble("lat", Double.NaN)
          val lon = it.optDouble("lon", Double.NaN)
          if (lat.isNaN() || lon.isNaN()) null else SnapshotCoords(lat, lon)
        }

        PrayerSnapshot(
          version = root.optInt("version", 1),
          generatedAt = parseInstant(optStringOrNull(root, "generatedAt"))
            ?: System.currentTimeMillis(),
          locationName = root.optString("locationName"),
          mosqueName = optStringOrNull(root, "mosqueName"),
          showJamat = root.optBoolean("showJamat", false),
          lockScreenEnabled = root.optBoolean("lockScreenEnabled", false),
          days = days,
          origin = origin,
          mosques = mosques,
          mode = optStringOrNull(root, "mode"),
        ).also { dayKeyZone = if (it.usesDeviceTimeZone) TimeZone.getDefault() else osloZone }
      } catch (error: Exception) {
        null
      }
    }

    private fun optStringOrNull(json: JSONObject, key: String): String? {
      val raw = json.optString(key)
      if (raw.isEmpty() || raw == "null") return null
      return raw
    }

    private fun parseInstant(raw: String?): Long? {
      if (raw.isNullOrEmpty() || raw == "null") return null
      for (pattern in instantPatterns) {
        try {
          val formatter = SimpleDateFormat(pattern, Locale.US)
          formatter.timeZone = TimeZone.getTimeZone("UTC")
          formatter.isLenient = false
          return formatter.parse(raw)?.time
        } catch (error: Exception) {
          continue
        }
      }
      return null
    }

    private val instantPatterns = listOf(
      "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
      "yyyy-MM-dd'T'HH:mm:ss'Z'",
    )

    private val osloZone: TimeZone = TimeZone.getTimeZone("Europe/Oslo")

    private var dayKeyZone: TimeZone = osloZone

    fun dayKey(at: Long): String {
      val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.US)
      formatter.timeZone = dayKeyZone
      return formatter.format(Date(at))
    }

    fun startOfNextDay(at: Long): Long {
      val calendar = Calendar.getInstance(dayKeyZone)
      calendar.timeInMillis = at
      calendar.set(Calendar.HOUR_OF_DAY, 0)
      calendar.set(Calendar.MINUTE, 0)
      calendar.set(Calendar.SECOND, 0)
      calendar.set(Calendar.MILLISECOND, 0)
      calendar.add(Calendar.DAY_OF_MONTH, 1)
      return calendar.timeInMillis
    }
  }
}

data class PrayerMoment(
  val current: PrayerEntry?,
  val next: PrayerEntry,
  val windowStart: Long,
  val windowEnd: Long,
  val locationName: String,
  val hijriText: String,
) {
  val isNow: Boolean
    get() = current != null

  val headline: PrayerEntry
    get() = current ?: next

  val stateLabel: String
    get() = if (current == null) "Neste" else "Nå"

  companion object {
    fun resolve(snapshot: PrayerSnapshot, at: Long): PrayerMoment? {
      val prayers = snapshot.allPrayers.filter { it.isPrayer }.map { it.resolveJummah(at) }
      val nextIndex = prayers.indexOfFirst { it.at > at }
      if (nextIndex < 0) return null

      val next = prayers[nextIndex]
      val previous = if (nextIndex > 0) prayers[nextIndex - 1] else null

      return PrayerMoment(
        current = snapshot.currentPrayer(at),
        next = next,
        windowStart = previous?.at ?: at,
        windowEnd = next.at,
        locationName = snapshot.locationName,
        hijriText = snapshot.hijriText(at),
      )
    }
  }
}

object PrayerFormat {
  fun time(at: Long): String {
    val formatter = SimpleDateFormat("HH:mm", Locale.forLanguageTag("nb-NO"))
    return formatter.format(Date(at))
  }

  fun countdown(to: Long, from: Long): String {
    val seconds = ((to - from) / 1000L).coerceAtLeast(0L)
    val hours = seconds / 3600
    val minutes = (seconds % 3600) / 60
    if (hours > 0) return "om ${hours}t ${minutes}m"
    if (minutes > 0) return "om $minutes min"
    return "om under 1 min"
  }

  fun startOfNextMinute(at: Long): Long {
    val calendar = Calendar.getInstance()
    calendar.timeInMillis = at
    calendar.set(Calendar.SECOND, 0)
    calendar.set(Calendar.MILLISECOND, 0)
    calendar.add(Calendar.MINUTE, 1)
    return calendar.timeInMillis
  }
}
