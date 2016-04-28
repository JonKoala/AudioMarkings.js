
function Receiver(callback, onError, context, constraints) {
  AudioWM.call(this, context);

  this.analyser = this.context.createAnalyser();
  this.analyser.smoothingTimeConstant = 0;

  this.constraints = (constraints instanceof Object) ? constraints : this.defaultMediaStreamConstraints;
  this.initialize(); //initializes with default behavior

  var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
  getUserMedia.call(navigator, this.constraints, this.onMicrophoneReady.bind(this, callback), onError);
}
Receiver.prototype = Object.create(AudioWM.prototype);
Receiver.prototype.onMicrophoneReady = function(callback, microphoneStream) {
  this.stream = this.context.createMediaStreamSource(microphoneStream);
  this.stream.connect(this.analyser);

  callback();
}
Receiver.prototype.initialize = function(message, referencePositive, referenceNegative) {
  this.messageFrequencies = (message instanceof Array) ? message : this.defaultReferenceFrequencies.message;
  this.referencePositive = (isNaN(referencePositive)) ? this.defaultReferenceFrequencies.positive : referencePositive;
  this.referenceNegative = (isNaN(referenceNegative)) ? this.defaultReferenceFrequencies.negative : referenceNegative;
}
Receiver.prototype.checkMessage = function() {

  //getting intensity values
  var referenceIntensities = this.getIntensityValues(this.referencePositive, this.referenceNegative);
  var messageIntensities = this.getIntensityValues(this.messageFrequencies);

  //decoding the message
  var bit;
  var message = 0;
  var differenceToPositive;
  var differenceToNegative;
  for (var i=0; i<messageIntensities.length; i++) {
      differenceToPositive = Math.abs(messageIntensities[i]) - Math.abs(referenceIntensities[0]);
      differenceToNegative = Math.abs(messageIntensities[i]) - Math.abs(referenceIntensities[1]);
      differenceToPositive = Math.abs(differenceToPositive);
      differenceToNegative = Math.abs(differenceToNegative);

      bit = (differenceToPositive < differenceToNegative) ? 1 : 0;
      message += bit << messageIntensities.length - i - 1;
  }

  return message;
}

Receiver.prototype.getIntensityValues = function() {

  var frequencies = [].concat.apply([], arguments);

  var freqDomain = new Float32Array(this.analyser.frequencyBinCount);
  this.analyser.getFloatFrequencyData(freqDomain);
  var nyquist = this.context.sampleRate/2;

  var intensities = [];
  var index;
  for (var i=0; i<frequencies.length; i++) {
    index = Math.round(frequencies[i]/nyquist * freqDomain.length);
    intensities.push(freqDomain[index]);
  }

  return intensities;
}

Receiver.prototype.defaultMediaStreamConstraints = {
  audio: {
    mandatory: {
      echoCancellation: false,
      googEchoCancellation: false,
      googAutoGainControl: false,
      googNoiseSuppression: false,
      googHighpassFilter: false,
      googTypingNoiseDetection: false
    }, optional: []
  },
  video: false
}
Receiver.prototype.defaultReferenceFrequencies = {
  message: [19000, 19200, 19400, 19600, 19800],
  positive: 20000,
  negative: 20200
}
