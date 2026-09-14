package no.irn.bonnetid.widget

import android.content.Context
import org.json.JSONObject

object PrayerLogStore {
  const val STATUS_PRAYED = "prayed"
  const val STATUS_SKIPPED = "skipped"

  fun read(context: Context): JSONObject {
    val raw = context
      .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
      .getString(PRAYER_LOG_KEY, null)
      ?: return JSONObject()
    return try {
      JSONObject(raw)
    } catch (error: Exception) {
      JSONObject()
    }
  }

  fun statusOf(log: JSONObject, date: String, prayer: String): String? {
    val entry = log.optJSONObject(key(date, prayer)) ?: return null
    if (entry.isNull("status")) return null
    val status = entry.optString("status")
    if (status.isEmpty() || status == "null") return null
    return status
  }

  fun statusOf(context: Context, date: String, prayer: String): String? {
    return statusOf(read(context), date, prayer)
  }

  /** Only a prayer the snapshot still knows about can carry a status. */
  fun statusFor(context: Context, snapshot: PrayerSnapshot, prayer: PrayerEntry): String? {
    if (!prayer.isPrayer) return null
    val day = snapshot.dayFor(prayer.at) ?: return null
    if (day.prayers.none { it.kind == prayer.kind && it.at == prayer.at }) return null
    return statusOf(context, day.date, prayer.kind)
  }

  fun mark(context: Context, date: String, prayer: String, status: String) {
    val log = read(context)
    log.put(
      key(date, prayer),
      JSONObject().put("status", status).put("at", System.currentTimeMillis()),
    )
    context
      .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
      .edit()
      .putString(PRAYER_LOG_KEY, log.toString())
      .apply()
  }

  private fun key(date: String, prayer: String) = "$date|$prayer"
}
