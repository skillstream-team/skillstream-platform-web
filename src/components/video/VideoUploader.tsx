import React, { useState, useRef, useCallback } from 'react';
import { Upload, Video, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { apiService } from '../../services/api';

interface VideoUploaderProps {
  onUploadComplete: (videoUrl: string) => void;
  onUploadError?: (error: string) => void;
  maxSize?: number; // in MB
  acceptedFormats?: string[];
  existingVideoUrl?: string;
  onRemove?: () => void;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUploadComplete,
  onUploadError,
  maxSize = 500, // 500MB default for videos
  acceptedFormats = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  existingVideoUrl,
  onRemove
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(existingVideoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `Video size must be less than ${maxSize}MB`;
    }

    // Check file type
    const isValidType = acceptedFormats.some(format => file.type === format);
    if (!isValidType) {
      return `Video format not supported. Accepted formats: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      onUploadError?.(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);

      // Upload with progress tracking
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'video');

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(Math.round(percentComplete));
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200 || xhr.status === 201) {
          try {
            const response = JSON.parse(xhr.responseText);
            const videoUrl = response.url || response.data?.url;
            
            if (videoUrl) {
              setUploadProgress(100);
              onUploadComplete(videoUrl);
              // Clean up preview URL
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
              }
            } else {
              throw new Error('No video URL in response');
            }
          } catch (parseError) {
            throw new Error('Failed to parse upload response');
          }
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`);
        }
        setUploading(false);
      });

      xhr.addEventListener('error', () => {
        setError('Upload failed. Please try again.');
        onUploadError?.('Upload failed. Please try again.');
        setUploading(false);
        setUploadProgress(0);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      });

      xhr.addEventListener('abort', () => {
        setUploading(false);
        setUploadProgress(0);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      });

      // Get upload URL from API service
      const uploadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/files/upload`;
      
      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('token')}`);
      xhr.withCredentials = true;
      xhr.send(formData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      onUploadError?.(errorMessage);
      setUploading(false);
      setUploadProgress(0);
    }
  }, [maxSize, acceptedFormats, onUploadComplete, onUploadError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    if (videoPreview && !existingVideoUrl) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(null);
    setUploadProgress(0);
    setError(null);
    onRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
        Video Upload
      </label>

      {videoPreview ? (
        <div className="relative rounded-lg overflow-hidden border-2" style={{ borderColor: '#E5E7EB' }}>
          <div className="relative aspect-video bg-black">
            <video
              src={videoPreview}
              controls
              className="w-full h-full object-contain"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Uploading... {uploadProgress}%</p>
                  <div className="w-64 h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${uploadProgress}%`,
                        backgroundColor: '#00B5AD'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            {!uploading && (
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-2 rounded-full bg-black bg-opacity-70 text-white hover:bg-opacity-90 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#00B5AD] hover:bg-gray-50'
          }`}
          style={{
            borderColor: error ? '#EF4444' : '#E5E7EB',
            backgroundColor: uploading ? '#F9FAFB' : 'white'
          }}
        >
          {uploading ? (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 mx-auto animate-spin" style={{ color: '#00B5AD' }} />
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: '#0B1E3F' }}>
                  Uploading video... {uploadProgress}%
                </p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${uploadProgress}%`,
                      backgroundColor: '#00B5AD'
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <Video className="h-12 w-12 mx-auto mb-4" style={{ color: '#6F73D2' }} />
              <p className="text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                Drag & drop video here, or click to browse
              </p>
              <p className="text-xs" style={{ color: '#6F73D2' }}>
                Max size: {maxSize}MB • Formats: MP4, WebM, OGG, MOV
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={uploading}
          />
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0" style={{ color: '#EF4444' }} />
          <p className="text-sm" style={{ color: '#DC2626' }}>{error}</p>
        </div>
      )}

      {uploading && uploadProgress === 100 && (
        <div className="flex items-center space-x-2 p-3 rounded-lg bg-green-50 border border-green-200">
          <Check className="h-5 w-5 flex-shrink-0" style={{ color: '#10B981' }} />
          <p className="text-sm" style={{ color: '#059669' }}>Upload complete!</p>
        </div>
      )}
    </div>
  );
};

