let essentiaExtractor;
let audioURL = "https://freesound.org/data/previews/328/328857_230356-lq.mp3";

let audioData;
let audioCtx = new AudioContext();
let plotSpectrogram;
let plotContainerId = "plotDiv";

let isComputed = false;
// settings for feature extractor
let frameSize = 1024;
let hopSize = 512;
let numBands = 96;

// callback function which compute the log mel spectrogram of input audioURL on a button.onclick event
async function onClickFeatureExtractor() {
  // load audio file from an url
  audioCtx.resume();
  audioData = await essentiaExtractor.getAudioChannelDataFromURL(audioURL, audioCtx);

  // if already computed, destroy plot traces
  if (isComputed) { plotSpectrogram.destroy(); };
  
  // modifying default extractor settings
  essentiaExtractor.frameSize = frameSize;
  essentiaExtractor.hopSize = hopSize;
  // settings specific to an algorithm
  essentiaExtractor.profile.MelBands.numberBands = numBands;

  // Now generate overlapping frames with given frameSize and hopSize
  // You could also do it using pure JS to avoid arrayToVector and vectorToArray conversion
  let audioFrames = essentiaExtractor.FrameGenerator(audioData, frameSize, hopSize);
  let logMelSpectrogram = [];
  for (var i=0; i<audioFrames.size(); i++) {
    logMelSpectrogram.push(essentiaExtractor.melSpectrumExtractor(essentiaExtractor.vectorToArray(audioFrames.get(i))));
  }

  // plot the feature
  plotSpectrogram.create(
    logMelSpectrogram, // input feature array
    "LogMelSpectrogram", // plot title
    audioData.length, // length of audio in samples
    audioCtx.sampleRate, // audio sample rate,
    hopSize // hopSize
  );
  // essentiaExtractor.algorithms.delete();
  isComputed = true;
}

$(document).ready(function() {
  
  // create EssentaPlot instance
  plotSpectrogram = new EssentiaPlot.PlotHeatmap(
    Plotly, // Plotly.js global 
    plotContainerId, // HTML container id
    "spectrogram", // type of plot
    EssentiaPlot.LayoutSpectrogramPlot // layout settings
  );

  plotSpectrogram.plotLayout.yaxis.range = [0, numBands];

  // Now let's load the essentia wasm back-end, if so create UI elements for computing features
  EssentiaWASM().then(async function(WasmModule) {
    // populate html audio player with audio
    let player = document.getElementById("audioPlayer");
    player.src = audioURL;
    player.load();

    essentiaExtractor = new EssentiaExtractor(WasmModule);

    // essentia version log to html div
    $("#logDiv").html("<h5> essentia-" + essentiaExtractor.version + " wasm backend loaded ... </h5><br>");

    $("#logDiv").append('<button id="btn" class="ui white inverted button">Calcular espectrograma </button>');

    var button = document.getElementById("btn");

    // add onclick event handler to comoute button
    button.addEventListener("click", () => onClickFeatureExtractor(), false);
  });
});


//Verobio
 /** 
                We need to wait for the whole page to load before we try to 
                work with Verovio.
                Usar la extensión Web Server for Chrome con la opción "set cors-headers"
            **/
                document.addEventListener("DOMContentLoaded", (event) => {
                    verovio.module.onRuntimeInitialized = function () {
                        // This line initializes the Verovio toolkit
                        const tk = new verovio.toolkit();
    
                        tk.setOptions({
                            pageWidth: document.body.clientWidth,
                            pageHeight: document.body.clientHeight,
                            scaleToPageSize: true,
                        });
    
                        // The current page, which will change when playing through the piece
                        let currentPage = 1;
    
                        /**
                         The handler to start playing the file
                        **/
                        const playMIDIHandler = function () {
                            // Get the MIDI file from the Verovio toolkit
                            let base64midi = tk.renderToMIDI();
                            // Add the data URL prefixes describing the content
                            let midiString = 'data:audio/midi;base64,' + base64midi;
                            // Pass it to play to MIDIjs
                            MIDIjs.play(midiString);
                        }
    
                        /**
                         The handler to stop playing the file
                        **/
                        const stopMIDIHandler = function () {
                            MIDIjs.stop();
                        }
    
                        const midiHightlightingHandler = function (event) {
                            // Remove the attribute 'playing' of all notes previously playing
                            let playingNotes = document.querySelectorAll('g.note.playing');
                            for (let playingNote of playingNotes) playingNote.classList.remove("playing");
    
                            // Get elements at a time in milliseconds (time from the player is in seconds)
                            let currentElements = tk.getElementsAtTime(event.time * 1000);
    
                            if (currentElements.page == 0) return;
    
                            if (currentElements.page != currentPage) {
                                currentPage = currentElements.page;
                                document.getElementById("notation").innerHTML = tk.renderToSVG(currentPage);
                            }
    
                            // Get all notes playing and set the class
                            for (note of currentElements.notes) {
                                let noteElement = document.getElementById(note);
                                if (noteElement) noteElement.classList.add("playing");
                            }
                        }
    
                        /**
                            Wire up the buttons to actually work.
                        */
                        document.getElementById("playMIDI").addEventListener("click", playMIDIHandler);
                        document.getElementById("stopMIDI").addEventListener("click", stopMIDIHandler);
                        /**
                         Set the function as message callback
                        */
                        MIDIjs.player_callback = midiHightlightingHandler;
    
                        // This line fetches the MEI file we want to render...
                        //Para que funcione, el archivo debe estar en un servidor, 
                        //además para evitar los bloqueos de Chrome, ese servidor debe tener activada la opción "set CORS-header"
                        //Sugiero usar como servidor, el que provee la extensión de Chrome "Web Server for chrome"
                        fetch("http://127.0.0.1:8887/Bachué.mei")
                        
                        // ... then receives the response and "unpacks" the MEI from it
                        .then((response) => response.text())
                        .then((meiXML) => {
                            // ... then we can load the data into Verovio ...
                            tk.loadData(meiXML);
                            // ... and generate the SVG for the first page ...
                            let svg = tk.renderToSVG(1);
                            // ... and finally gets the <div> element with the ID we specified, 
                            // and sets the content (innerHTML) to the SVG that we just generated.
                            document.getElementById("notation").innerHTML = svg;
                        });
                    }
                });