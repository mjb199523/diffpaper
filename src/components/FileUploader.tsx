import React, { useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { formatFileSize } from '../utils/formatFileSize';

interface FileUploaderProps {
  label: string;
  description: string;
  file: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  error?: string | null;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  description,
  file,
  onFileSelect,
  onClear,
  error,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex-1 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-slate-900 text-base">{label}</h3>
          {file && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Ready
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-4">{description}</p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleChange}
          className="hidden"
          disabled={disabled}
        />

        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors flex flex-col items-center justify-center cursor-pointer ${
              error
                ? 'border-red-300 bg-red-50/30'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
            }`}
            onClick={handleBrowseClick}
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-slate-800">
              Drag and drop your file here
            </p>
            <p className="text-xs text-slate-500 mt-1 mb-3">or click to browse</p>
            <span className="inline-block text-[11px] text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded">
              Accepted: PDF, DOCX, TXT (up to 25 MB)
            </span>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/80">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatFileSize(file.size)} • {file.name.split('.').pop()?.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  disabled={disabled}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors text-xs flex items-center gap-1 border border-transparent hover:border-slate-200"
                  title="Replace file"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Replace</span>
                </button>
                <button
                  type="button"
                  onClick={onClear}
                  disabled={disabled}
                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors text-xs"
                  title="Remove file"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
