import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, Camera, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImagePickerProps {
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  onClear: () => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export const ImagePicker = ({ onImageSelect, selectedImage, onClear, disabled }: ImagePickerProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a JPG, PNG, or WEBP image';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 8MB';
    }
    return null;
  };

  const handleFile = (file: File) => {
    setError(null);
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    onImageSelect(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClear = () => {
    onClear();
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  if (selectedImage && previewUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden bg-card border border-border shadow-medium">
        <img 
          src={previewUrl} 
          alt="Selected flower" 
          className="w-full h-auto max-h-96 object-contain"
        />
        <Button
          onClick={handleClear}
          disabled={disabled}
          variant="destructive"
          size="icon"
          className="absolute top-3 right-3 rounded-full shadow-lg"
        >
          <X className="w-4 h-4" />
        </Button>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <p className="text-white text-sm font-medium">{selectedImage.name}</p>
          <p className="text-white/80 text-xs">
            {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-all duration-300",
          "bg-gradient-subtle p-8 text-center cursor-pointer",
          isDragging && !disabled && "border-primary bg-primary/5 scale-[1.02]",
          !isDragging && "border-border hover:border-primary/50 hover:bg-muted/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            <ImageIcon className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <p className="text-base font-semibold text-foreground">
              Drop your flower image here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Upload className="w-3 h-3" />
            <span>JPG, PNG, WEBP • Max 8MB</span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium">OR</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Button
        onClick={() => cameraInputRef.current?.click()}
        disabled={disabled}
        variant="outline"
        className="w-full"
      >
        <Camera className="w-4 h-4 mr-2" />
        Use Camera
      </Button>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        disabled={disabled}
        className="hidden"
      />

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          {error}
        </div>
      )}
    </div>
  );
};
