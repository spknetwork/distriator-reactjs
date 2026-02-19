import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, Camera, AlertCircle, RefreshCw, ChevronDown, Upload, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { CartService } from "../services/cart-service";
import { useAuthData } from "../utils/auth-utils";
import { useBusinesses } from "../hooks/useBusinesses";
import { ProductCategory } from "../types/product";
import { useAioha } from "@aioha/react-provider";
import { KeyTypes } from "@aioha/aioha";
import type { Operation } from "@hiveio/dhive";
import { useAuthKeysStore, type AuthKeysState } from "../stores/authKeysStore.ts";
import { PlaintextKeyProvider } from '@aioha/aioha/build/providers/custom/plaintext.js';
import { useProgrammaticAuth } from "hive-authentication";

const HIVE_SIGN_OP_PREFIX = "hive://sign/op/";

/** Parsed Hive transfer op: [ "transfer", { from, to, amount, memo } ] */
type HiveTransferOp = [string, { from: string; to: string; amount: string; memo: string }];

type PermissionState = "checking" | "prompt" | "granted" | "denied" | "error";

interface CameraDevice {
  id: string;
  label: string;
}

export function ScanQrView() {
  const navigate = useNavigate();
  const { token, username, provider, hasActiveKey, privatePostingKey } = useAuthData();
  const { aioha } = useAioha();
  const { loginWithPrivateKey } = useProgrammaticAuth(aioha);
  const getKeys = useAuthKeysStore((s: AuthKeysState) => s.getKeys);
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
  const [parsedHiveOp, setParsedHiveOp] = useState<HiveTransferOp | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
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
      const isNotFound = err?.name === "NotFoundError";
      const isPermissionDenied =
        err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";

      if (isPermissionDenied) {
        setPermissionState("denied");
        setError("Camera permission denied. Please enable camera access in your browser settings.");
      } else if (isNotFound) {
        setError("No camera found. You can still scan by uploading an image below.");
        setPermissionState("error");
      } else {
        setPermissionState("prompt");
        setShowPermissionPrompt(true);
      }

      if (!isNotFound && !isPermissionDenied) {
        console.error("Error loading cameras:", err);
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
      // Use a dedicated element so we don't conflict with the camera scanner (qr-reader)
      const fileScanElementId = "qr-reader-file";
      const fileScanEl = document.getElementById(fileScanElementId);
      if (!fileScanEl) {
        toast.error("Scanner not ready. Please try again.");
        setIsScanningImage(false);
        return;
      }
      const html5QrCode = new Html5Qrcode(fileScanElementId);
      try {
        const decodedText = await html5QrCode.scanFile(file, false);
        if (decodedText) {
          await handleQrScanned(decodedText);
        } else {
          toast.error("No QR code found in the image");
        }
      } finally {
        html5QrCode.clear();
      }
    } catch (err: any) {
      console.error("Error scanning image:", err);
      
      if (err.name === "NotFoundException") {
        toast.error("No QR code found in the image. Please try another image.");
      } else {
        toast.error("Failed to scan QR code from image. Please try again.");
      }
    } finally {
      setIsScanningImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  /** Parse hive://sign/op/<base64> into a transfer op and fill `from` with current user */
  const parseHiveSignOp = (qrData: string): HiveTransferOp | null => {
    if (!qrData.startsWith(HIVE_SIGN_OP_PREFIX)) return null;
    const base64 = qrData.slice(HIVE_SIGN_OP_PREFIX.length).trim();
    try {
      const decoded = atob(base64);
      const parsed = JSON.parse(decoded) as unknown;
      if (!Array.isArray(parsed) || parsed.length < 2) return null;
      const [opName, opBody] = parsed as [string, Record<string, string>];
      if (opName !== "transfer" || !opBody || typeof opBody !== "object") return null;
      const from = username || "";
      const to = String(opBody.to ?? "").trim();
      const amount = String(opBody.amount ?? "").trim();
      const memo = String(opBody.memo ?? "").trim();
      if (!to || !amount) return null;
      return ["transfer", { from, to, amount, memo }];
    } catch {
      return null;
    }
  };

  const handleConfirmHiveTransfer = async () => {
    if (!parsedHiveOp) return;

    if (provider === "privatePostingKey" && !hasActiveKey) {
      toast.error("Active key required", {
        description: "We advise you to log in with Hive Auth to complete this payment.",
      });
      return;
    }

    setIsTransferring(true);
    try {
      if (provider === "privatePostingKey" && hasActiveKey) {
        const privateActiveKey = getKeys(username)?.privateActiveKey;
        if (privateActiveKey) {
          // await loginWithPrivateKey(username, privatePostingKey);
          const plaintextProvider = new PlaintextKeyProvider(privateActiveKey);
          aioha.registerCustomProvider(plaintextProvider);
        }
      }

      const result = await aioha.signAndBroadcastTx([parsedHiveOp as Operation], KeyTypes.Active);
      const ok = result && typeof result === "object" && result.success === true;
      if (ok) {
        toast.success("Payment sent", {
          description: `Transfer of ${parsedHiveOp[1].amount} to @${parsedHiveOp[1].to} completed.`,
        });
        setParsedHiveOp(null);
        navigate("/");
      } else {
        const errMsg = (result && typeof result === "object" && "error" in result && (result as { error: string }).error) ?? "Please try again.";
        toast.error("Transfer failed", { description: errMsg });
      }
    } catch (e) {
      toast.error("Transfer failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleQrScanned = async (qrData: string) => {
    // Hive sign/op transfer (v4v / Keychain-style QR)
    if (qrData.startsWith(HIVE_SIGN_OP_PREFIX)) {
      if (!username) {
        toast.error("Please log in first to pay with Hive");
        isScannedRef.current = false;
        return;
      }
      const op = parseHiveSignOp(qrData);
      if (!op) {
        toast.error("Invalid Hive payment QR");
        isScannedRef.current = false;
        return;
      }
      setParsedHiveOp(op);
      return;
    }

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

  // Hive transfer confirm screen (after scanning hive://sign/op/ QR)
  if (parsedHiveOp) {
    const [, op] = parsedHiveOp;
    const fromAvatar = `https://images.hive.blog/u/${op.from}/avatar`;
    const toAvatar = `https://images.hive.blog/u/${op.to}/avatar`;
    const toProfileLink = `https://hive.blog/@${op.to}`;

    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <button
            type="button"
            onClick={() => setParsedHiveOp(null)}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Confirm Payment</h1>
          <div className="w-10" />
        </div>

        <div className="p-4 max-w-md mx-auto space-y-6">
          <div className="card bg-card border border-border rounded-xl p-6 shadow-md">
            <p className="text-sm text-muted-foreground mb-3">You are paying</p>
            <div className="flex items-center gap-4 mb-6">
              <img
                src={fromAvatar}
                alt={`@${op.from}`}
                className="w-14 h-14 rounded-full object-cover border-2 border-border"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.hive.blog/u/null/avatar";
                }}
              />
              <div>
                <p className="font-semibold text-foreground">@{op.from}</p>
                <a
                  href={`https://hive.blog/@${op.from}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  Profile (Hive)
                </a>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm text-muted-foreground">Transfer to</p>
              <div className="flex items-center gap-4">
                <img
                  src={toAvatar}
                  alt={`@${op.to}`}
                  className="w-12 h-12 rounded-full object-cover border-2 border-border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.hive.blog/u/null/avatar";
                  }}
                />
                <div>
                  <a
                    href={toProfileLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-foreground hover:text-primary"
                  >
                    @{op.to}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    Avatar: <a href={toAvatar} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Proxy link</a>
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-foreground">{op.amount}</span>
              </div>
              {op.memo && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Memo</span>
                  <p className="text-foreground mt-1 break-words">{op.memo}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirmHiveTransfer}
              disabled={isTransferring}
              className="btn btn-success w-full flex items-center justify-center gap-2 py-3"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Confirm in wallet…
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirm
                </>
              )}
            </button>
            <button
              onClick={() => {
                setParsedHiveOp(null);
                isScannedRef.current = false;
              }}
              disabled={isTransferring}
              className="btn btn-outline w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Always present for image upload scan (used when camera is unavailable or from gallery) */}
      <div id="qr-reader-file" className="absolute w-px h-px overflow-hidden -left-[10000px]" aria-hidden />

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