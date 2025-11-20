import { useEffect, useState } from "react";
import Analyser from "./Analyser";


function downloadBlob(blob: Blob, filename: string) {
    // Create a URL for the Blob object
    const blobUrl = URL.createObjectURL(blob);
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename; // Set default filename if not provided
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
}

function getMediaRecorder(mediaStream: MediaStream, onStop: (rawWav: Blob) => void): MediaRecorder {
    let chunks:Blob[] = [];
    const mediaRecorder = new MediaRecorder(mediaStream, {bitsPerSecond:128000});
    mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
            chunks.push(event.data);
        }
    }
    mediaRecorder.onstop = () => {
        onStop(new Blob(chunks))
    }
    return mediaRecorder
}

async function requestStream(): Promise<MediaStream> {
    // Set up media stream
    const stream = await navigator.mediaDevices.getDisplayMedia({
        video:true, 
        audio: {
            echoCancellation: false,
            noiseSuppression: false,
            sampleRate: 44100
        }
    });
    const track = stream.getAudioTracks()[0];
    if(!track) {
        throw "System audio not available";
    }
    stream.getVideoTracks().forEach(track => track.stop());
    const mediaStream = new MediaStream();
    mediaStream.addTrack(track);
    return mediaStream
}

function createAnalyser(stream: MediaStream): AnalyserNode {
    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)
    return analyser
}





export default function App() {
    const [status, setStatus] = useState("")
    const [stream, setStream] = useState<MediaStream|null>(null)
    const [recorder, setRecorder] = useState<MediaRecorder|null>(null)
    const [filename, setFilename] = useState("")

    
    const [analyser, setAnalyser] = useState<AnalyserNode|null>(null)


    useEffect(() => {
        if(stream) {
            const analyser = createAnalyser(stream)
            setAnalyser(analyser)
        }
    }, [stream])

    async function init() {
        setStream(await requestStream())
    }

    function onRecordEnd(b: Blob) {
        downloadBlob(b, `${filename}.wav`)
    }

    async function record() {
        if(stream) {
            const mediaRecorder = getMediaRecorder(stream, onRecordEnd)

            mediaRecorder.start();
            setRecorder(mediaRecorder)
        }
    }

    async function stop() {
        recorder?.stop()
        setRecorder(null)
    }


    function isRecordDisabled() {
        if(stream === null) return true
        if(recorder !== null) return true
        return false
    }
    function isStopDisabled() {
        if(stream === null) return true
        if(recorder === null) return true
        return false
    }

    return (
        <>
            <label>Output File Name</label>
            <input type="text" value={filename} onChange={e => setFilename(e.target.value)} />
            <br />
            <button onClick={init}>Init Recorder</button>
            <button onClick={record} disabled={isRecordDisabled()}>StartClip</button>
            <button onClick={stop} disabled={isStopDisabled()}>EndClip</button>

            <Analyser analyser={analyser}/>

            <ul>
                <li>Select Digital audio input device inside system tray.</li>
                <li>Press the Init button and share a window + system audio.</li>
                <li>If the analyser starts moving then youve got audio coming through.</li>
                <li>You're ready to start/stop the recording, Note: pressing stop will automatically download the file.</li>
            </ul>
        </>
    );
}


