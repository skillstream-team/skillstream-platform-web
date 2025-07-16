import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Image,
  Video,
  FileText,
  Archive
} from 'lucide-react';
import { apiService } from '../../services/api';
import { FileUpload as FileUploadType } from '../../types';

interface FileUploadProps {
  onUploadComplete: (files: FileUploadType[]) => void;
  onUploadError: (error: string) => void;
  multiple?: boolean;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  courseId?: string;
  lessonId?: string;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  uploadedFile?: FileUploadType;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  multiple = true,
  acceptedTypes = ['image/*', 'video/*', 'application/pdf', 'text/*', 'application/zip'],
  maxSize = 50, // 50MB default
  courseId,
  lessonId
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return <Image className="h-6 w-6 text-blue-500" />;
    if (type.startsWith('video/')) return <Video className="h-6 w-6 text-purple-500" />;
    if (type === 'application/pdf') return <FileText className="h-6 w-6 text-red-500" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-6 w-6 text-orange-500" />;
    return <File className="h-6 w-6 text-gray-500" />;
  };

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
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `File type ${file.type} is not supported`;
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<FileUploadType> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'course-material');
    if (courseId) formData.append('courseId', courseId);
    if (lessonId) formData.append('lessonId', lessonId);

    const response = await apiService.uploadFile(file, 'shared', {});
    return response;
  };

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate files
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      onUploadError(errors.join('\n'));
    }

    if (validFiles.length === 0) return;

    // Add files to upload queue
    const newUploads: UploadProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Upload files
    const uploadPromises = validFiles.map(async (file, index) => {
      const uploadIndex = uploads.length + index;
      let progressInterval: NodeJS.Timeout | undefined;
      
      try {
        // Simulate progress (in real implementation, you'd use XMLHttpRequest or fetch with progress)
        progressInterval = setInterval(() => {
          setUploads(prev => prev.map((upload, i) => 
            i === uploadIndex && upload.status === 'uploading'
              ? { ...upload, progress: Math.min(upload.progress + 10, 90) }
              : upload
          ));
        }, 200);

        const uploadedFile = await uploadFile(file);
        
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        
        setUploads(prev => prev.map((upload, i) => 
          i === uploadIndex
            ? { ...upload, progress: 100, status: 'completed', uploadedFile }
            : upload
        ));

        return uploadedFile;
      } catch (error) {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        
        setUploads(prev => prev.map((upload, i) => 
          i === uploadIndex
            ? { ...upload, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : upload
        ));

        throw error;
      }
    });

    try {
      const uploadedFiles = await Promise.all(uploadPromises);
      onUploadComplete(uploadedFiles);
    } catch (error) {
      console.error('Upload error:', error);
    }
  }, [uploads.length, courseId, lessonId, maxSize, acceptedTypes, onUploadComplete, onUploadError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeUpload = (index: number) => {
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  const retryUpload = async (index: number) => {
    const upload = uploads[index];
    if (!upload) return;

    setUploads(prev => prev.map((u, i) => 
      i === index ? { ...u, status: 'uploading', progress: 0, error: undefined } : u
    ));

    try {
      const uploadedFile = await uploadFile(upload.file);
      setUploads(prev => prev.map((u, i) => 
        i === index ? { ...u, progress: 100, status: 'completed', uploadedFile } : u
      ));
      onUploadComplete([uploadedFile]);
    } catch (error) {
      setUploads(prev => prev.map((u, i) => 
        i === index ? { ...u, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' } : u
      ));
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Upload Files
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Drag and drop files here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            browse
          </button>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Maximum file size: {maxSize}MB • Supported formats: Images, Videos, PDFs, Documents, Archives
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Upload Progress</h4>
          {uploads.map((upload, index) => (
            <div
              key={`${upload.file.name}-${index}`}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getFileIcon(upload.file)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {upload.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(upload.file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {upload.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {upload.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <button
                    onClick={() => removeUpload(index)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {upload.status === 'uploading' && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${upload.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {upload.progress}% uploaded
                  </p>
                </div>
              )}

              {upload.status === 'error' && (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {upload.error}
                  </p>
                  <button
                    onClick={() => retryUpload(index)}
                    className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Retry upload
                  </button>
                </div>
              )}

              {upload.status === 'completed' && upload.uploadedFile && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Upload completed successfully
                  </p>
                  <a
                    href={upload.uploadedFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 