import React, { useState, useRef } from 'react';
import { 
  Paperclip, 
  Image, 
  Camera, 
  File, 
  X, 
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

export interface Attachment {
  id: string;
  file: File;
  type: 'image' | 'file' | 'photo';
  preview?: string;
  size: number;
  name: string;
}

interface AttachmentMenuProps {
  onAttachmentsSelected: (attachments: Attachment[]) => void;
  onClose: () => void;
  isOpen: boolean;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

export const AttachmentMenu: React.FC<AttachmentMenuProps> = ({
  onAttachmentsSelected,
  onClose,
  isOpen,
  buttonRef
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'requesting' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef?.current && !buttonRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  // Cleanup camera stream on unmount
  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const attachments: Attachment[] = files.map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        size: file.size,
        name: file.name,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      }));
      
      onAttachmentsSelected(attachments);
      onClose();
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const attachments: Attachment[] = files.map(file => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        type: 'image',
        size: file.size,
        name: file.name,
        preview: URL.createObjectURL(file)
      }));
      
      onAttachmentsSelected(attachments);
      onClose();
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  const requestCameraPermission = async () => {
    try {
      setPermissionStatus('requesting');
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      streamRef.current = stream;
      setPermissionStatus('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
          }
        };
      }
    } catch (err) {
      console.error('Camera permission denied:', err);
      setPermissionStatus('denied');
      setError('Camera permission was denied. Please enable camera access in your browser settings.');
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const fileName = `photo-${Date.now()}.jpg`;
        // Create a proper File object from the blob
        const file = Object.assign(blob, { 
          name: fileName,
          lastModified: Date.now()
        }) as File;
        const attachment: Attachment = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          type: 'photo',
          size: blob.size,
          name: fileName,
          preview: URL.createObjectURL(blob)
        };
        
        onAttachmentsSelected([attachment]);
        onClose();
        
        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setPermissionStatus(null);
      }
    }, 'image/jpeg', 0.8);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setPermissionStatus(null);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Menu */}
      <div className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
        {/* Arrow pointing down to the button */}
        <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-700 transform rotate-45"></div>
        
        <div className="p-2">
          {/* File Upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <File className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Attach File</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Documents, PDFs, etc.</p>
            </div>
          </button>

          {/* Photo from Gallery */}
          <button
            onClick={() => imageInputRef.current?.click()}
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Image className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Photo from Gallery</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Choose from your photos</p>
            </div>
          </button>

          {/* Take Photo */}
          <button
            onClick={requestCameraPermission}
            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Camera className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Take Photo</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Use camera</p>
            </div>
          </button>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          onChange={handleImageSelect}
          className="hidden"
          accept="image/*"
        />
      </div>

      {/* Camera Modal */}
      {permissionStatus === 'requesting' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Requesting Camera Permission
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Please allow camera access when prompted
              </p>
            </div>
          </div>
        </div>
      )}

      {permissionStatus === 'granted' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Take Photo
              </h3>
              <button
                onClick={stopCamera}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 bg-gray-900 rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            <div className="flex items-center justify-center space-x-3 mt-4">
              <button
                onClick={takePhoto}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Take Photo
              </button>
              <button
                onClick={stopCamera}
                className="px-6 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {permissionStatus === 'denied' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Camera Permission Denied
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {error}
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => setPermissionStatus(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                >
                  OK
                </button>
                <button
                  onClick={requestCameraPermission}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 