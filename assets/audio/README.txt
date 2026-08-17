Ambient music.

Drop an .mp3 here, then set its path in js/config.js:

  WI.audio = { src: 'assets/audio/ambient.mp3', volume: 0.35 };

While src is empty the music button stays hidden. Audio never
autoplays - it always waits for a tap on the button.
