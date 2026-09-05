package no.irn.bonnetid.car

import android.content.Intent
import androidx.car.app.CarAppService
import androidx.car.app.Screen
import androidx.car.app.Session
import androidx.car.app.validation.HostValidator
import no.irn.bonnetid.widget.BuildConfig

class BonnetidCarAppService : CarAppService() {
  override fun createHostValidator(): HostValidator {
    if (BuildConfig.DEBUG) return HostValidator.ALLOW_ALL_HOSTS_VALIDATOR
    return HostValidator.Builder(applicationContext)
      .addAllowedHosts(androidx.car.app.R.array.hosts_allowlist_sample)
      .build()
  }

  override fun onCreateSession(): Session = BonnetidSession()
}

class BonnetidSession : Session() {
  override fun onCreateScreen(intent: Intent): Screen = CarHomeScreen(carContext)
}
