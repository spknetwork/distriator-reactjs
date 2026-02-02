import { useRef, useState } from "react";
import { Camera, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const PickerType = {
  GALLERY: "gallery",
  CAMERA: "camera",
} as const;

export type PickerType = typeof PickerType[keyof typeof PickerType];


export const CameraFacing = {
  FRONT: "front",
  REAR: "rear",
} as const;

export type CameraFacing = typeof CameraFacing[keyof typeof CameraFacing];


interface ImagePickerProps {
  onPick: (file: File | null, bytes: Uint8Array | null) => void;
  type?: PickerType;
  cameraFacing?: CameraFacing;
  imageQuality?: number;
  maxHeight?: number;
  maxWidth?: number;
  disabled?: boolean;
}

export function ImagePicker({
  onPick,
  type = PickerType.GALLERY,
  cameraFacing = CameraFacing.FRONT,
  imageQuality = 0.6,
  maxHeight = 600,
  maxWidth = 600,
  disabled = false
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      onPick(null, null);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file");
      onPick(null, null);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Image size should be less than 10MB");
      onPick(null, null);
      return;
    }

    setIsProcessing(true);

    try {
      // Resize image if needed
      const resizedFile = await resizeImage(file, maxWidth, maxHeight, imageQuality);
      
      // Convert to Uint8Array
      const arrayBuffer = await resizedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      onPick(resizedFile, uint8Array);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Error processing image");
      onPick(null, null);
    } finally {
      setIsProcessing(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    if (disabled || isProcessing) return;
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        capture={type === PickerType.CAMERA ? (cameraFacing === CameraFacing.FRONT ? "user" : "environment") : undefined}
      />
      
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
        ) : type === PickerType.CAMERA ? (
          <Camera className="w-4 h-4" />
        ) : (
          <ImageIcon className="w-4 h-4" />
        )}
        {isProcessing ? "Processing..." : "Upload"}
      </button>
    </>
  );
}

// Helper function to resize image
function resizeImage(
  file: File, 
  maxWidth: number, 
  maxHeight: number, 
  quality: number
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          } else {
            resolve(file); // Fallback to original file
          }
        },
        file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}