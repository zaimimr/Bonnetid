package no.irn.bonnetid.widget

import android.view.View

class WidgetStrings(lang: String) {
  private val language = if (lang in SUPPORTED) lang else "nb"

  private fun pick(nb: String, en: String, ar: String, ur: String): String = when (language) {
    "en" -> en
    "ar" -> ar
    "ur" -> ur
    else -> nb
  }

  val isRtl: Boolean
    get() = language == "ar" || language == "ur"

  val layoutDirection: Int
    get() = if (isRtl) View.LAYOUT_DIRECTION_RTL else View.LAYOUT_DIRECTION_LTR

  fun stateLabel(moment: PrayerMoment): String =
    if (moment.isNow) pick("Nå", "Now", "الآن", "ابھی") else pick("Neste", "Next", "التالية", "اگلی")

  val countdownFormat: String
    get() = pick("om %s", "in %s", "بعد %s", "%s میں")

  fun until(label: String, time: String): String =
    pick("til $label $time", "until $label $time", "حتى $label $time", "$label $time تک")

  val jamat: String
    get() = pick("jamat", "jamaat", "جماعة", "جماعت")

  val prayed: String
    get() = pick("Bedt", "Prayed", "صلّيت", "ادا کی")

  val skip: String
    get() = pick("Hopp over", "Skip", "تخطي", "چھوڑیں")

  fun prayedQuestion(label: String): String =
    pick("Har du bedt $label?", "Have you prayed $label?", "هل صلّيت $label؟", "کیا آپ نے $label ادا کی؟")

  fun endsAtPrayedQuestion(time: String, label: String): String = pick(
    "Går ut $time · har du bedt $label?",
    "Ends $time · have you prayed $label?",
    "ينتهي $time · هل صلّيت $label؟",
    "$time پر ختم · کیا آپ نے $label ادا کی؟",
  )

  val jamatTitle: String
    get() = pick("Jamat", "Jamaat", "الجماعة", "جماعت")

  val adhan: String
    get() = pick("Adhan", "Adhan", "الأذان", "اذان")

  val chooseMosque: String
    get() = pick("Velg en moské", "Choose a mosque", "اختر مسجدًا", "مسجد منتخب کریں")

  val chooseMosqueBody: String
    get() = pick(
      "Jamat-tidene vises her når du har valgt moské i appen.",
      "Jamaat times appear here once you choose a mosque in the app.",
      "تظهر أوقات الجماعة هنا بعد اختيار مسجد في التطبيق.",
      "ایپ میں مسجد منتخب کرنے کے بعد جماعت کے اوقات یہاں نظر آئیں گے۔",
    )

  val noJamatToday: String
    get() = pick(
      "Moskeen har ingen jamat-tider for i dag.",
      "The mosque has no jamaat times for today.",
      "لا توجد أوقات جماعة للمسجد اليوم.",
      "مسجد کے آج کے لیے جماعت کے اوقات نہیں ہیں۔",
    )

  val today: String
    get() = pick("I dag", "Today", "اليوم", "آج")

  fun prayedCount(done: Int, total: Int): String =
    pick("$done av $total", "$done of $total", "$done من $total", "$total میں سے $done")

  companion object {
    private val SUPPORTED = setOf("nb", "en", "ar", "ur")

    fun of(snapshot: PrayerSnapshot?): WidgetStrings = WidgetStrings(snapshot?.lang ?: "nb")
  }
}
