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

  companion object {
    private val SUPPORTED = setOf("nb", "en", "ar", "ur")

    fun of(snapshot: PrayerSnapshot?): WidgetStrings = WidgetStrings(snapshot?.lang ?: "nb")
  }
}
