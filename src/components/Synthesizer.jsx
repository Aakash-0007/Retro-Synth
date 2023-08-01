import React, { useState, useEffect } from "react";

const notes = [
  { frequency: 130.81, label: "C-3", isSharp: false },
  { frequency: 146.83, label: "D-3", isSharp: false },
  { frequency: 164.81, label: "E-3", isSharp: false },
  { frequency: 174.61, label: "F-3", isSharp: false },
  { frequency: 196.0, label: "G-3", isSharp: false },
  { frequency: 220.0, label: "A-3", isSharp: false },
  { frequency: 246.94, label: "B-3", isSharp: false },
  { frequency: 261.63, label: "C-4", isSharp: false },
  { frequency: 138.59, label: "C#3", isSharp: true },
  { frequency: 155.56, label: "D#3", isSharp: true },
  { frequency: 185.0, label: "F#3", isSharp: true },
  { frequency: 207.65, label: "G#3", isSharp: true },
  { frequency: 233.08, label: "A#3", isSharp: true },
];

const audioContext = new (window.AudioContext || window.webkitAudioContext)();


const Piano = ({
  waveformType,
  lowpassFrequency,
  qValue,
  widthEffect,
  adsr,
  delayTime,
  isPolyMode,
  volume,
}) => {
  
  const [activeOscillators, setActiveOscillators] = useState([]);
  const [isNoteOn, setIsNoteOn] = useState(false);
  
  /* useEffect to update waveform-type, frequency, Q in real time */
  useEffect(() => {
    if (isNoteOn) {
      activeOscillators.forEach(({ oscillator, lowpassFilter }) => {
        oscillator.type = waveformType;
        lowpassFilter.frequency.setValueAtTime(
          lowpassFrequency,
          oscillator.context.currentTime
        );
        lowpassFilter.Q.value = qValue;
      });
    }
  }, [
    waveformType,
    lowpassFrequency,
    qValue,
    adsr,
    activeOscillators,
    isNoteOn,
  ]);
  

  const createOscillator = (freq, detune) => {

    /* Oscillator creation */
    const oscillator = audioContext.createOscillator();
    oscillator.type = waveformType;
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    oscillator.detune.setValueAtTime(detune, audioContext.currentTime);

    /* Lowpass-filter */
    const lowpassFilter = audioContext.createBiquadFilter();
    lowpassFilter.type = "lowpass";
    lowpassFilter.frequency.setValueAtTime(
      lowpassFrequency / 2,
      audioContext.currentTime
    );

    /* ADSR envelops */
    const gainNode = audioContext.createGain();
    const { attack, decay, sustain, release } = adsr;
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(
      volume,
      audioContext.currentTime + attack
    );
    gainNode.gain.linearRampToValueAtTime(
      sustain * volume,
      audioContext.currentTime + attack + decay
    );
    gainNode.gain.linearRampToValueAtTime(
      0,
      audioContext.currentTime + attack + decay + release
    );

    /* Delay node for Time */
    const delayNode = audioContext.createDelay();
    delayNode.delayTime.setValueAtTime(delayTime, audioContext.currentTime);

    /* Connect the audio graph: oscillator -> lowpass filter -> delay -> gain node -> destination */
    oscillator.connect(lowpassFilter);
    lowpassFilter.connect(delayNode);
    delayNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();

    return { oscillator, audioContext, lowpassFilter, gainNode };
  };

  const noteOn = (note) => {
    const setWidth = widthEffect;
    const freq = notes[note].frequency;
    const newOscillator = [
      createOscillator(freq, 0),
      createOscillator(freq, -setWidth),
      createOscillator(freq, setWidth),
    ]; 
    setActiveOscillators(newOscillator);
    setIsNoteOn(true);
    
  };

  const noteOff = () => {
    activeOscillators.forEach(({ oscillator, gainNode}) => {
       gainNode.gain.setValueAtTime(
        gainNode.gain.value,
        audioContext.currentTime
      );
      gainNode.gain.linearRampToValueAtTime(
        0,
        audioContext.currentTime + adsr.release
      );
      oscillator.stop(audioContext.currentTime + adsr.release);    
      if (!isPolyMode) {
        oscillator.disconnect();
      }
    });
    setActiveOscillators([]);
    setIsNoteOn(false);
  };
  

  return (
    <div className="piano-wrapper">
      {/* Keyboard heading */}
      <h1 className="heading">Keyboard</h1>
      {/* Piano-keys */}
        <div className="piano-keys">
          {notes.map((note, index) => (
            <div
              key={note.label}
              onClick={() => noteOn(index)}
              onMouseUp={noteOff}
              onContextMenu={(e) => e.preventDefault()}
              className={`piano-key ${note.label} ${note.isSharp ? "sharp" : ""}`}
            >
              {note.label}
            </div>
          ))}
        </div>
    </div>
  );
};

const Synthesizer = () => {
  const [adsr, setAdsr] = useState({
    attack: 0.1,
    decay: 0.1,
    sustain: 0.6,
    release: 0.5,
  });
  const [width, setWidth] = useState(10);
  const [volume, setVolume] = useState(0.3);
  const [waveformType, setWaveformType] = useState("sawtooth");
  const [lowpassFrequency, setLowpassFrequency] = useState(1000);
  const [Qchange, setQchange] = useState(1);
  const [delayTime, setDelayTime] = useState(0);
  const [isPolyMode, setIsPolyMode] = useState(false);

  return (
    <div className="synthesizer-wrapper">
      <h1 className="heading">Audio Synthesizer</h1>
      <div className="main-container">
        <div className="synth-sliders">
          <div className="synth-grid">
            {/* First Column */}
            <div className="column">
              <div className="label-wrapper">
                <div className="volume">
                  <label htmlFor="volume" title="volume">VOL :</label>
                  <input
                    type="range"
                    id="volume"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                  />
                </div>
              </div>
              <div className="label-wrapper">
                <div className="waveform">
                  <label htmlFor="waveform" title="waveform">WAV :</label>
                  &nbsp;&nbsp;
                  <select
                    id="waveform"
                    value={waveformType}
                    onChange={(e) => setWaveformType(e.target.value)}
                    className="select"
                  >
                    <option value="sine" title="sine">SIN</option>
                    <option value="square" title="square">SQU</option>
                    <option value="sawtooth" title="sawtooth">SAW</option>
                    <option value="triangle" title="triangle">TRI</option>
                  </select>
                </div>
                <div className="width">
                  <label htmlFor="width" title="width">WID :</label>

                  <input
                    type="range"
                    id="width"
                    min="0"
                    max="50"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                  />
                </div>
              </div>
            </div>
            {/* Second Column */}
            <div className="column">
              <div className="label-wrapper">
                <div className="ATK">
                  <label htmlFor="adsrAttack" title="attack">ATK :</label>
                  <input
                    type="range"
                    id="adsrAttack"
                    min="0"
                    max="1"
                    step="0.01"
                    value={adsr.attack}
                    onChange={(e) =>
                      setAdsr({ ...adsr, attack: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div className="ATK">
                  <label htmlFor="adsrDecay" title="decay">DEC :</label>
                  <input
                    type="range"
                    id="adsrDecay"
                    min="0"
                    max="1"
                    step="0.01"
                    value={adsr.decay}
                    onChange={(e) =>
                      setAdsr({ ...adsr, decay: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div className="ATK">
                  <label htmlFor="adsrSustain" title="sustain">SUS :</label>
                  <input
                    type="range"
                    id="adsrSustain"
                    min="0"
                    max="1"
                    step="0.01"
                    value={adsr.sustain}
                    onChange={(e) =>
                      setAdsr({ ...adsr, sustain: parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div className="ATK">
                  <label htmlFor="adsrRelease" title="release">REL :</label>
                  <input
                    type="range"
                    id="adsrRelease"
                    min="0"
                    max="10"
                    step="0.01"
                    value={adsr.release}
                    onChange={(e) =>
                      setAdsr({ ...adsr, release: parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>
            </div>
             {/* Third Column */}
            <div className="column">
              <div className="label-wrapper">
                <div className="FRQ">
                  <label htmlFor="lowpassFrequency" title="lowpass-frequency">FRQ :</label>
                  <input
                    type="range"
                    id="lowpassFrequency"
                    min="100"
                    max="5000"
                    value={lowpassFrequency}
                    onChange={(e) => setLowpassFrequency(e.target.value)}
                  />
                  <br></br>
                </div>
                <div className="FRQ">
                  <label htmlFor="Qchange" title="Q value">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Q :
                  </label>
                  <input
                    type="range"
                    id="Qchange"
                    min="1"
                    max="30"
                    step="0.5"
                    value={Qchange}
                    onChange={(e) => setQchange(e.target.value)}
                  />
                </div>
              </div>
              <div className="label-wrapper-time">
                <div className="delay">
                  <label htmlFor="delayTime" title="time">TIM :</label>
                  <input
                    type="range"
                    id="delayTime"
                    min="0"
                    max="0.5"
                    step="0.01"
                    value={delayTime}
                    onChange={(e) => setDelayTime(parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Poly Mode Button */}
        <div className="poly-div">
          <button
            onClick={() => setIsPolyMode(!isPolyMode)}
            title="polyphonic mode"
            className="poly-button"
          >
            {isPolyMode ? "Poly On" : "Poly Off"}
          </button>
        </div>

        {/*Piano Component */}
        <div className="piano-component">
          <Piano
            waveformType={waveformType}
            volume={volume}
            lowpassFrequency={lowpassFrequency}
            qValue={Qchange}
            widthEffect={width}
            adsr={adsr}
            delayTime={delayTime}
            isPolyMode={isPolyMode}
          />
        </div>
      </div>
    </div>
  );
};

export default Synthesizer;
