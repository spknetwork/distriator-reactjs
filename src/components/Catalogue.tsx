/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { Grid3X3, List, Search, Plus, Package, ArrowLeft } from "lucide-react";
import { fetchBusinessesApi } from "../services/BusinessApi";
import { toast } from "sonner";
import type { BusinessModel } from "../types/business";
import { ProductService } from "../services/product-service";
import type { ProductModel } from "../types/product";
import { ProductCard } from "./ProductCard";
import { ProductForm } from "./ProductForm";
import { useNavigate } from "react-router-dom";
import { useAuthData } from '../utils/auth-utils';

// interface CatalogueScreenProps {
//   onBack?: () => void;
//   onCreateCatalogue?: (business: BusinessModel) => void;
// }

export function CatalogueScreen() {
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductModel[]>([]);
  const [userBusinesses, setUserBusinesses] = useState<BusinessModel[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
  const [isGridView, setIsGridView] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductModel | null>(
    null
  );
  const navigate = useNavigate();

  const { token, username } = useAuthData();
  const business = userBusinesses.find((b) => b.id === selectedBusinessId);
  // Fetch businesses and check if user owns any
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchBusinesses = async () => {
      try {
        const businesses = await fetchBusinessesApi(abortController.signal);
        const ownedBusinesses = businesses.filter(
          (business) => business.distriator?.owner === username
        );
        setUserBusinesses(ownedBusinesses);
        if (ownedBusinesses.length > 0) {
          setSelectedBusinessId(ownedBusinesses[0].id || "");
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        toast.error("Failed to load businesses");
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchBusinesses();
    } else {
      setIsLoading(false);
    }
    
    return () => {
      abortController.abort('avoid duplicate requests');
    };
  }, [username]);

  // Fetch products when business is selected
  useEffect(() => {
    if (!selectedBusinessId) return;
    
    const abortController = new AbortController();
    fetchProducts(abortController.signal);
    
    return () => {
      abortController.abort('avoid duplicate requests');
    };
  }, [selectedBusinessId, token]);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      );
      setFilteredProducts(filtered);
    }
  }, [products, searchQuery]);

  const fetchProducts = async (signal?: AbortSignal) => {
    if (!selectedBusinessId) return;

    setIsLoadingProducts(true);
    try {
      const response = await ProductService.getProducts(token, selectedBusinessId, 1, 100, signal);
      if (response.isSuccess && response.data) {
        setProducts(response.data);
      } else {
        toast.error("Failed to load products");
        setProducts([]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      toast.error("Error loading products");
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleEditProduct = (product: ProductModel) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (product: ProductModel) => {
    try {
      const response = await ProductService.deleteProduct(token, product.id);
      if (response.isSuccess && response.data) {
        toast.success("Product deleted successfully!");
        fetchProducts(); // Refresh the list
      } else {
        toast.error("Failed to delete product");
      }
    } catch (error) {
      toast.error("Error deleting product");
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleFormClose = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const handleFormSuccess = () => {
    fetchProducts(); // Refresh the products list
  };

  const getCrossAxisCount = () => {
    if (typeof window !== "undefined") {
      const width = window.innerWidth;
      if (width > 1200) return 4;
      if (width > 800) return 3;
      if (width > 600) return 2;
    }
    return 1;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading businesses...</p>
        </div>
      </div>
    );
  }

  if (userBusinesses.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center space-x-4">
            <button
            onClick={() => navigate("/")}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
            <h1 className="text-xl font-semibold text-foreground">Catalogue</h1>
          </div>
        </div>

        {/* No Business Message */}
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">No Business Found</h2>
              <p className="text-muted-foreground">
                You don't own any businesses yet. You need to own a business to manage
                products in the catalogue.
              </p>
            </div>
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
            onClick={() => navigate("/")}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {business ? (
            <div className="flex items-center space-x-3">
              <img
                src={
                  business.profile.displayImage || "/placeholder-business.jpg"
                }
                alt={business.profile.displayName}
                className="w-10 h-10 rounded-full object-cover border border-border"
              />
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Product Catalogue
                </h1>
                <p className="text-sm text-muted-foreground">
                  {business.profile.displayName}
                </p>
              </div>
            </div>
          ) : (
            <h1 className="text-xl font-semibold text-foreground">Catalogue</h1>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsGridView(!isGridView)}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            {isGridView ? (
              <List className="w-5 h-5 text-foreground" />
            ) : (
              <Grid3X3 className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Business Selector */}
        {userBusinesses.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Select Business:</label>
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="w-full p-3 bg-card border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {userBusinesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.profile.displayName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Products Grid/List */}
        {isLoadingProducts ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  {searchQuery ? "No products found" : "No products yet"}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Start by adding your first product to the catalogue"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={
              isGridView
                ? `grid gap-6 ${
                    getCrossAxisCount() === 4
                      ? "grid-cols-4"
                      : getCrossAxisCount() === 3
                      ? "grid-cols-3"
                      : getCrossAxisCount() === 2
                      ? "grid-cols-2"
                      : "grid-cols-1"
                  }`
                : "space-y-4"
            }
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                isGridView={isGridView}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleAddProduct}
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-full shadow-glow transition-all duration-300 hover:scale-110 flex items-center space-x-2"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Product Form Modal */}
      <ProductForm
        isOpen={showProductForm}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        businessId={selectedBusinessId}
        product={editingProduct}
        isEdit={!!editingProduct}
      />
    </div>
  );
}
