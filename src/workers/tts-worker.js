import { PiperTTS, TextSplitterStream } from "../lib/nghitts/piper-tts.js";

let tts = null;

// Initialize the model
async function initializeModel(modelName = null) {
  try {
    // Default to the original model if no model name provided
    const defaultModel = 'ngochuyennew';
    const model = modelName || defaultModel;
    // Encode to handle spaces or special characters in filenames
    const encodedModel = encodeURIComponent(model);
    
    // Construct paths - fetch from public folder
    const localPath = `/tts-model/vi/${encodedModel}.onnx`;
    const localConfig = `/tts-model/vi/${encodedModel}.onnx.json`;
    
    // Remote fallback (Ví dụ: Trỏ tới link Cloudflare R2, AWS S3, hoặc Github Releases)
    const remoteBaseUrl = `https://your-remote-server.com/models/vi/`; 
    const remotePath = `${remoteBaseUrl}${encodedModel}.onnx`;
    const remoteConfig = `${remoteBaseUrl}${encodedModel}.onnx.json`;
    
    const onProgress = (progress) => {
      self.postMessage({ status: 'progress', progress });
    };

    try {
      // 1. Ưu tiên load từ domain hiện tại (Localhost máy bạn, hoặc CDN của Netlify)
      console.log("Đang thử tải mô hình từ Local...");
      tts = await PiperTTS.from_pretrained(localPath, localConfig, onProgress);
    } catch (localError) {
      // 2. Nếu ở Local không có (ví dụ bạn không up file 60MB lên Github), sẽ tự động Fallback tải từ Server khác!
      console.warn("Không tìm thấy ở Local, tự động Fallback sang Remote Server...", localError);
      tts = await PiperTTS.from_pretrained(remotePath, remoteConfig, onProgress);
    }
    
    // Get available speakers
    const speakers = tts.getSpeakers();
    
    self.postMessage({ status: "ready", voices: speakers });
  } catch (e) {
    console.error("Error loading model:", e);
    self.postMessage({ status: "error", data: e.message });
  }
}

// Handle voice preview
async function handlePreview(text, voice, speed) {
  try {
    const streamer = new TextSplitterStream();
    await streamer.push(text);
    streamer.close();

    const speakerId = typeof voice === 'number' ? voice : parseInt(voice) || 0;
    const lengthScale = 1.0 / (speed || 1.0);
    
    const stream = tts.stream(streamer, { 
      speakerId, 
      lengthScale
    });

    // Get just the first chunk for preview
    for await (const { audio } of stream) {
      // Create and play preview audio
      const audioBlob = audio.toBlob();
      self.postMessage({ status: "preview", audio: audioBlob });
      break; // Only preview the first chunk
    }
  } catch (error) {
    console.error('Error generating preview:', error);
  }
}

// Listen for messages from the main thread
self.addEventListener("message", async (e) => {
  const { type, text, voice, speed, model, id } = e.data;
  
  // Handle initialization
  if (type === 'init') {
    await initializeModel(model);
    return;
  }
  
  // Handle TTS generation
  if (!tts) {
    self.postMessage({ status: "error", data: "Model not initialized", id });
    return;
  }
  
  // Handle voice preview
  if (type === 'preview') {
    await handlePreview(text, voice, speed);
    return;
  }
  
  const streamer = new TextSplitterStream();

  await streamer.push(text);
  streamer.close(); // Indicate we won't add more text

  // Convert voice from voice ID to speaker ID
  const speakerId = typeof voice === 'number' ? voice : parseInt(voice) || 0;
  
  // Convert speed to lengthScale (inverse relationship: higher speed = lower lengthScale)
  const lengthScale = 1.0 / (speed || 1.0);
  
  const stream = tts.stream(streamer, { 
    speakerId, 
    lengthScale
  });
  const chunks = [];

  try {
    for await (const { text, audio } of stream) {
      self.postMessage({
        status: "stream",
        id,
        chunk: {
          audio: audio.toBlob(),
          text,
        },
      });
      chunks.push(audio);
    }
  } catch (error) {
    console.error("Error during streaming:", error);
    self.postMessage({ status: "error", data: error.message, id });
    return;
  }

  // Merge chunks
  let audio;
  if (chunks.length > 0) {
    try {
      const originalSamplingRate = chunks[0].sampling_rate;
      const length = chunks.reduce((sum, chunk) => sum + chunk.audio.length, 0);
      let waveform = new Float32Array(length);
      let offset = 0;
      for (const { audio: chunkAudio } of chunks) {
        waveform.set(chunkAudio, offset);
        offset += chunkAudio.length;
      }

      // Normalize peaks & trim silence
      normalizePeak(waveform, 1.0);

      // Create a new merged RawAudio with the original sample rate
      // @ts-expect-error - So that we don't need to import RawAudio
      audio = new chunks[0].constructor(waveform, originalSamplingRate);
    } catch (error) {
      console.error("Error processing audio chunks:", error);
      self.postMessage({ status: "error", data: error.message, id });
      return;
    }
  }

  self.postMessage({ status: "complete", audio: audio?.toBlob(), id });
});

function normalizePeak(f32, target = 0.9) {
  if (!f32?.length) return;
  let max = 1e-9;
  for (let i = 0; i < f32.length; i++) max = Math.max(max, Math.abs(f32[i]));
  const g = Math.min(4, target / max);
  if (g < 1) {
    for (let i = 0; i < f32.length; i++) f32[i] *= g;
  }
}

// Note: Initialization now handled via init message from UI
