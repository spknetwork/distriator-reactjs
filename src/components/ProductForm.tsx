import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Upload } from "lucide-react";
import { toast } from "sonner";
import { ImagePicker, PickerType } from "./ImagePicker";
import { ApiService } from "../services/api";
import type {
  ProductModel,
  Currency,
  QuantityUnit,
  ProductCategory,
} from "../types/product";
import { ProductService } from "../services/product-service";
import { useAuthData } from '../utils/auth-utils';
import { useBusinesses } from '../hooks/useBusinesses';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessId: string;
  product?: ProductModel | null;
  isEdit?: boolean;
}

export function ProductForm({
  isOpen,
  onClose,
  onSuccess,
  businessId,
  product,
  isEdit = false,
}: ProductFormProps) {
  const [formData, setFormData] = useState<{
    name: string;
    imageUrl: string[]; // Changed to array
    description: string;
    price: string;
    quantityType: QuantityUnit | "";
    customUnit: string;
    currency: Currency;
    category: ProductCategory | "";
    customCategory: string;
    selectedCategory: string;
    selectedSubcategory: string;
    brand: string;
    stockQuantity: string;
  }>({
    name: "",
    imageUrl: [],
    description: "",
    price: "",
    quantityType: "",
    customUnit: "",
    currency: "USD",
    category: "",
    customCategory: "",
    selectedCategory: "",
    selectedSubcategory: "",
    brand: "",
    stockQuantity: "",
  });

  const [showCustomUnit, setShowCustomUnit] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSubcategoryOpen, setIsSubcategoryOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isQuantityOpen, setIsQuantityOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadingImageCount, setUploadingImageCount] = useState(0);
  const [productTypes, setProductTypes] = useState<Record<string, Record<string, string[]>>>({});
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const MAX_IMAGES = 3;

  const { token } = useAuthData();
  const { businesses } = useBusinesses();

  // Get business type from businessId
  // Use business_type (new field) with fallback to businessType (legacy field) for backward compatibility
  const business = businesses.find(b => b.id === businessId);
  const businessType = business?.profile.business_type || business?.profile.businessType;

  // Fetch product types when business type is available
  useEffect(() => {
    if (!isOpen || !businessType) return;

    const abortController = new AbortController();
    setIsLoadingTypes(true);

    const fetchProductTypes = async () => {
      try {
        const response = await ProductService.getProductTypes(abortController.signal);
        if (response.isSuccess && response.data) {
          setProductTypes(response.data);
          
          // Set available categories for the business type
          if (response.data[businessType]) {
            const categories = Object.keys(response.data[businessType]);
            setAvailableCategories(categories);
          } else {
            setAvailableCategories([]);
            setAvailableSubcategories([]);
          }
        } else {
          console.error("Failed to fetch product types:", response.errorMessage);
          toast.error("Failed to load product categories");
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Error fetching product types:", error);
          toast.error("Error loading product categories");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingTypes(false);
        }
      }
    };

    fetchProductTypes();

    return () => {
      abortController.abort();
    };
  }, [isOpen, businessType]);

  // Update subcategories when category changes
  useEffect(() => {
    if (businessType && productTypes[businessType] && formData.selectedCategory) {
      const subcategories = productTypes[businessType][formData.selectedCategory] || [];
      setAvailableSubcategories(subcategories);
      
      // Reset subcategory if current one is not in the new list
      if (formData.selectedSubcategory && !subcategories.includes(formData.selectedSubcategory)) {
        setFormData(prev => ({ ...prev, selectedSubcategory: "" }));
      }
    } else {
      setAvailableSubcategories([]);
    }
  }, [formData.selectedCategory, businessType, productTypes]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setIsCategoryOpen(false);
        setIsSubcategoryOpen(false);
        setIsCurrencyOpen(false);
        setIsQuantityOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Initialize form data when editing
  useEffect(() => {
    if (isEdit && product) {
      // Try to parse category and subcategory from existing product
      // Handle both new format (Category > Subcategory) and old format (single category)
      const categoryType = product.category.type;
      let selectedCat = "";
      let selectedSubcat = "";
      
      if (categoryType.includes(" > ")) {
        const categoryParts = categoryType.split(" > ");
        selectedCat = categoryParts[0] || "";
        selectedSubcat = categoryParts[1] || "";
      } else if (categoryType && categoryType !== "other") {
        // Old format - try to match with available categories
        selectedCat = categoryType;
      }
      
      // Handle imageUrl - convert to array if it's a string or array
      let imageUrls: string[] = [];
      if (product.imageUrl) {
        if (Array.isArray(product.imageUrl)) {
          imageUrls = product.imageUrl;
        } else if (typeof product.imageUrl === 'string') {
          imageUrls = [product.imageUrl];
        }
      }
      
      setFormData({
        name: product.name,
        imageUrl: imageUrls,
        description: product.description || "",
        price: product.price.toString(),
        quantityType: product.quantityType.type,
        customUnit: product.quantityType.customUnit || "",
        currency: product.currency,
        category: product.category.type,
        customCategory: product.category.customCategory || "",
        selectedCategory: selectedCat,
        selectedSubcategory: selectedSubcat,
        brand: product.brand || "",
        stockQuantity: product.stockQuantity?.toString() || "",
      });
      setShowCustomUnit(product.quantityType.type === "other");
      setShowCustomCategory(product.category.type === "other" || !!product.category.customCategory);
    } else {
      // Reset form for add mode
      setFormData({
        name: "",
        imageUrl: [],
        description: "",
        price: "",
        quantityType: "",
        customUnit: "",
        currency: "USD",
        category: "",
        customCategory: "",
        selectedCategory: "",
        selectedSubcategory: "",
        brand: "",
        stockQuantity: "",
      });
      setShowCustomUnit(false);
      setShowCustomCategory(false);
    }
    setErrors({});
  }, [isEdit, product, isOpen]);

  const quantityUnits = [
    "kg",
    "L",
    "mL",
    "gram",
    "Each",
    "piece",
    "item",
    "unit",
    "other",
  ] as const;

  const currencies = ["USD", "HBD"] as const;


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.brand.trim()) {
      newErrors.brand = "Brand is required";
    }

    if (!formData.quantityType) {
      newErrors.quantityType = "Quantity type is required";
    }

    if (showCustomUnit && !formData.customUnit.trim()) {
      newErrors.customUnit = "Custom unit is required";
    }

    if (!formData.price.trim()) {
      newErrors.price = "Price is required";
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price < 0) {
        newErrors.price = "Enter a valid price";
      }
    }

    if (showCustomCategory) {
      if (!formData.customCategory.trim()) {
        newErrors.customCategory = "Custom category is required";
      }
    } else {
      if (!formData.selectedCategory) {
        newErrors.category = "Category is required";
      } else if (availableSubcategories.length > 0 && !formData.selectedSubcategory) {
        newErrors.category = "Subcategory is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Build request body according to API requirements
      // Ensure all string fields are safely trimmed (handle undefined/null)
      const requestBody: {
        name: string;
        imageUrl?: string[];
        description: string;
        quantityType: string;
        price: number;
        currency: string;
        businesses: string[];
        brand: string;
        stockQuantity?: number;
        category?: string;
        subCategory?: string;
      } = {
        name: (formData.name || "").trim(),
        imageUrl: Array.isArray(formData.imageUrl) && formData.imageUrl.length > 0
          ? formData.imageUrl.filter(url => url && url.trim()).map(url => url.trim())
          : undefined,
        description: (formData.description || "").trim(),
        quantityType: showCustomUnit
          ? (formData.customUnit || "").trim()
          : formData.quantityType,
        price: parseFloat(formData.price),
        currency: formData.currency,
        businesses: [businessId],
        brand: (formData.brand || "").trim(),
        stockQuantity: formData.stockQuantity
          ? parseInt(formData.stockQuantity)
          : undefined,
      };

      // Add category and subCategory as separate fields
      if (showCustomCategory) {
        // For custom category, we still need to provide category and subCategory
        // The API might not accept custom categories, but we'll try to send it
        requestBody.category = (formData.customCategory || "").trim();
        // Don't include subCategory for custom categories
      } else {
        if (formData.selectedCategory) {
          requestBody.category = formData.selectedCategory;
          
          // Only include subCategory if there are subcategories available and one is selected
          if (availableSubcategories.length > 0 && formData.selectedSubcategory) {
            requestBody.subCategory = formData.selectedSubcategory;
          }
          // If category has no subcategories or none selected, don't include subCategory field
        }
      }

      let response;
      if (isEdit && product) {
        response = await ProductService.updateProduct(
          token,
          product.id,
          requestBody
        );
      } else {
        response = await ProductService.createProduct(token, requestBody);
      }

      if (response.isSuccess) {
        toast.success(
          isEdit
            ? "Product updated successfully!"
            : "Product added successfully!"
        );
        onSuccess();
        onClose();
      } else {
        toast.error(
          `Failed to ${isEdit ? "update" : "add"} product: ${response.errorMessage
          }`
        );
      }
    } catch (error) {
      toast.error(
        `Error ${isEdit ? "updating" : "adding"} product: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleQuantityTypeChange = (value: QuantityUnit) => {
    setFormData((prev) => ({ ...prev, quantityType: value, customUnit: "" }));
    setShowCustomUnit(value === "other");
    if (errors.quantityType) {
      setErrors((prev) => ({ ...prev, quantityType: "" }));
    }
  };

  const handleCategoryChange = (category: string) => {
    setFormData((prev) => ({ 
      ...prev, 
      selectedCategory: category, 
      selectedSubcategory: "",
      category: "",
      customCategory: "" 
    }));
    setShowCustomCategory(false);
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: "" }));
    }
  };

  const handleSubcategoryChange = (subcategory: string) => {
    const fullCategory = `${formData.selectedCategory} > ${subcategory}`;
    setFormData((prev) => ({ 
      ...prev, 
      selectedSubcategory: subcategory,
      category: fullCategory as ProductCategory,
      customCategory: "" 
    }));
    setShowCustomCategory(false);
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: "" }));
    }
  };

  const handleCustomCategoryToggle = () => {
    setShowCustomCategory(!showCustomCategory);
    if (!showCustomCategory) {
      setFormData((prev) => ({ 
        ...prev, 
        selectedCategory: "",
        selectedSubcategory: "",
        category: "other" as ProductCategory
      }));
    }
  };
  const handleImageUpload = async (
    file: File | null,
    bytes: Uint8Array | null
  ) => {
    if (!file || !bytes) {
      return;
    }

    // Check image limit
    if (formData.imageUrl.length >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed per product.`);
      return;
    }

    setIsUploadingImage(true);

    try {
      const url = await ApiService.uploadImage(file.name, file, token ?? "");

      setFormData((prev) => ({
        ...prev,
        imageUrl: [...prev.imageUrl, url],
      }));
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(
        `Image upload failed: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleMultipleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const fileArray = Array.from(files);
    const currentImageCount = formData.imageUrl.length;
    const remainingSlots = MAX_IMAGES - currentImageCount;
    
    // Check if adding these files would exceed the limit
    if (currentImageCount >= MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed per product.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Limit the number of files to upload based on remaining slots
    const filesToUpload = fileArray.slice(0, remainingSlots);
    if (fileArray.length > remainingSlots) {
      toast.warning(`Only ${remainingSlots} image(s) will be uploaded. Maximum ${MAX_IMAGES} images allowed.`);
    }
    
    // Validate all files
    const maxSize = 10 * 1024 * 1024; // 10MB
    const invalidFiles = filesToUpload.filter(
      file => !file.type.startsWith('image/') || file.size > maxSize
    );

    if (invalidFiles.length > 0) {
      toast.error("Some files are invalid. Please select only image files under 10MB.");
      return;
    }

    setIsUploadingImage(true);
    setUploadingImageCount(filesToUpload.length);

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        try {
          const url = await ApiService.uploadImage(file.name, file, token ?? "");
          return url;
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          throw error;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData((prev) => ({
        ...prev,
        imageUrl: [...prev.imageUrl, ...uploadedUrls],
      }));
      
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error(
        `Some images failed to upload: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsUploadingImage(false);
      setUploadingImageCount(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleMultipleImageUpload(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploadingImage) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isUploadingImage) {
      return;
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleMultipleImageUpload(files);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-black/100">
            {isEdit ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-black/100" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-80px)]"
        >
          {/* Product Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-black/100">
              Product Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`w-full p-3 rounded-lg text-black/100 bg-white border shadow-sm placeholder-muted-black/100 
      ${errors.name
                  ? "border-destructive"
                  : "border-border hover:border-gray-400"
                } 
      focus:outline-none transition-colors`}
              placeholder="Enter product name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-black/100">
              Brand <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => handleInputChange("brand", e.target.value)}
              className={`w-full p-3 rounded-lg text-black/100 bg-white border shadow-sm placeholder-muted-black/100 
      ${errors.brand
                  ? "border-destructive"
                  : "border-border hover:border-gray-400"
                } 
      focus:outline-none transition-colors`}
              placeholder="Enter brand name"
            />
            {errors.brand && (
              <p className="text-sm text-destructive">{errors.brand}</p>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-black/100">
              Product Images
            </label>
            
            {/* Multiple File Upload Input */}
            <div 
              className="relative"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isUploadingImage || formData.imageUrl.length >= MAX_IMAGES}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage || formData.imageUrl.length >= MAX_IMAGES}
                className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDragging && formData.imageUrl.length < MAX_IMAGES
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary bg-gray-50 hover:bg-gray-100"
                }`}
              >
                {isUploadingImage ? (
                  <>
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-primary">
                      Uploading {uploadingImageCount} image(s)...
                    </span>
                  </>
                ) : formData.imageUrl.length >= MAX_IMAGES ? (
                  <>
                    <Upload className="w-6 h-6 text-muted-black/100 opacity-50" />
                    <span className="text-sm font-medium text-black/100">
                      Maximum {MAX_IMAGES} images reached
                    </span>
                    <span className="text-xs text-muted-black/100">
                      Remove an image to upload more
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-black/100" />
                    <span className="text-sm font-medium text-black/100">
                      Click to upload images or drag and drop
                    </span>
                    <span className="text-xs text-muted-black/100">
                      Up to {MAX_IMAGES} images (Max 10MB each) - {formData.imageUrl.length}/{MAX_IMAGES} uploaded
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Alternative: Single Image Upload via ImagePicker (for camera) */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-xs text-muted-black/100">OR</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>
            <div className="flex justify-center">
              <ImagePicker
                onPick={handleImageUpload}
                type={PickerType.GALLERY}
                disabled={isUploadingImage || formData.imageUrl.length >= MAX_IMAGES}
              />
            </div>

            {/* Image Previews Grid */}
            {formData.imageUrl.length > 0 && (
              <div className="mt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {formData.imageUrl.map((url, index) => (
                    url && (
                      <div 
                        key={index} 
                        className="relative group aspect-square rounded-lg overflow-hidden border border-gray-300 bg-gray-100"
                      >
                        <img
                          src={url}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newUrls = formData.imageUrl.filter((_, i) => i !== index);
                            setFormData((prev) => ({ ...prev, imageUrl: newUrls }));
                            toast.success("Image removed");
                          }}
                          className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Image {index + 1}
                        </div>
                      </div>
                    )
                  ))}
                </div>
                {formData.imageUrl.length > 0 && (
                  <p className="text-xs text-muted-black/100 mt-2">
                    {formData.imageUrl.length}/{MAX_IMAGES} image(s) uploaded
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-black/100">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={`w-full p-3 rounded-lg text-black/100 bg-white border shadow-sm placeholder-muted-black/100 
      border-border hover:border-gray-400 focus:outline-none transition-colors resize-none`}
              placeholder="Enter product description"
              rows={2}
            />
          </div>

          {/* Quantity Type */}
          {/* Quantity Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-black/100">
              Quantity Type
            </label>
            <div className="relative w-full dropdown-container">
              <div
                role="button"
                onClick={() => setIsQuantityOpen(!isQuantityOpen)}
                className={`w-full flex justify-between items-center p-3 rounded-lg text-black/100 bg-white border shadow-sm cursor-pointer
        ${errors.quantityType
                    ? "border-destructive"
                    : "border-border hover:border-gray-400"
                  }
      `}
              >
                {formData.quantityType || "Select quantity type"}
                <ChevronDown className="w-4 h-4 text-muted-black/100 ml-2" />
              </div>

              {isQuantityOpen && (
                <ul className="absolute left-0 top-full mt-1 text-black bg-white rounded-lg border border-gray-400 shadow-lg w-full p-1 z-10">
                  {quantityUnits.map((unit) => (
                    <li key={unit}>
                      <button
                        type="button"
                        onClick={() => {
                          handleQuantityTypeChange(unit as QuantityUnit);
                          setIsQuantityOpen(false);
                        }}
                        className="px-3 py-2 text-left hover:bg-gray-100 rounded-md w-full"
                      >
                        {unit}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {errors.quantityType && (
              <p className="text-sm text-destructive">{errors.quantityType}</p>
            )}
          </div>

          {/* Custom Unit */}
          {showCustomUnit && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-black/100">
                Custom Unit
              </label>
              <input
                type="text"
                value={formData.customUnit}
                onChange={(e) =>
                  handleInputChange("customUnit", e.target.value)
                }
                className={`w-full p-3 rounded-lg text-black/100 bg-white border shadow-sm placeholder-muted-black/100 
        ${errors.customUnit
                    ? "border-destructive"
                    : "border-border hover:border-gray-400"
                  } 
        focus:outline-none transition-colors`}
                placeholder="Enter custom unit"
              />
              {errors.customUnit && (
                <p className="text-sm text-destructive">{errors.customUnit}</p>
              )}
            </div>
          )}

          {/* Price */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-black/100">Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              className={`w-full p-3 rounded-lg text-black/100 bg-white border shadow-sm placeholder-muted-black/100 
      ${errors.price
                  ? "border-destructive"
                  : "border-border hover:border-gray-400"
                } 
      focus:outline-none transition-colors`}
              placeholder="Enter price"
            />
            {errors.price && (
              <p className="text-sm text-destructive">{errors.price}</p>
            )}
          </div>

          {/* Currency */}
          {/* Currency Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-black/100">
              Currency
            </label>
            <div className="relative w-full dropdown-container">
              <div
                role="button"
                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                className={`w-full flex justify-between items-center p-3 rounded-lg text-black/100 bg-white border shadow-sm cursor-pointer
        ${errors.currency
                    ? "border-destructive"
                    : "border-border hover:border-gray-400"
                  }
      `}
              >
                {formData.currency || "Select currency"}
                <ChevronDown className="w-4 h-4 text-muted-black/100 ml-2" />
              </div>

              {isCurrencyOpen && (
                <ul className="absolute left-0 top-full mt-1 text-black bg-white rounded-lg border border-gray-400 shadow-lg w-full p-1 z-10">
                  {currencies.map((currency) => (
                    <li key={currency}>
                      <button
                        type="button"
                        onClick={() => {
                          handleInputChange("currency", currency);
                          setIsCurrencyOpen(false);
                        }}
                        className="px-3 py-2 text-left hover:bg-gray-100 rounded-md w-full"
                      >
                        {currency}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {errors.currency && (
              <p className="text-sm text-destructive">{errors.currency}</p>
            )}
          </div>

          {/* Category */}
          {/* Category Dropdown */}
          {!businessType ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-black/100">
                Category
              </label>
              <p className="text-sm text-muted-black/100">
                Loading business information...
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-black/100">
                  Category
                </label>
                <div className="relative w-full dropdown-container">
                  <div
                    role="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className={`w-full flex justify-between items-center p-3 rounded-lg text-black/100 bg-white border shadow-sm cursor-pointer
          ${errors.category
                      ? "border-destructive"
                      : "border-border hover:border-gray-400"
                    }
        `}
                  >
                    {isLoadingTypes ? (
                      <span className="text-muted-black/100">Loading categories...</span>
                    ) : formData.selectedCategory || "Select category"}
                    <ChevronDown className="w-4 h-4 text-muted-black/100 ml-2" />
                  </div>

                  {isCategoryOpen && !isLoadingTypes && (
                    <ul className="absolute left-0 top-full mt-1 text-black bg-white rounded-lg border border-gray-400 shadow-lg w-full p-1 z-20 max-h-60 overflow-y-auto">
                      {availableCategories.length > 0 ? (
                        availableCategories.map((category) => (
                          <li key={category}>
                            <button
                              type="button"
                              onClick={() => {
                                handleCategoryChange(category);
                                setIsCategoryOpen(false);
                              }}
                              className="px-3 py-2 text-left hover:bg-gray-100 rounded-md w-full"
                            >
                              {category}
                            </button>
                          </li>
                        ))
                      ) : (
                        <li className="px-3 py-2 text-muted-black/100">
                          No categories available for this business type
                        </li>
                      )}
                    </ul>
                  )}
                </div>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category}</p>
                )}
              </div>

              {/* Subcategory Dropdown */}
              {formData.selectedCategory && availableSubcategories.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-black/100">
                    Subcategory
                  </label>
                  <div className="relative w-full dropdown-container">
                    <div
                      role="button"
                      onClick={() => setIsSubcategoryOpen(!isSubcategoryOpen)}
                      className={`w-full flex justify-between items-center p-3 rounded-lg text-black/100 bg-white border shadow-sm cursor-pointer
          ${errors.category
                        ? "border-destructive"
                        : "border-border hover:border-gray-400"
                      }
        `}
                    >
                      {formData.selectedSubcategory || "Select subcategory"}
                      <ChevronDown className="w-4 h-4 text-muted-black/100 ml-2" />
                    </div>

                    {isSubcategoryOpen && (
                      <ul className="absolute left-0 top-full mt-1 text-black bg-white rounded-lg border border-gray-400 shadow-lg w-full p-1 z-20 max-h-60 overflow-y-auto">
                        {availableSubcategories.map((subcategory) => (
                          <li key={subcategory}>
                            <button
                              type="button"
                              onClick={() => {
                                handleSubcategoryChange(subcategory);
                                setIsSubcategoryOpen(false);
                              }}
                              className="px-3 py-2 text-left hover:bg-gray-100 rounded-md w-full"
                            >
                              {subcategory}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category}</p>
                  )}
                </div>
              )}

              {/* Custom Category Option */}
              {formData.selectedCategory && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCustomCategoryToggle}
                    className="text-sm text-primary hover:underline"
                  >
                    {showCustomCategory ? "Use predefined categories" : "Use custom category instead"}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Custom Category */}
          {showCustomCategory && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-black/100">
                Custom Category
              </label>
              <input
                type="text"
                value={formData.customCategory}
                onChange={(e) =>
                  handleInputChange("customCategory", e.target.value)
                }
                className={`w-full p-3 rounded-lg text-black/100 bg-white border shadow-sm placeholder-muted-black/100 
        ${errors.customCategory
                    ? "border-destructive"
                    : "border-border hover:border-gray-400"
                  } 
        focus:outline-none transition-colors`}
                placeholder="Enter custom category"
              />
              {errors.customCategory && (
                <p className="text-sm text-destructive">
                  {errors.customCategory}
                </p>
              )}
            </div>
          )}

          {/* Stock Quantity */}
          {/* <div className="space-y-2">
            <label className="text-sm font-medium text-black/100">
              Stock Quantity (Optional)
            </label>
            <input
              type="number"
              min="0"
              value={formData.stockQuantity}
              onChange={(e) =>
                handleInputChange("stockQuantity", e.target.value)
              }
              className="w-full p-3 rounded-lg text-black/100 bg-white border shadow-sm border-border hover:border-gray-400 placeholder-muted-black/100 focus:outline-none transition-colors"
              placeholder="Enter stock quantity"
            />
          </div> */}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-primary text-primary-black/100 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary-black/100 border-t-transparent rounded-full animate-spin" />
            ) : (
              "Submit"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
