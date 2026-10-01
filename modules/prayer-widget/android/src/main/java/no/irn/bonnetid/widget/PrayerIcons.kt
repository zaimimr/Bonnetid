package no.irn.bonnetid.widget

object PrayerIcons {
  fun drawable(kind: String): Int = when (kind) {
    "fajr" -> R.drawable.prayer_icon_fajr
    "sunrise", "fajr_endtime" -> R.drawable.prayer_icon_sunrise
    "duhr" -> R.drawable.prayer_icon_dhuhr
    "asr" -> R.drawable.prayer_icon_asr
    "maghrib" -> R.drawable.prayer_icon_maghrib
    "isha" -> R.drawable.prayer_icon_isha
    else -> R.drawable.prayer_icon_dhuhr
  }
}
