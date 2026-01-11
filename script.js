
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const codecSelect = document.getElementById('codecSelect');
const qualitySelect = document.getElementById('qualitySelect');
const app = document.getElementById('app');
const preview = document.getElementById('preview');

let mediaRecorder;
let writableStream;

// 1. Detekce kodeků při načtení
function init() {
    const types = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/mp4;codecs=avc1'
    ];
    
    types.forEach(type => {
        if (MediaRecorder.isTypeSupported(type)) {
            const opt = document.createElement('option');
            opt.value = type;
            opt.textContent = type.split(';')[0] + " (" + type.match(/codecs=(.*?),/)?.[1].toUpperCase() + ")";
            codecSelect.appendChild(opt);
        }
    });
}

// 2. Hlavní funkce nahrávání
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
            audio: false
        });

        preview.srcObject = stream;

        // Nastavení pro ostrost (Content Hint)
        const videoTrack = stream.getVideoTracks()[0];
        if ('contentHint' in videoTrack) videoTrack.contentHint = 'detail';

        // Výběr souboru na disku (File System Access API)
        const handle = await window.showSaveFilePicker({
            suggestedName: `nahravka-${Date.now()}.webm`,
            types: [{ description: 'Video File', accept: { 'video/webm': ['.webm'] } }]
        });
        writableStream = await handle.createWritable();

        const options = {
            mimeType: codecSelect.value,
            videoBitsPerSecond: parseInt(qualitySelect.value)
        };

        mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.ondataavailable = async (e) => {
            if (e.data.size > 0) {
                await writableStream.write(e.data);
            }
        };

        mediaRecorder.onstop = async () => {
            await writableStream.close();
            stream.getTracks().forEach(t => t.stop());
            app.classList.remove('recording');
            startBtn.disabled = false;
            stopBtn.disabled = true;
        };

        mediaRecorder.start(200); 
        app.classList.add('recording');
        startBtn.disabled = true;
        stopBtn.disabled = false;

    } catch (err) {
        console.error("Chyba:", err);
        alert("Nahrávání nebylo spuštěno (možná jste zrušili výběr).");
    }
}

startBtn.onclick = startRecording;
stopBtn.onclick = () => mediaRecorder.stop();

init();
