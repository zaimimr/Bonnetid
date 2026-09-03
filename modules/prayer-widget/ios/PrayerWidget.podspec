Pod::Spec.new do |s|
  s.name           = 'PrayerWidget'
  s.version        = '1.0.0'
  s.summary        = 'Shares prayer times with the widget extension and drives Live Activities.'
  s.description    = 'Writes the prayer snapshot into the shared app group, reloads WidgetKit timelines and starts, updates and ends the prayer Live Activity.'
  s.author         = 'Bønnetid'
  s.homepage       = 'https://irn.no'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'ActivityKit', 'WidgetKit', 'AppIntents'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
