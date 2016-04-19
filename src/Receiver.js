
function Receiver(callback, onError, context, constraints) {
  AudioWM.call(this, context);

  this.analyser = this.context.createAnalyser();
  this.analyser.smoothingTimeConstant = 0;

  this.constraints = (constraints instanceof Object) ? constraints : this.defaultMediaStreamConstraints;

  var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
  getUserMedia.call(navigator, this.constraints, this.onMicrophoneReady.bind(this, callback), onError);
}
Receiver.prototype = Object.create(AudioWM.prototype);
Receiver.prototype.onMicrophoneReady = function(callback, microphoneStream) {
  this.stream = this.context.createMediaStreamSource(microphoneStream);
  this.stream.connect(this.analyser);

  callback();
}
