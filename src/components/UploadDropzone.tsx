"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  X,
  FileImage,
  FileVideo,
  FileAudio,
  AlertCircle,
  Loader2,
  Music,
} from "lucide-react";

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  isUploading: boolean;
  error: string | null;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "audio/flac",
  "audio/aac",
  "audio/m4a",
  "audio/webm",
  "audio/mp4",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadDropzone({
  onFileSelected,
  isUploading,
  error,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (
      !ACCEPTED_TYPES.includes(file.type) &&
      !file.name.match(/\.(jpg|jpeg|png|webp|mp4|mov|webm|mp3|wav|ogg|flac|aac|m4a)$/i)
    ) {
      return "This file type isn't supported. Please upload images (JPG, PNG, WEBP), videos (MP4, MOV, WEBM), or audio (MP3, WAV, OGG, FLAC, AAC, M4A).";
    }
    if (file.type.startsWith("image/") && file.size > MAX_IMAGE_SIZE) {
      return "Image file is too large. Maximum size is 10 MB.";
    }
    if (file.type.startsWith("video/") && file.size > MAX_VIDEO_SIZE) {
      return "Video file is too large. Maximum size is 100 MB.";
    }
    if (
      (file.type.startsWith("audio/") || isAudioFile(file.name)) &&
      file.size > MAX_AUDIO_SIZE
    ) {
      return "Audio file is too large. Maximum size is 50 MB.";
    }
    return null;
  }, []);

  const isAudioFile = (filename: string): boolean => {
    return /\.(mp3|wav|ogg|flac|aac|m4a)$/i.test(filename);
  };

  const getFileType = (file: File): "image" | "video" | "audio" => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/") || isAudioFile(file.name))
      return "audio";
    return "image";
  };

  const handleFile = useCallback(
    (file: File) => {
      setLocalError(null);
      const err = validateFile(file);
      if (err) {
        setLocalError(err);
        return;
      }
      setSelectedFile(file);

      const fileType = getFileType(file);
      if (fileType === "image") {
        const url = URL.createObjectURL(file);
        setPreview(url);
      } else {
        setPreview(null);
      }
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAnalyze = () => {
    if (selectedFile) onFileSelected(selectedFile);
  };

  const displayError = error || localError;
  const fileType = selectedFile ? getFileType(selectedFile) : null;

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? "border-brand-500 bg-brand-50"
              : "border-slate-300 hover:border-brand-400 bg-slate-50 hover:bg-brand-50/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Upload file"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.mp3,.wav,.ogg,.flac,.aac,.m4a"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <Upload className="w-10 h-10 text-brand-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-700 mb-1">
            Drop an image, video, or audio file here
          </p>
          <p className="text-sm text-slate-500 mb-3">or click to browse</p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <FileImage className="w-3 h-3" />
              Images
            </span>
            <span className="flex items-center gap-1">
              <FileVideo className="w-3 h-3" />
              Videos
            </span>
            <span className="flex items-center gap-1">
              <FileAudio className="w-3 h-3" />
              Audio
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            JPG, PNG, WEBP, MP4, MOV, WEBM, MP3, WAV, OGG, FLAC, AAC, M4A
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl p-6 bg-white">
          <div className="flex items-start gap-4">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-20 h-20 rounded-lg object-cover border border-slate-200"
              />
            ) : fileType === "audio" ? (
              <div className="w-20 h-20 rounded-lg bg-green-50 flex items-center justify-center border border-green-200">
                <Music className="w-8 h-8 text-green-500" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                <FileVideo className="w-8 h-8 text-slate-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {fileType === "image" ? (
                  <FileImage className="w-4 h-4 text-brand-500" />
                ) : fileType === "video" ? (
                  <FileVideo className="w-4 h-4 text-brand-500" />
                ) : (
                  <FileAudio className="w-4 h-4 text-green-500" />
                )}
                <p className="text-sm font-medium text-slate-800 truncate">
                  {selectedFile.name}
                </p>
              </div>
              <p className="text-xs text-slate-500">
                {formatSize(selectedFile.size)} •{" "}
                {fileType === "audio"
                  ? "AUDIO"
                  : selectedFile.type.split("/")[1]?.toUpperCase()}
              </p>
            </div>
            <button
              onClick={handleRemove}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Remove file"
              disabled={isUploading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isUploading}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading…
              </>
            ) : (
              "Analyze Content"
            )}
          </button>
        </div>
      )}

      {displayError && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400 text-center">
        Your uploaded media is processed securely and is not used for model
        training without explicit permission.
      </p>
    </div>
  );
}
