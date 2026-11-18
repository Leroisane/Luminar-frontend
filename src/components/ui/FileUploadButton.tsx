import { useRef, useState } from "react";

interface FileUploadButtonProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  label?: string;
  progress?: number; // 0-100, tampil ketika > 0
  isUploading?: boolean;
  className?: string;
}

export default function FileUploadButton({
  onFileSelected,
  accept = ".pdf",
  label = "Upload File",
  progress,
  isUploading = false,
  className = "",
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelected(file);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-gray-400 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        {fileName ?? label}
      </button>
      {isUploading && progress !== undefined && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
