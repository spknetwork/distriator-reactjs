import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, Camera, AlertCircle, RefreshCw, ChevronDown, Upload } from "lucide-react";
import { toast } from "sonner";
import { CartService } from "../services/cart-service";
import { useAuthData } from "../utils/auth-utils";
import { useBusinesses } from "../hooks/useBusinesses";
import { ProductCategory } from "../types/product";

type PermissionState = "checking" | "prompt" | "granted" | "denied" | "error";

interface CameraDevice {
  id: string;
  label: string;
}

export function ScanQrView() {
  const navigate = useNavigate();
  const { token } = useAuthData();
  const { businesses } = useBusinesses();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>("checking");
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [showCameraSelector, setShowCameraSelector] = useState(false);
  const [isLoadingCameras, setIsLoadingCameras] = useState(false);
  const [isScanningImage, setIsScanningImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isScannedRef = useRef(false);
  const hasStartedRef = useRef(false);

  // Load available cameras
  const loadCameras = async () => {
    try {
      setIsLoadingCameras(true);
      setError(null);
      
      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length > 0) {
        const cameraList: CameraDevice[] = devices.map((device: any) => {
          // Handle both MediaDeviceInfo objects and simple objects
          const id = device.id || device.deviceId || device;
          const label = device.label || `Camera ${id.substring(0, 8)}`;
          return { id, label };
        });
        
        setCameras(cameraList);
        
        // Prefer back camera (environment), fallback to first available
        const backCamera = cameraList.find(cam => 
          cam.label.toLowerCase().includes("back") || 
          cam.label.toLowerCase().includes("rear") ||
          cam.label.toLowerCase().includes("environment")
        );
        
        if (backCamera) {
          setSelectedCameraId(backCamera.id);
        } else if (cameraList.length > 0) {
          setSelectedCameraId(cameraList[0].id);
        }
        
        setPermissionState("granted");
      } else {
        setError("No cameras found on this device.");
        setPermissionState("error");
      }
    } catch (err: any) {
      console.error("Error loading cameras:", err);
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionState("denied");
        setError("Camera permission denied. Please enable camera access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
        setPermissionState("error");
      } else {
        setPermissionState("prompt");
        setShowPermissionPrompt(true);
      }
    } finally {
      setIsLoadingCameras(false);
    }
  };

  // Check camera permissions and load cameras
  useEffect(() => {
    loadCameras();
  }, []);

  const requestCameraPermission = async () => {
    setShowPermissionPrompt(false);
    await loadCameras();
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanner = async (cameraId: string) => {
    try {
      // Stop existing scanner if any
      await stopScanner();
      
      setIsScanning(true);
      setError(null);
      isScannedRef.current = false;

      scannerRef.current = new Html5Qrcode("qr-reader", {
        verbose: false,
      });

      await scannerRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          if (isScannedRef.current) {
            return;
          }
          isScannedRef.current = true;
          console.log("QR Code scanned:", decodedText);
          await stopScanner();
          await handleQrScanned(decodedText);
        },
        (errorMessage) => {
          // Ignore scanning errors, they're normal during scanning
          console.log("QR scan error:", errorMessage);
        }
      );
    } catch (err: any) {
      console.error("Failed to start scanner:", err);
      setError(err.message || "Failed to start camera. Please try selecting a different camera.");
      setIsScanning(false);
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setPermissionState("denied");
      }
    }
  };

  // Start scanner when camera is initially selected (first load)
  useEffect(() => {
    if (permissionState === "granted" && selectedCameraId && !scannerRef.current && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startScanner(selectedCameraId);
    }

    return () => {
      stopScanner();
    };
  }, [permissionState, selectedCameraId]);

  const handleCameraChange = async (cameraId: string) => {
    setShowCameraSelector(false);
    await startScanner(cameraId);
    setSelectedCameraId(cameraId);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select a valid image file");
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Image size should be less than 10MB");
      return;
    }

    setShowCameraSelector(false);
    setIsScanningImage(true);
    setError(null);

    try {
      // Use Html5Qrcode to scan the image file
      const html5QrCode = new Html5Qrcode("qr-reader");
      
      const decodedText = await html5QrCode.scanFile(file, true);
      
      if (decodedText) {
        await handleQrScanned(decodedText);
      } else {
        toast.error("No QR code found in the image");
        setIsScanningImage(false);
      }
    } catch (err: any) {
      console.error("Error scanning image:", err);
      
      if (err.name === "NotFoundException") {
        toast.error("No QR code found in the image. Please try another image.");
      } else {
        toast.error("Failed to scan QR code from image. Please try again.");
      }
      setIsScanningImage(false);
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleQrScanned = async (qrData: string) => {
    if (!qrData.startsWith("pos-")) {
      toast.error("Invalid QR code format");
      isScannedRef.current = false;
      return;
    }

    const cartId = qrData.replace("pos-", "");

    try {
      const cartResponse = await CartService.getCartById(token, cartId);

      if (cartResponse.valid && cartResponse.data) {
        const cart = cartResponse.data;

        // Check cart status before proceeding
        if (cart.status === 'completed') {
          toast.error("This QR code has already been used for payment");
          isScannedRef.current = false;
          return;
        }

        if (cart.status === 'abandoned') {
          toast.error("This QR code has expired");
          isScannedRef.current = false;
          return;
        }

        // Find business details using hiveUserName from cart
        const business = businesses.find(b => b.distriator.owner === cart.businessHiveUserName);

        // Navigate to shopping cart with the scanned cart data
        navigate("/pos/cart", {
          state: {
            cart: cart.items.reduce((acc, item) => {
              acc[item.productId] = item.productQty;
              return acc;
            }, {} as Record<string, number>),
            products: cart.items.map((item) => {
              // Determine category type and customCategory from productCategory string
              // The productCategory might be a custom string like "Beverages (Non-Alcoholic)" 
              // or an enum value like "Beverage", "food", etc.
              const productCategoryStr = item.productCategory || "other";
              const categoryTypeLower = productCategoryStr.toLowerCase().trim();
              
              // Check if it matches any ProductCategory enum values (case-insensitive)
              const categoryValues = Object.values(ProductCategory);
              const matchedCategory = categoryValues.find(
                cat => cat.toLowerCase() === categoryTypeLower
              );
              
              // If it matches an enum value exactly, use that enum as type
              // Otherwise, use "other" as type and set the original string as customCategory
              const categoryType = matchedCategory || ProductCategory.other;
              const customCategory = matchedCategory ? undefined : (productCategoryStr !== "other" ? productCategoryStr : undefined);
              
              return {
                id: item.productId,
                name: item.productName,
                imageUrl: item.productImageUrl,
                price: item.totalPerProduct / item.productQty,
                currency: "HBD",
                brand: item.productBrand || "",
                quantityType: { 
                  type: item.productQtyType || "Each",
                  customUnit: item.productQtyType && !["kg", "L", "mL", "gram", "Each", "piece", "item", "unit", "other"].includes(item.productQtyType) 
                    ? item.productQtyType 
                    : undefined
                },
                category: { 
                  type: categoryType,
                  customCategory: customCategory
                },
                subCategory: item.productSubCategory || "",
                businessId: [cart.businessId],
              };
            }),
            businessId: cart.businessId,
            businessName: business?.profile.displayName || cart.businessHiveUserName,
            businessImage: business?.profile.displayImage,
            isPointOfSale: false, // Scanned carts are for customer payment, not business generation
            scannedCartId: cartId,
            scannedCartData: cart,
          },
        });

        toast.success("Cart loaded successfully!");
      } else {
        toast.error(cartResponse.error || "Failed to load cart data");
        isScannedRef.current = false;
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      toast.error("Failed to load cart data");
      isScannedRef.current = false;
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Scan QR Code</h1>
        </div>
      </div>

      {/* Permission Prompt */}
      {showPermissionPrompt && permissionState === "prompt" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 shadow-2xl max-w-md mx-4 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Camera Access Required
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              To scan QR codes, we need access to your camera. Please allow camera access to continue.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowPermissionPrompt(false);
                  navigate(-1);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={requestCameraPermission}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Allow Camera Access
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      {/* Camera Selector */}
      {showCameraSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 shadow-2xl max-w-md mx-4 w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Camera or Upload Image</h2>
            <div className="space-y-2">
              {/* Upload from Gallery Option */}
              <button
                onClick={handleUploadClick}
                className="w-full text-left px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Upload className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">Upload from Gallery</span>
                </div>
              </button>

              {/* Camera Options */}
              {cameras.length > 0 && cameras.map((camera) => (
                <button
                  key={camera.id}
                  onClick={() => handleCameraChange(camera.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedCameraId === camera.id
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Camera className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">{camera.label}</span>
                    </div>
                    {selectedCameraId === camera.id && (
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCameraSelector(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Scanner */}
      <div className="p-4 pb-24">
        <div className="max-w-md mx-auto">
          {isLoadingCameras ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-muted-foreground">
                  Loading cameras...
                </span>
              </div>
            </div>
          ) : permissionState === "denied" || (error && permissionState === "error") ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Camera Permission Denied
              </h3>
              <p className="text-destructive mb-4">{error || "Camera access is required to scan QR codes."}</p>
              <div className="space-y-2 text-sm text-muted-foreground mb-6">
                <p>To enable camera access:</p>
                <ul className="list-disc list-inside text-left max-w-xs mx-auto space-y-1">
                  <li>Click the camera icon in your browser's address bar</li>
                  <li>Or go to your browser settings</li>
                  <li>Allow camera access for this site</li>
                </ul>
                <p className="mt-4 font-medium text-foreground">Or upload a QR code image instead:</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={handleUploadClick}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload QR Image</span>
                </button>
                <button
                  onClick={() => {
                    setPermissionState("checking");
                    setError(null);
                    loadCameras();
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : permissionState === "granted" ? (
            <>
              {/* Camera Selector Button */}
              <div className="mb-4">
                <button
                  onClick={() => setShowCameraSelector(true)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Camera className="w-5 h-5 text-muted-foreground" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">Scan Method</p>
                      <p className="text-xs text-muted-foreground">
                        {cameras.find(c => c.id === selectedCameraId)?.label || "Camera or Upload"}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="text-center mb-4">
                <p className="text-muted-foreground text-sm">
                  Position the QR code within the frame to scan
                </p>
              </div>

              <div className="relative">
                <div
                  id="qr-reader"
                  className="w-full aspect-square bg-muted rounded-lg overflow-hidden border-2 border-border"
                />

                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                    <div className="bg-white/90 rounded-lg px-4 py-2 flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-900 font-medium">
                        Starting camera...
                      </span>
                    </div>
                  </div>
                )}

                {error && !isScanning && !isScanningImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                    <div className="bg-white/90 rounded-lg px-4 py-2 text-center">
                      <p className="text-sm text-destructive mb-2">{error}</p>
                      <button
                        onClick={() => selectedCameraId && startScanner(selectedCameraId)}
                        className="text-xs text-primary hover:underline"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}

                {isScanningImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                    <div className="bg-white/90 rounded-lg px-4 py-2 flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-900 font-medium">
                        Scanning image...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              {!isScanning && !isScanningImage && (
                <button
                  onClick={() => selectedCameraId && startScanner(selectedCameraId)}
                  className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Start Scanning</span>
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}