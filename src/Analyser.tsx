import { useEffect, useRef, useState } from "react"

const BUFFER_LENGTH = 2048


function getStreamTimeData(analyser: AnalyserNode): Uint8Array {
    analyser.fftSize = BUFFER_LENGTH;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray)
    return dataArray
}


export default function(props: {analyser: AnalyserNode|null}) {
    const {analyser} = props

    const [analysisLoop, setAnalysisLoop] = useState<NodeJS.Timeout>()
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if(analyser) {
            clearInterval(analysisLoop)

            const intervalId = setInterval(() => {
                if(!canvasRef.current) return;
                const canvasCtx = canvasRef.current.getContext("2d");
                if(!canvasCtx) return

                const WIDTH = canvasRef.current.width
                const HEIGHT = canvasRef.current.height
                
                const dataArray = getStreamTimeData(analyser)
                canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

                canvasCtx.lineWidth = 1;
                canvasCtx.strokeStyle = "rgb(0 0 0)";
                canvasCtx.beginPath();

                const sliceWidth = WIDTH / BUFFER_LENGTH * 2.;
                let x = 0;
                for (let i = 0; i < BUFFER_LENGTH; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = v * (HEIGHT / 2);

                    if (i === 0) {
                        canvasCtx.moveTo(x, y);
                    } else {
                        canvasCtx.lineTo(x, y);
                    }

                    x += sliceWidth;
                }

                // Finish the line
                canvasCtx.stroke();

            }, 100);

            setAnalysisLoop(intervalId)
        }
    }, [analyser])




    return <div className="canvas-container">
        <canvas ref={canvasRef}></canvas>
    </div>
}