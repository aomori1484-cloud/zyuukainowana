import { useCallback, useRef } from 'react';

interface ImageUploaderProps {
  onImageUpload: (dataUrl: string) => void;
  multiple?: boolean;
  label?: string;
}

function ImageUploader({ onImageUpload, multiple = false, label = '写真を選択' }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            onImageUpload(ev.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });

      // Reset inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    },
    [onImageUpload]
  );

  return (
    <div className="flex flex-col items-center gap-3">
      {/* カメラ撮影用input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        id="camera-capture"
      />
      {/* ファイル選択用input（captureなし） */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />

      <div className="flex gap-3 flex-wrap justify-center">
        <label
          htmlFor="camera-capture"
          className="btn-primary cursor-pointer flex items-center gap-2"
        >
          <span>📷</span>
          <span>カメラで撮影</span>
        </label>
        <label
          htmlFor="file-upload"
          className="btn-secondary cursor-pointer flex items-center gap-2"
        >
          <span>📁</span>
          <span>{label}</span>
        </label>
      </div>
      <p className="text-xs text-gray-400">
        カメラ撮影またはファイルから選択できます
      </p>
    </div>
  );
}

export default ImageUploader;
