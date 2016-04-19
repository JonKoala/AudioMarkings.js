
function AudioWM(context) {
  this.context = (context instanceof AudioContext) ? context : new (window.AudioContext || window.webkitAudioContext)();
}
AudioWM.prototype.createSignalsArray = function(trueFundamental, fundamental, numBits) {

  //considering 1 extra bit for the reference frequency
  var frequencyLimit = trueFundamental + (numBits*fundamental);
  var length = (frequencyLimit/fundamental);

  //create a string with a number of 0s equal to numBits
  var overheadZeros = new Array(numBits);
  overheadZeros.fill(0);
  overheadZeros = overheadZeros.join('');

  //create sine and cosine arrays
  var real = new Float32Array(length + 1); //+1 for the first argument of fft arrays
  var imag = new Float32Array(real.length);
  var wave;

  //populate waveArray with periodic waves
  var waveArray = [];
  var waveArrayLength = Math.pow(2, 5);
  for (var i=0; i<waveArrayLength; i++) {

    //constructs each overtone structure
    var bitSequence = (overheadZeros + i.toString(2)).slice(-numBits);
    bitSequence = bitSequence.split('').reverse().join('');
    for (var j=0; j<bitSequence.length; j++)
        real[real.length - (bitSequence.length - j + 1)] = parseInt(bitSequence[j]);
    real[real.length - 1] = 1;

    //create periodic wave and populate waveArray
    wave = this.context.createPeriodicWave(real, imag);
    waveArray.push(wave);
  }

  return waveArray;
}
AudioWM.prototype.defaultMediaStreamConstraints = {
  audio: {
    mandatory: {
      echoCancellation: false,
      googEchoCancellation: false,
      googAutoGainControl: false,
      googAutoGainControl2: false,
      googNoiseSuppression: false,
      googHighpassFilter: false,
      googTypingNoiseDetection: false
    }, optional: []
  },
  video: false
};
