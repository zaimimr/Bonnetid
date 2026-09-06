package no.irn.bonnetid.car

import android.content.Context
import android.util.Log
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone
import no.irn.bonnetid.widget.BuildConfig
import no.irn.bonnetid.widget.PrayerSnapshot
import no.irn.bonnetid.widget.SNAPSHOT_KEY
import no.irn.bonnetid.widget.SNAPSHOT_PREFS
import no.irn.bonnetid.widget.SnapshotCoords
import org.json.JSONArray
import org.json.JSONObject

/**
 * On Automotive OS there is no phone app writing the snapshot, so the car builds one itself from
 * the same tables the app reads. On Android Auto this only ever runs as a fallback, when the
 * phone's snapshot is missing or older than today.
 */
object CarDataSource {
  private const val TAG = "BonnetidCar"
  private const val SNAPSHOT_DAYS = 3
  private const val OSLO = "Europe/Oslo"

  private val PRAYER_COLUMNS = listOf(
    "date",
    "fajr",
    "fajr_endtime",
    "shuruq_sunrise",
    "duhr",
    "asr",
    "shadow_1x",
    "shadow_2x",
    "wusta_noon_sunset",
    "maghrib",
    "isha",
    "muntasafallayl_midnight",
  ).joinToString(",")

  fun configured(): Boolean = BuildConfig.SUPABASE_URL.isNotEmpty() && BuildConfig.SUPABASE_KEY.isNotEmpty()

  fun needsRefresh(snapshot: PrayerSnapshot?, at: Long): Boolean {
    if (snapshot == null) return true
    val today = PrayerSnapshot.dayKey(at)
    return snapshot.days.none { it.date == today }
  }

  /** Blocking network work: always call this off the main thread. */
  fun refresh(context: Context, from: SnapshotCoords?): Boolean {
    if (!configured()) return false
    return try {
      val locations = fetchLocations()
      val origin = from ?: run {
        Log.w(TAG, "Ingen posisjon å regne kommune fra")
        return false
      }
      val location = locations.minByOrNull { distanceKm(origin, it) } ?: run {
        Log.w(TAG, "Fant ingen kommuner (${locations.size} rader)")
        return false
      }
      val days = fetchPrayerDays(location.iso)
      if (days.length() == 0) {
        Log.w(TAG, "Ingen bønnetider for ${location.iso}")
        return false
      }
      val mosques = fetchMosques()

      val payload = JSONObject()
        .put("version", 2)
        .put("generatedAt", isoInstant(System.currentTimeMillis()))
        .put("locationName", location.name)
        .put("origin", JSONObject().put("lat", location.lat).put("lon", location.lon))
        .put("mosques", mosques)
        .put("mosqueName", JSONObject.NULL)
        .put("showJamat", false)
        .put("lockScreenEnabled", false)
        .put("days", buildDays(days, location.asrMethod))

      context
        .getSharedPreferences(SNAPSHOT_PREFS, Context.MODE_PRIVATE)
        .edit()
        .putString(SNAPSHOT_KEY, payload.toString())
        .apply()
      true
    } catch (error: Exception) {
      Log.w(TAG, "Klarte ikke hente bønnetider til bilen", error)
      false
    }
  }

  private data class RemoteLocation(
    val iso: String,
    val name: String,
    val lat: Double,
    val lon: Double,
    val asrMethod: Int,
  )

  /** org.json turns a JSON null into the string "null", which would defeat every fallback. */
  private fun text(row: JSONObject, key: String): String =
    if (row.isNull(key)) "" else row.optString(key).trim()

  private fun fetchLocations(): List<RemoteLocation> {
    val rows = getJson("location_t?select=location_iso,location_name,lat_n_s,long_e_w,asr_method")
    val locations = mutableListOf<RemoteLocation>()
    for (index in 0 until rows.length()) {
      val row = rows.getJSONObject(index)
      val lat = row.optDouble("lat_n_s", Double.NaN)
      val lon = row.optDouble("long_e_w", Double.NaN)
      if (lat.isNaN() || lon.isNaN()) continue
      locations.add(
        RemoteLocation(
          iso = row.optString("location_iso"),
          name = row.optString("location_name"),
          lat = lat,
          lon = lon,
          asrMethod = row.optInt("asr_method", 0),
        ),
      )
    }
    return locations
  }

  private fun fetchPrayerDays(iso: String): JSONArray {
    val start = dayKeyOffset(0)
    val end = dayKeyOffset(SNAPSHOT_DAYS - 1)
    val rows = getJson(
      "prayertime?select=$PRAYER_COLUMNS&location_iso=eq.$iso&date=gte.$start&date=lte.$end" +
        "&order=date.asc,prayer_method.asc",
    )
    // The table holds one row per calculation method; the app keeps the first for each date.
    val deduped = JSONArray()
    var lastDate: String? = null
    for (index in 0 until rows.length()) {
      val row = rows.getJSONObject(index)
      val date = row.optString("date")
      if (date == lastDate) continue
      lastDate = date
      deduped.put(row)
    }
    return deduped
  }

  private fun fetchMosques(): JSONArray {
    val rows = getJson("mosque_t?select=organisasjonsnummer,reg_navn,org_name2,address,lat,lon")
    val mosques = JSONArray()
    for (index in 0 until rows.length()) {
      val row = rows.getJSONObject(index)
      val lat = row.optDouble("lat", Double.NaN)
      val lon = row.optDouble("lon", Double.NaN)
      if (lat.isNaN() || lon.isNaN()) continue
      val name = text(row, "org_name2").ifEmpty { text(row, "reg_navn") }
      mosques.put(
        JSONObject()
          .put("orgNr", text(row, "organisasjonsnummer"))
          .put("name", name)
          .put("address", row.opt("address") ?: JSONObject.NULL)
          .put("lat", lat)
          .put("lon", lon),
      )
    }
    return mosques
  }

  private fun buildDays(rows: JSONArray, asrMethod: Int): JSONArray {
    val days = JSONArray()
    for (index in 0 until rows.length()) {
      val row = rows.getJSONObject(index)
      val date = row.optString("date")
      if (date.isEmpty()) continue
      days.put(
        JSONObject()
          .put("date", date)
          .put("hijriText", "")
          .put("prayers", buildPrayers(row, date, asrMethod)),
      )
    }
    return days
  }

  private fun buildPrayers(row: JSONObject, date: String, asrMethod: Int): JSONArray {
    val entries = listOf(
      Triple("fajr", time(row, "fajr"), true),
      Triple("fajr_endtime", time(row, "fajr_endtime"), false),
      Triple("duhr", time(row, "duhr"), true),
      Triple("asr", asrTime(row, asrMethod), true),
      Triple("maghrib", time(row, "maghrib"), true),
      Triple("isha", time(row, "isha"), true),
    ).mapNotNull { (kind, clock, isPrayer) ->
      val at = instant(date, clock) ?: return@mapNotNull null
      Triple(kind, at, isPrayer)
    }

    val prayers = JSONArray()
    entries.forEachIndexed { index, (kind, at, isPrayer) ->
      val end = when {
        kind == "isha" -> midnight(row, date, at)
        kind == "fajr" -> instant(date, time(row, "shuruq_sunrise") ?: time(row, "fajr_endtime"))
        else -> entries.getOrNull(index + 1)?.second
      }
      prayers.put(
        JSONObject()
          .put("kind", kind)
          .put("label", LABELS[kind] ?: kind)
          .put("displayLabel", LABELS[kind] ?: kind)
          .put("at", isoInstant(at))
          .put("isPrayer", isPrayer)
          .put("jamat", JSONObject.NULL)
          .put("isJummah", false)
          .put("end", if (end == null) JSONObject.NULL else isoInstant(end)),
      )
    }
    return prayers
  }

  private fun midnight(row: JSONObject, date: String, ishaAt: Long): Long? {
    val clock = time(row, "muntasafallayl_midnight") ?: return null
    val sameDay = instant(date, clock) ?: return null
    if (sameDay > ishaAt) return sameDay
    return sameDay + 24 * 60 * 60 * 1000L
  }

  private fun asrTime(row: JSONObject, method: Int): String? {
    val preferred = when (method) {
      1 -> time(row, "shadow_1x")
      2 -> time(row, "shadow_2x")
      3 -> time(row, "wusta_noon_sunset")
      else -> time(row, "asr")
    }
    return preferred ?: time(row, "asr")
  }

  private fun time(row: JSONObject, key: String): String? {
    val raw = row.optString(key)
    if (raw.isEmpty() || raw == "null") return null
    return raw.take(5)
  }

  private fun instant(date: String, clock: String?): Long? {
    if (clock == null) return null
    return try {
      val formatter = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US)
      formatter.timeZone = TimeZone.getTimeZone(OSLO)
      formatter.isLenient = false
      formatter.parse("$date $clock")?.time
    } catch (error: Exception) {
      null
    }
  }

  private fun isoInstant(at: Long): String {
    val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
    formatter.timeZone = TimeZone.getTimeZone("UTC")
    return formatter.format(java.util.Date(at))
  }

  private fun dayKeyOffset(days: Int): String {
    val calendar = Calendar.getInstance(TimeZone.getTimeZone(OSLO))
    calendar.add(Calendar.DAY_OF_YEAR, days)
    return PrayerSnapshot.dayKey(calendar.timeInMillis)
  }

  private fun getJson(query: String): JSONArray {
    val url = URL("${BuildConfig.SUPABASE_URL.trimEnd('/')}/rest/v1/$query")
    val connection = url.openConnection() as HttpURLConnection
    return try {
      connection.requestMethod = "GET"
      connection.connectTimeout = 10_000
      connection.readTimeout = 15_000
      connection.setRequestProperty("apikey", BuildConfig.SUPABASE_KEY)
      connection.setRequestProperty("Authorization", "Bearer ${BuildConfig.SUPABASE_KEY}")
      connection.setRequestProperty("Accept", "application/json")
      if (connection.responseCode !in 200..299) return JSONArray()
      JSONArray(connection.inputStream.bufferedReader().use { it.readText() })
    } finally {
      connection.disconnect()
    }
  }

  private fun distanceKm(from: SnapshotCoords, to: RemoteLocation): Double {
    val dLat = Math.toRadians(to.lat - from.lat)
    val dLon = Math.toRadians(to.lon - from.lon)
    val a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(Math.toRadians(from.lat)) * Math.cos(Math.toRadians(to.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    return 6371.0 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  private val LABELS = mapOf(
    "fajr" to "Fajr",
    "fajr_endtime" to "Soloppgang",
    "duhr" to "Dhuhr",
    "asr" to "Asr",
    "maghrib" to "Maghrib",
    "isha" to "Isha",
  )
}
