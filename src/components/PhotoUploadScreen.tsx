/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiService } from "../services/api";
import { BusinessReviewService } from "../services/business-review-service";
import { Button, Card } from "@radix-ui/themes";
import { useAuthData } from "../utils/auth-utils";
import { toast } from "sonner";
import { isMobilePlatform } from "../utils/platform-detection";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const bstr = atob(arr[1] ?? "");
  const n = bstr.length;
  const u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
  return new File([u8arr], filename, { type: mime });
}

export function PhotoUploadScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const business = location.state?.business || null;
  const claimData = location.state?.claimData || null;

  const [photos, setPhotos] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const allowGallery =
    ["hotel", "restaurant"].includes(
      business?.profile.businessType?.toLowerCase() || ""
    );

  const isNative = isMobilePlatform();
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  const resizeImageFile = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const maxSize = 800;
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(img.src);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: blob.type }));
          } else {
            reject(new Error("Failed to resize image"));
          }
        }, "image/jpeg", 0.8);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error("Failed to load image"));
      };
    });
  };

  const addPhotoFiles = async (files: File[]) => {
    if (files.length === 0) return;
    try {
      const resized = await Promise.all(files.map(resizeImageFile));
      setPhotos((prev) => [...prev, ...resized].slice(0, 10));
    } catch (err) {
      console.error("Error processing images:", err);
      toast.error("Failed to process some images. Please try again.");
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList?.length) return;
    const files = Array.from(fileList);
    await addPhotoFiles(files);
    event.target.value = "";
  };

  const getCameraHelpText = (): string => {
    if (isIOS) {
      return "iOS: Settings > Safari > Camera > Allow. If using the app, go to iOS Settings > [App Name] > Camera.";
    }
    if (isAndroid) {
      return "Android: Settings > Apps > [App Name] > Permissions > Enable Camera.";
    }
    return "Desktop: Check browser site settings (lock icon in address bar) and allow Camera.";
  };

  const openCameraOrPicker = async () => {
    if (photos.length >= 10) {
      toast.error("You can only add up to 10 photos.");
      return;
    }

    if (isNative) {
      try {
        setCameraError(null);
        const source = allowGallery
          ? CameraSource.Prompt
          : CameraSource.Camera;
        const result = await Camera.getPhoto({
          quality: 80,
          resultType: CameraResultType.DataUrl,
          source,
          promptLabelHeader: "Photo",
          promptLabelPhoto: "Choose from Gallery",
          promptLabelPicture: "Take Photo",
        });
        if (result.dataUrl) {
          const file = dataURLtoFile(
            result.dataUrl,
            `photo-${Date.now()}.${result.format ?? "jpeg"}`
          );
          await addPhotoFiles([file]);
        }
      } catch (err: any) {
        if (err?.message !== "User cancelled photos app") {
          console.error("Camera error:", err);
          toast.error("Could not open camera or gallery. Please check permissions.");
          setCameraError(`${err?.message ?? "Camera error"} ${getCameraHelpText()}`);
        }
      }
      return;
    }

    const allowed = await checkCameraPermission();
    if (!allowed) return;
    fileInputRef.current?.click();
  };

  const checkCameraPermission = async (): Promise<boolean> => {
    try {
      if (navigator.permissions && (navigator.permissions as any).query) {
        const result = await (navigator.permissions as any).query({ name: "camera" });
        if (result.state === "denied") {
          const message = "Camera permission denied. Update settings to allow camera.";
          toast.error(message);
          setCameraError(`${message} ${getCameraHelpText()}`);
          return false;
        }
      }
      return true;
    } catch {
      // Safari may not support Permissions API → just allow attempt
      return true;
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBack = () => navigate(-1);

  const handleNext = async () => {
    if (photos.length < 2 || photos.length > 10) {
      toast.error("Please select between 2 and 10 photos.");
      return;
    }

    if (!token) {
      alert("Authentication token not found. Please log in again.");
      return;
    }
    setIsUploading(true);

    try {
      const uploadedUrls = await Promise.all(
        photos.map(async (photo) => {
          return ApiService.uploadImage(photo.name, photo, token);
        })
      );

      // Fetch custom review questions for this business (if any)
      let customReviewFields: import("../types/business").ReviewField[] | undefined = undefined;
      try {
        if (business?.id) {
          const meta = await BusinessReviewService.getCustomBusinessReviewMeta(business.id as string);
          if (meta.valid && Array.isArray(meta.fields) && meta.fields.length > 0) {
            customReviewFields = meta.fields;
          }
        }
      } catch {
        // Ignore errors here; proceed without questions
      }

      navigate("/review", {
        state: { photos: uploadedUrls, business, claimData, customReviewFields },
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-background/80">
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-full hover:bg-muted"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Upload Photos</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 space-y-8">
        {/* Business Info */}
        {business && (
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center space-x-4">
              <img
                src={business.profile.displayImage}
                alt={business.profile.displayName}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary shadow-md"
              />
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {business.profile.displayName}
                </h3>
                <p className="text-muted-foreground capitalize">
                  {business.profile.businessType}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Upload Area */}
        <Card>
          <div className="p-8 text-center bg-background/50 border-2 border-dashed border-border rounded-lg">
            <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Share Your Experience
            </h2>
            <p className="text-muted-foreground mb-6">
              Upload between 2 and 10 photos to continue.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              id="photo-upload"
              capture={allowGallery ? undefined : "environment" }
              onChange={handleFileChange}
            />
            <Button
              onClick={openCameraOrPicker}
              className="cursor-pointer bg-success text-primary-foreground px-4 py-2 rounded-lg shadow-md hover:bg-success/90 transition-colors"
            >
              {allowGallery ? "Choose Photos" : "Open Camera"}
            </Button>
          </div>
        </Card>

        {/* Camera Error */}
        {cameraError && (
          <div className="p-4 rounded-xl bg-red-100 text-red-800 text-sm dark:bg-red-900/40 dark:text-red-300">
            {cameraError}
          </div>
        )}

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={photos.length < 2 || photos.length > 10 || isUploading}
          className="btn btn-outline btn-success py-3 text-lg rounded-lg shadow-glow transform hover:scale-105 transition-transform duration-300 shadow-lg flex items-center justify-center mx-auto"
        >
          {isUploading ? "Uploading..." : "Continue to Review"}
        </button>

        {/* Preview */}
        {photos.length > 0 && (
          <Card>
            <div className="p-6 bg-background/50 border border-border/50 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">
                Selected Photos ({photos.length})
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Photo ${index + 1}`}
                      className="w-full md:h-40 sm:h-72 object-cover rounded-lg shadow-md transition-transform group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      title="Remove photo"
                      aria-label="Remove photo"
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-lg transform transition-transform hover:scale-110 opacity-0 group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
