
function Receiver(callback, onError, context, constraints) {
  AudioWM.call(this, context);

  this.analyser = this.context.createAnalyser();
  this.analyser.smoothingTimeConstant = 0;

  //preparing individual messages-specific events
  this.events = {};
  this.loop = this.nullFunction;
  this.lastMessage = NaN;
  this.bouncingBuffer = Array(10).fill(NaN);

  //preparing onChangeMessage event
  var onChangeMessage = this.nullFunction;
  var nullFunctionRef = this.nullFunction;
  var manageEventLoopRef = this.manageEventLoop;
  Object.defineProperty(this, 'onChangeMessage', {
    get: function() {
      return onChangeMessage;
    },
    set: function(value) {
      onChangeMessage = (value instanceof Function) ? value : nullFunctionRef;
      manageEventLoopRef.call(this);
    }}
  );

  //starting with default frequency values ( > 18600Hz)
  this.initialize();

  this.constraints = (constraints instanceof Object) ? constraints : this.defaultMediaStreamConstraints;
  var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
  getUserMedia.call(navigator, this.constraints, this.onMicrophoneReady.bind(this, callback), onError);
}
Receiver.prototype = Object.create(AudioWM.prototype);
Receiver.prototype.initialize = function(messageFrequencies, referencePositive, referenceNegative) {
  this.messageFrequencies = (messageFrequencies instanceof Array) ? messageFrequencies : this.defaultReferenceFrequencies.message;
  this.referencePositive = (isNaN(referencePositive)) ? this.defaultReferenceFrequencies.positive : referencePositive;
  this.referenceNegative = (isNaN(referenceNegative)) ? this.defaultReferenceFrequencies.negative : referenceNegative;
}
Receiver.prototype.onMicrophoneReady = function(callback, microphoneStream) {
  this.stream = this.context.createMediaStreamSource(microphoneStream);
  this.stream.connect(this.analyser);

  callback();
}

//
//RECEIVER LOGIC

Receiver.prototype.checkMessage = function() {

  //getting intensity values
  var messageIntensities = this.getIntensityValues(this.messageFrequencies);
  var referenceIntensities = this.getIntensityValues(this.referencePositive, this.referenceNegative);

  //sometimes hight frequencies' intensity gets much lower than normal
  //so i'm preventing my reference negative frequency to get lower than 'quiet' (-100)
  referenceIntensities[1] = Math.max(referenceIntensities[1], -100);

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

//
//EVENTS HANDLING

Receiver.prototype.manageEventLoop = function() {

  //stop event loop if there is no more events and onChangeMessage is null
  if (Object.keys(this.events) < 1 && this.onChangeMessage === this.nullFunction) {
    this.loop = this.nullFunction;
    this.bouncingBuffer.fill(NaN);
  } else {
    var eventLoop = this.loop;
    this.loop = this.checkMessageLoop;

    //start event loop if it wasn't running before
    if (eventLoop === this.nullFunction)
      this.loop();
  }
}
Receiver.prototype.addMessageEvent = function(message, callback) {

  //adding event to list
  if (this.events[message] == null)
    this.events[message] = [];
  this.events[message].push(callback);

  this.manageEventLoop();
}
Receiver.prototype.removeMessageEvent = function(message, callback) {

  //removing event
  if (this.events[message] != null) {
    var index = this.events[message].indexOf(callback);
    if (index > -1) {
      this.events[message].splice(index, 1);
      if (this.events[message].length < 1)
        delete this.events[message];
    }
  }

  this.manageEventLoop();
}
Receiver.prototype.checkMessageLoop = function() {

  //only do something if message has changed and it's not bouncing
  var message = this.checkMessage();
  if (this.lastMessage !== message && !this.isBouncing(message)) {

    //call user's onChangeMessage event
    setTimeout(this.onChangeMessage.bind(this, message), 0);

    //call user's message-specific events
    if (this.events[message] != null) {
      for (callback of this.events[message])
        setTimeout(callback, 0);
    }

    //update message
    this.lastMessage = message;
  }

  requestAnimationFrame(this.loop.bind(this));
}
Receiver.prototype.isBouncing = function(message) {

  //update bouncingBuffer
  this.bouncingBuffer.push(message);
  this.bouncingBuffer.shift();

  //check if it's bouncing
  for (var i=1; i<this.bouncingBuffer.length; i++)
    if (this.bouncingBuffer[i] !== this.bouncingBuffer[i-1])
      return true;
  return false;
}

//
//UTILS

//my 'Null Object' function (it can look strange, but believe me, it's damn useful!)
Receiver.prototype.nullFunction = function() { }

//
//CONSTANTS

Receiver.prototype.defaultMediaStreamConstraints = {
  audio: {
    mandatory: { echoCancellation: false },
    optional: [
      {googEchoCancellation: false},
      {googAutoGainControl: false},
      {googAutoGainControl2: false},
      {googNoiseSuppression: false},
      {googHighpassFilter: false},
      {googTypingNoiseDetection: false}
    ]
  },
  video: false
}
Receiver.prototype.defaultReferenceFrequencies = {
  message: [18600, 18800, 19000, 19200, 19400, 19600, 19800, 20000],
  positive: 20200,
  negative: 20400
}
