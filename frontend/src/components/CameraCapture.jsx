import { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export default function CameraCapture({ onCapture, capturedImage, onRetake }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [streamActive, setStreamActive] = useState(false);
  const [error, setError] = useState(null);

  const isLoading = !capturedImage && !streamActive && !error;

  // Safely stop all camera tracks and release camera hardware
  const stopTracks = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn('Track stop error:', e);
      }
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const srcObj = videoRef.current.srcObject;
        if (typeof srcObj.getTracks === 'function') {
          srcObj.getTracks().forEach((track) => track.stop());
        }
      } catch (e) {
        console.warn('Video srcObj stop error:', e);
      }
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  // Initialize live video stream - ONLY runs when capturedImage changes
  useEffect(() => {
    let isCancelled = false;
    const videoElement = videoRef.current;

    if (!capturedImage) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        })
        .then((mediaStream) => {
          if (isCancelled) {
            // Stopped or unmounted while permission/stream was pending
            mediaStream.getTracks().forEach((track) => track.stop());
            return;
          }
          streamRef.current = mediaStream;
          if (videoElement) {
            videoElement.srcObject = mediaStream;
            videoElement.play?.().catch(() => {});
          }
          setStreamActive(true);
        })
        .catch((err) => {
          if (isCancelled) return;
          console.error('Camera access error:', err);
          setError(
            'Camera permission denied or camera unavailable. Please allow camera access in browser settings.'
          );
        });
    }

    return () => {
      isCancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoElement && videoElement.srcObject) {
        const srcObj = videoElement.srcObject;
        if (typeof srcObj.getTracks === 'function') {
          srcObj.getTracks().forEach((track) => track.stop());
        }
        videoElement.srcObject = null;
      }
    };
  }, [capturedImage]);

  // Capture frame to canvas and immediately release camera hardware
  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    // Mirror image for natural selfie feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Compress to JPEG 0.8
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

    // Stop camera immediately upon capture
    stopTracks();

    onCapture(dataUrl);
  };

  const handleRetakeClick = () => {
    stopTracks();
    onRetake();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between w-full mb-3 text-sm text-slate-300">
        <span className="flex items-center gap-1.5 font-medium text-emerald-400">
          <Camera className="w-4 h-4" /> Live Camera Selfie Verification
        </span>
        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
          No File Upload Allowed
        </span>
      </div>

      <div className="relative w-full aspect-4/3 max-h-[250px] sm:max-h-[280px] bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
        {error ? (
          <div className="p-6 text-center text-rose-400 flex flex-col items-center gap-2">
            <AlertCircle className="w-10 h-10 text-rose-500" />
            <p className="text-sm font-medium">{error}</p>
            <p className="text-xs text-slate-400 mt-2">
              Please check your browser permissions or click the camera icon in your address bar to allow camera access.
            </p>
          </div>
        ) : capturedImage ? (
          <div className="relative w-full h-full">
            <img
              src={capturedImage}
              alt="Captured selfie"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 bg-emerald-500/90 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
              <CheckCircle className="w-3.5 h-3.5" /> Photo Captured
            </div>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-10 text-slate-400 text-sm">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-indigo-400" />
                Initializing live camera...
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {/* Viewfinder crosshairs overlay */}
            <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-xl pointer-events-none flex items-center justify-center">
              <div className="w-48 h-56 border-2 border-dashed border-indigo-400/60 rounded-full pointer-events-none" />
            </div>
          </>
        )}
      </div>

      {/* Capture or Retake Controls */}
      <div className="mt-4 w-full flex justify-center">
        {capturedImage ? (
          <button
            type="button"
            onClick={handleRetakeClick}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" /> Retake Photo
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCapture}
            disabled={isLoading || Boolean(error)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer disabled:cursor-not-allowed"
          >
            <Camera className="w-4 h-4" /> Take Selfie Now
          </button>
        )}
      </div>
    </div>
  );
}
