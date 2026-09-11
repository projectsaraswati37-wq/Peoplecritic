import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface CameraScannerProps {
  onCapture: (imageDataUrl: string) => void;
  onCancel: () => void;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [pose, setPose] = useState({ yaw: 0, pitch: 0, roll: 0 });

  useEffect(() => {
    let cancelled = false;
    const loadModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
        );
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
        });
        if (!cancelled) {
          landmarkerRef.current = landmarker;
          setModelReady(true);
        } else {
          landmarker.close();
        }
      } catch {
        // The camera remains usable if the optional model cannot load.
        setModelReady(false);
      }
    };
    loadModel();
    return () => { cancelled = true; landmarkerRef.current?.close(); };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setReady(true);
        };
      }
    } catch (err) {
      const e = err as Error;
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setCameraError('PERMISSION_DENIED');
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        setCameraError('NO_CAMERA');
      } else {
        setCameraError('UNKNOWN');
      }
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!ready || !modelReady || !videoRef.current) return;
    let frame = 0;
    let lastTime = -1;
    const trackFace = () => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      if (video && landmarker && video.readyState >= 2 && video.currentTime !== lastTime) {
        lastTime = video.currentTime;
        const result = landmarker.detectForVideo(video, performance.now());
        const points = result.faceLandmarks[0];
        setFaceDetected(Boolean(points));
        if (points) {
          const leftEye = points[33];
          const rightEye = points[263];
          const nose = points[1];
          const eyeMidX = (leftEye.x + rightEye.x) / 2;
          const eyeMidY = (leftEye.y + rightEye.y) / 2;
          setPose({
            yaw: Math.round((nose.x - eyeMidX) * 180),
            pitch: Math.round((nose.y - eyeMidY) * 180),
            roll: Math.round(Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 57.3),
          });
        }
      }
      frame = requestAnimationFrame(trackFace);
    };
    frame = requestAnimationFrame(trackFace);
    return () => cancelAnimationFrame(frame);
  }, [modelReady, ready]);

  const handleCapture = () => {
    if (!videoRef.current || !ready) {
      setCameraError('INVALID_PHOTO');
      return;
    }
    setScanning(true);
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      if (!dataUrl.startsWith('data:image/')) {
        setScanning(false);
        setCameraError('INVALID_PHOTO');
        return;
      }
      // Stop stream then hand off
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setTimeout(() => onCapture(dataUrl), 300);
    } else {
      setScanning(false);
      setCameraError('INVALID_PHOTO');
    }
  };

  // ── Error screens ──
  if (cameraError) {
    const messages: Record<string, { title: string; body: string }> = {
      PERMISSION_DENIED: {
        title: 'CAMERA ACCESS DENIED',
        body: "Even the camera doesn't want to participate.",
      },
      NO_CAMERA: {
        title: 'NO CAMERA DETECTED',
        body: 'This device appears to be camera-shy.',
      },
      INVALID_PHOTO: {
        title: 'PHOTO INVALID',
        body: 'No usable photo was captured. Please try again.',
      },
      UNKNOWN: {
        title: 'CAMERA CONNECTION FAILED',
        body: 'An unknown anomaly has prevented scanning.',
      },
    };
    const msg = messages[cameraError] ?? messages.UNKNOWN;
    return (
      <div className="operational-page camera-page flex flex-col items-center justify-center min-h-screen p-6 text-center gap-6">
        <div
          className="rounded-xl border p-8 max-w-md w-full"
          style={{ borderColor: '#ff3366', background: 'rgba(255,51,102,0.08)' }}
        >
          <div className="text-4xl mb-4">📷</div>
          <h2 className="text-xl font-mono font-bold text-red-400 mb-3">{msg.title}</h2>
          <p className="text-sm font-mono mb-1" style={{ color: '#8aaccc' }}>{msg.body}</p>
          <p className="text-xs font-mono opacity-50 mb-6">ERROR: CAMERA MODULE OFFLINE</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={startCamera}
              className="px-6 py-3 rounded border border-cyan-400 text-cyan-400 font-mono text-sm hover:bg-cyan-400/10 transition-all"
            >
              RETRY
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded border text-sm font-mono transition-all hover:opacity-70"
              style={{ borderColor: '#1a3a5c', color: '#4a6a8c' }}
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="operational-page camera-page flex flex-col items-center min-h-screen bg-cyber-bg">
      {/* Header */}
      <div className="workspace-header w-full px-4 pt-4 pb-2 flex items-center justify-between max-w-lg">
        <div>
          <div className="text-xs font-mono text-cyan-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" style={{ animation: 'blink 1s step-start infinite' }} />
            HUMAN SCANNER ACTIVE
          </div>
          <div className="text-xs font-mono opacity-40 mt-0.5">Position yourself inside the frame.</div>
        </div>
        <button
          onClick={onCancel}
          className="text-xs font-mono px-3 py-1.5 rounded border transition-all hover:opacity-70"
          style={{ borderColor: '#1a3a5c', color: '#4a6a8c' }}
        >
          CANCEL
        </button>
      </div>

      {/* Camera view */}
      <div className="relative w-full max-w-lg flex-1 flex items-center justify-center px-4">
        <div className="camera-frame relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: '3/4', background: '#000' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Scanning corners */}
          <div className="corner-bracket corner-tl" style={{ top: 16, left: 16 }} />
          <div className="corner-bracket corner-tr" style={{ top: 16, right: 16 }} />
          <div className="corner-bracket corner-bl" style={{ bottom: 16, left: 16 }} />
          <div className="corner-bracket corner-br" style={{ bottom: 16, right: 16 }} />

          {/* Scanning line */}
          {ready && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="scan-line" />
            </div>
          )}

          {/* Loading overlay */}
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <div className="text-center">
                <div className="text-cyan-400 font-mono text-sm animate-pulse">INITIALIZING SCANNER...</div>
              </div>
            </div>
          )}

          {/* HUD overlays */}
          {ready && (
            <>
              <div
                className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded text-xs font-mono"
                style={{ background: 'rgba(0,212,255,0.12)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}
              >
                {modelReady ? (faceDetected ? 'FACE LOCKED · AI LANDMARKS ACTIVE' : 'SEARCHING FOR FACE...') : 'LOADING VISION MODEL...'}
              </div>
              <div
                className="absolute bottom-4 right-4 text-xs font-mono"
                style={{ color: 'rgba(0,212,255,0.6)' }}
              >
                {faceDetected ? `YAW ${pose.yaw >= 0 ? '+' : ''}${pose.yaw}° · ROLL ${pose.roll >= 0 ? '+' : ''}${pose.roll}°` : 'LIVE'}
              </div>
            </>
          )}

          {faceDetected && (
            <div className="absolute left-4 bottom-4 rounded px-2 py-1 text-[10px] font-mono" style={{ color: '#ccf27d', background: 'rgba(8,16,22,.72)', border: '1px solid rgba(204,242,125,.35)' }}>
              HEAD POSE · {pose.pitch >= 0 ? '+' : ''}{pose.pitch}° PITCH
            </div>
          )}

          {scanning && (
            <div className="absolute inset-0 bg-cyan-400/20 flex items-center justify-center">
              <div className="text-cyan-300 font-mono text-lg animate-pulse">CAPTURING...</div>
            </div>
          )}
        </div>
      </div>

      {/* Capture button */}
      <div className="w-full max-w-lg px-4 py-6 flex flex-col gap-3">
        <button
          onClick={handleCapture}
          disabled={!ready || scanning}
          className="w-full py-4 rounded-xl font-mono font-bold text-lg tracking-widest transition-all duration-200 disabled:opacity-40"
          style={{
            background: ready && !scanning
              ? 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,255,136,0.15))'
              : 'rgba(0,212,255,0.05)',
            border: '2px solid',
            borderColor: ready && !scanning ? '#00d4ff' : '#1a3a5c',
            color: ready && !scanning ? '#00d4ff' : '#4a6a8c',
            boxShadow: ready && !scanning ? '0 0 20px rgba(0,212,255,0.25)' : 'none',
          }}
        >
          {scanning ? '⚡ CAPTURING...' : faceDetected ? '⚡ SCAN HUMAN' : '⚡ FIND YOUR FACE'}
        </button>

        <p className="text-center text-xs font-mono opacity-30">
          Images are processed locally and are not stored.
        </p>
      </div>
    </div>
  );
};

export default CameraScanner;
