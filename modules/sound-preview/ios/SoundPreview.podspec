Pod::Spec.new do |s|
  s.name           = 'SoundPreview'
  s.version        = '1.0.0'
  s.summary        = 'Plays a bundled notification sound so it can be auditioned in settings.'
  s.description    = 'Wraps AVAudioPlayer with a playback audio session so the adhan preview is audible even with the ringer switch off.'
  s.author         = 'Bønnetid'
  s.homepage       = 'https://irn.no'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AVFoundation'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
