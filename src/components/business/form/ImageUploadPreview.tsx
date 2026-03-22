import { useState, useEffect } from "react";
import { Camera, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { ApiService } from "../../../services/api";
import { useAuthData } from '../../../utils/auth-utils';

interface ImageUploadPreviewProps {
  title: string;
  isSingle?: boolean;
  images: string[];
  onChanged: (images: string[]) => void;
  googleImages?: string[];
}

interface ImageUploadModel {
  id: number;
  uploadingImage: boolean;
  imageLink?: string;
}

export function ImageUploadPreview({
  title,
  isSingle = false,
  images,
  onChanged,
  googleImages,
}: ImageUploadPreviewProps) {
  const [imageModels, setImageModels] = useState<ImageUploadModel[]>([]);
  const [imageUploadId, setImageUploadId] = useState(0);
  const { token } = useAuthData();

  // 🔹 Reusable image resize logic (copied from UploadSelfie)
  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        const { width, height } = img;
        let newWidth, newHeight;

        if (width > height) {
          newWidth = Math.min(width, 800);
          newHeight = (height * newWidth) / width;
        } else {
          newHeight = Math.min(height, 800);
          newWidth = (width * newHeight) / height;
        }

        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);
        URL.revokeObjectURL(objectUrl);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error("Image resize failed"));
            }
          },
          file.type,
          0.8
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load image for resizing"));
      };

      img.src = objectUrl;
    });
  };

  // Sync with props
  useEffect(() => {
    const models = images.map((image, index) => ({
      id: index,
      uploadingImage: false,
      imageLink: image,
    }));
    setImageModels(models);
    setImageUploadId(images.length);
  }, [images]);

  // Handle google images
  useState(() => {
    const models = images.map((image, index) => ({
      id: index,
      uploadingImage: false,
      imageLink: image,
    }));
    setImageModels(models);
    setImageUploadId(images.length);

    // Upload Google images if provided
    if (googleImages && googleImages.length > 0) {
      uploadGoogleImages(googleImages);
    }
  });

  const uploadGoogleImages = async (googleImageUrls: string[]) => {
    for (const imageUrl of googleImageUrls) {
      await uploadPlacesImage(imageUrl);
    }
  };

  const uploadPlacesImage = async (imageUrl: string) => {
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    const id = imageUploadId;
    setImageUploadId((prev) => prev + 1);

    try {
      if (isSingle) setImageModels([]);

      setImageModels((prev) => [...prev, { id, uploadingImage: true }]);

      const response = await fetch(`${import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com'}/places/photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify({ photoUri: imageUrl }),
      });

      if (response.ok) {
        const result = await response.json();
        const uploadedUrl = result.url;

        setImageModels(prev =>
          prev.map(model =>
            model.id === id
              ? { ...model, uploadingImage: false, imageLink: uploadedUrl }
              : model
          )
        );

        const newImages = isSingle ? [uploadedUrl] : [...images, uploadedUrl];
        onChanged(newImages);
      } else {
        throw new Error("Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading places image:", error);
      setImageModels((prev) => prev.filter((model) => model.id !== id));
      toast.error("Failed to upload image");
    }
  };

  const pickImageAndUpload = async (useCamera: boolean) => {
    if (!isSingle && imageModels.length >= 5) {
      toast.error("Cannot attach more than 5 images");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = !isSingle && !useCamera;
    if (useCamera) input.capture = "environment";

    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);

      if (!isSingle) {
        const limit = 5 - imageModels.length;
        if (files.length > limit) {
          toast.error("Cannot attach more than 5 images");
          files.splice(limit);
        }
      }

      for (const file of files) {
        await uploadFile(file);
      }
    };

    input.click();
  };

  const uploadFile = async (file: File) => {
    if (!token) {
      toast.error("Authentication required");
      return;
    }

    const id = imageUploadId;
    setImageUploadId((prev) => prev + 1);

    try {
      if (isSingle) setImageModels([]);

      setImageModels((prev) => [...prev, { id, uploadingImage: true }]);

      // 🔹 Compress before upload
      const resizedFile = await resizeImage(file);

      const uploadedUrl = await ApiService.uploadImage(
        resizedFile.name,
        resizedFile,
        token
      );
      const fullUrl = `${uploadedUrl}`;

      setImageModels(prev =>
        prev.map(model =>
          model.id === id
            ? { ...model, uploadingImage: false, imageLink: fullUrl }
            : model
        )
      );

      const newImages = isSingle ? [fullUrl] : [...images, fullUrl];
      onChanged(newImages);
    } catch (error) {
      console.error("Error uploading file:", error);
      setImageModels((prev) => prev.filter((model) => model.id !== id));
      toast.error("Failed to upload image");
    }
  };

  const removeImage = (index: number) => {
    const imageToRemove = imageModels[index];
    if (imageToRemove.imageLink) {
      const newImages = images.filter((img) => img !== imageToRemove.imageLink);
      onChanged(newImages);
    }
    setImageModels((prev) => prev.filter((_, i) => i !== index));
  };

  // ⬇️ (UI remains the same, only uploadFile changed)
  if (isSingle) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          {title}
        </label>
        <div
          onClick={() => {
            if (imageModels.length === 0 || imageModels[0]?.imageLink) {
              pickImageAndUpload(false);
            }
          }}
          className="w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors flex items-center justify-center bg-card"
        >
          {imageModels[0]?.uploadingImage ? (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : imageModels[0]?.imageLink ? (
            <img
              src={imageModels[0].imageLink}
              alt="Display"
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <div className="text-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Click to upload image</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {title}
      </label>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {imageModels.map((model, index) => (
          <div key={model.id} className="relative flex-shrink-0">
            <div className="w-16 h-16 bg-card border border-border rounded-lg overflow-hidden">
              {model.uploadingImage ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : model.imageLink ? (
                <img
                  src={model.imageLink}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            {model.imageLink && (
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {imageModels.length < 5 && (
          <>
            <button
              onClick={() => pickImageAndUpload(false)}
              className="w-16 h-16 bg-card border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors"
            >
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </button>
            <button
              onClick={() => pickImageAndUpload(true)}
              className="w-16 h-16 bg-card border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors"
            >
              <Camera className="w-6 h-6 text-muted-foreground" />
            </button>
          </>
        )}
      </div>
      {imageModels.length >= 5 && (
        <p className="text-xs text-muted-foreground">Maximum 5 images allowed</p>
      )}
    </div>
  );
}
