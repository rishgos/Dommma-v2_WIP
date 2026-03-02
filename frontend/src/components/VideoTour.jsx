import React, { useState, useRef } from 'react';
import { 
  Video, Upload, X, Play, Pause, Volume2, VolumeX,
  Maximize, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function VideoTourUploader({ listingId, existingVideo, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleUpload = async (file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file');
      return;
    }
    
    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('Video must be less than 100MB');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Get Cloudinary signature from backend
      const sigResponse = await axios.get(`${API}/api/cloudinary/signature?resource_type=video&folder=dommma/tours`);
      const sig = sigResponse.data;

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sig.api_key);
      formData.append('timestamp', sig.timestamp);
      formData.append('signature', sig.signature);
      formData.append('folder', sig.folder);

      const cloudinaryResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${sig.cloud_name}/video/upload`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );

      // Save video URL to listing
      await axios.post(`${API}/api/listings/${listingId}/video-tour`, {
        listing_id: listingId,
        video_url: cloudinaryResponse.data.secure_url,
        public_id: cloudinaryResponse.data.public_id,
        duration: cloudinaryResponse.data.duration,
        title: 'Property Video Tour'
      });

      onUpdate?.({
        video_url: cloudinaryResponse.data.secure_url,
        public_id: cloudinaryResponse.data.public_id,
        duration: cloudinaryResponse.data.duration
      });

    } catch (err) {
      console.error('Upload error:', err);
      if (err.response?.status === 503) {
        setError('Video uploads not configured. Please contact support.');
      } else {
        setError('Failed to upload video. Please try again.');
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = async () => {
    if (!existingVideo) return;
    
    try {
      await axios.delete(`${API}/api/listings/${listingId}/video-tour`);
      onUpdate?.(null);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to remove video');
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Video size={16} /> Video Tour
      </label>

      {existingVideo ? (
        <div className="relative rounded-xl overflow-hidden bg-black">
          <video 
            src={existingVideo.video_url}
            controls
            className="w-full max-h-[300px]"
            data-testid="video-tour-player"
          >
            Your browser does not support video playback.
          </video>
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="Remove video"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <CheckCircle2 size={12} className="text-green-400" />
            Video Tour Active
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            uploading 
              ? 'border-[#1A2F3A] bg-[#1A2F3A]/5' 
              : 'border-gray-300 hover:border-[#1A2F3A] hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files[0])}
            disabled={uploading}
          />
          
          {uploading ? (
            <div className="space-y-3">
              <Loader2 size={40} className="mx-auto text-[#1A2F3A] animate-spin" />
              <p className="text-[#1A2F3A] font-medium">Uploading video...</p>
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#1A2F3A] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500">{uploadProgress}% complete</p>
            </div>
          ) : (
            <>
              <Upload size={40} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">Upload Video Tour</p>
              <p className="text-sm text-gray-500 mt-1">
                MP4, MOV, or WebM • Max 100MB
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Video tours get 3x more inquiries!
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </div>
  );
}

// Video Player Component for listing display
export function VideoTourPlayer({ videoUrl, title = "Property Tour" }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden bg-black group">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full"
        onEnded={() => setIsPlaying(false)}
        data-testid="video-tour-display"
      />
      
      {/* Overlay controls */}
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          onClick={togglePlay}
          className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
        >
          {isPlaying ? (
            <Pause size={32} className="text-[#1A2F3A]" />
          ) : (
            <Play size={32} className="text-[#1A2F3A] ml-1" />
          )}
        </button>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-medium flex items-center gap-2">
            <Video size={16} /> {title}
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleMute}
              className="p-1 text-white hover:text-gray-300 transition-colors"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button 
              onClick={handleFullscreen}
              className="p-1 text-white hover:text-gray-300 transition-colors"
            >
              <Maximize size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Video tour badge */}
      <div className="absolute top-3 left-3 bg-[#1A2F3A] text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
        <Video size={12} /> Video Tour
      </div>
    </div>
  );
}
