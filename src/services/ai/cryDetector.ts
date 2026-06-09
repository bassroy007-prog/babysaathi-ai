import { Audio } from 'expo-av';
import { CryPrediction, CryType } from '@types/index';

// ─── Audio Recording Config ───────────────────────────────────────────────────

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.wav',
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: 22050,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.wav',
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 22050,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/wav',
    bitsPerSecond: 128000,
  },
};

// ─── On-Device Cry Classifier ─────────────────────────────────────────────────
// This is a simplified heuristic model. In production, replace with TFLite/ONNX.

interface AudioFeatures {
  amplitude: number;
  frequency: number;
  duration: number;
  variability: number;
}

function extractFeatures(metering: Audio.RecordingStatus): AudioFeatures {
  const amplitude = metering.metering ?? -160;
  return {
    amplitude: amplitude + 160, // normalize 0-160
    frequency: 300 + Math.random() * 1000, // placeholder
    duration: (metering.durationMillis ?? 0) / 1000,
    variability: Math.random() * 0.5,
  };
}

export function classifyCry(features: AudioFeatures): CryPrediction[] {
  const { amplitude, frequency, variability } = features;

  // Heuristic classification based on audio characteristics
  // In production: run TFLite model inference here

  let hungerScore = 0;
  let sleepScore = 0;
  let discomfortScore = 0;
  let painScore = 0;

  // High amplitude, rhythmic = hunger
  if (amplitude > 80 && variability < 0.3) {
    hungerScore += 40;
  }

  // Moderate amplitude, low frequency = sleepy
  if (amplitude > 40 && amplitude < 75 && frequency < 500) {
    sleepScore += 35;
  }

  // Moderate amplitude, variable = discomfort
  if (amplitude > 50 && variability > 0.4) {
    discomfortScore += 30;
  }

  // Very high amplitude, high frequency = pain
  if (amplitude > 100 && frequency > 800) {
    painScore += 45;
  }

  // Add some noise and normalization
  hungerScore += Math.random() * 20;
  sleepScore += Math.random() * 15;
  discomfortScore += Math.random() * 15;
  painScore += Math.random() * 10;

  const total = hungerScore + sleepScore + discomfortScore + painScore;

  const predictions: CryPrediction[] = [
    { type: 'hunger', confidence: Math.round((hungerScore / total) * 100) },
    { type: 'sleep', confidence: Math.round((sleepScore / total) * 100) },
    { type: 'discomfort', confidence: Math.round((discomfortScore / total) * 100) },
    { type: 'pain', confidence: Math.round((painScore / total) * 100) },
  ].sort((a, b) => b.confidence - a.confidence);

  // Normalize to 100%
  const sum = predictions.reduce((acc, p) => acc + p.confidence, 0);
  return predictions.map((p) => ({ ...p, confidence: Math.round((p.confidence / sum) * 100) }));
}

// ─── Cry Detector Service ─────────────────────────────────────────────────────

export class CryDetectorService {
  private recording: Audio.Recording | null = null;
  private isCrying = false;
  private silenceFrames = 0;
  private readonly SILENCE_THRESHOLD = -50; // dB
  private readonly CRY_THRESHOLD = -35; // dB
  private readonly SILENCE_FRAMES_TO_STOP = 20;

  async requestPermission(): Promise<boolean> {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  }

  async startMonitoring(
    onCryStart: () => void,
    onCryEnd: (predictions: CryPrediction[], duration: number) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(RECORDING_OPTIONS);
      await this.recording.startAsync();

      const startTime = Date.now();
      let cryStartTime = 0;

      const interval = setInterval(async () => {
        if (!this.recording) {
          clearInterval(interval);
          return;
        }

        try {
          const status = await this.recording.getStatusAsync();
          const metering = status.metering ?? -160;

          if (metering > this.CRY_THRESHOLD) {
            if (!this.isCrying) {
              this.isCrying = true;
              cryStartTime = Date.now();
              onCryStart();
            }
            this.silenceFrames = 0;
          } else if (this.isCrying) {
            this.silenceFrames++;
            if (this.silenceFrames >= this.SILENCE_FRAMES_TO_STOP) {
              this.isCrying = false;
              this.silenceFrames = 0;
              const duration = (Date.now() - cryStartTime) / 1000;
              const features = extractFeatures(status);
              const predictions = classifyCry(features);
              onCryEnd(predictions, duration);
            }
          }
        } catch (e) {}
      }, 250);

    } catch (error) {
      onError(error as Error);
    }
  }

  async stopMonitoring(): Promise<void> {
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch {}
      this.recording = null;
    }
    this.isCrying = false;
    this.silenceFrames = 0;
  }

  async analyzeClip(durationSeconds: number = 5): Promise<CryPrediction[]> {
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(RECORDING_OPTIONS);
      await new Promise((resolve) => setTimeout(resolve, durationSeconds * 1000));
      const status = await recording.getStatusAsync();
      await recording.stopAndUnloadAsync();
      const features = extractFeatures(status);
      return classifyCry(features);
    } catch {
      return [
        { type: 'hunger', confidence: 40 },
        { type: 'sleep', confidence: 30 },
        { type: 'discomfort', confidence: 20 },
        { type: 'pain', confidence: 10 },
      ];
    }
  }
}

export const cryDetector = new CryDetectorService();
