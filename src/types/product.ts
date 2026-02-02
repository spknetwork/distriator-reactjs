// src/types/product.ts
export const Currency = {
  USD: 'USD',
  HBD: 'HBD',
} as const;
export type Currency = typeof Currency[keyof typeof Currency];


export const QuantityUnit = {
  kg: 'kg',
  L: 'L',
  mL: 'mL',
  gram: 'gram',
  Each: 'Each',
  piece: 'piece',
  item: 'item',
  unit: 'unit',
  other: 'other',
} as const;
export type QuantityUnit = typeof QuantityUnit[keyof typeof QuantityUnit];


export const ProductCategory = {
  food: 'food',
  books: 'books',
  Beverage: 'Beverage',
  Sport: 'Sport',
  electronic: 'electronic',
  beauty: 'beauty',
  fashion: 'fashion',
  other: 'other',
} as const;
export type ProductCategory = typeof ProductCategory[keyof typeof ProductCategory];


export interface QuantityTypeDetails {
  type: QuantityUnit;
  customUnit?: string;
}

export interface CategoryDetails {
  type: ProductCategory;
  customCategory?: string;
}

export interface ProductModel {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string | string[]; // Support both string (legacy) and array (new format)
  price: number;
  currency: Currency;
  quantityType: QuantityTypeDetails;
  category: CategoryDetails;
  subCategory?: string; // Separate subCategory field from API
  businessId: string[];
  brand?: string;
  stockQuantity?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export function createProductModel(json: any): ProductModel {
  // Handle category - API can return it as a string or as an object
  let categoryType: ProductCategory = ProductCategory.other;
  let categoryString: string = '';
  
  // Extract subcategory from category string if it's in "Category > Subcategory" format
  let extractedSubCategory = '';
  
  if (json.category) {
    if (typeof json.category === 'string') {
      // API returns category as string (e.g., "Beverages (Non-Alcoholic)" or "Category > Subcategory")
      categoryString = json.category;
      // Check if it's a "Category > Subcategory" format
      if (categoryString.includes(' > ')) {
        const parts = categoryString.split(' > ');
        categoryString = parts[0] || '';
        extractedSubCategory = parts[1] || '';
      }
      // Try to match with ProductCategory enum, otherwise use 'other'
      const matchedCategory = Object.values(ProductCategory).find(
        cat => cat.toLowerCase() === categoryString.toLowerCase()
      );
      categoryType = matchedCategory || ProductCategory.other;
    } else if (json.category.type) {
      // Legacy format with category object
      if (typeof json.category.type === 'string') {
        categoryString = json.category.type;
        // Check if it's a "Category > Subcategory" format
        if (categoryString.includes(' > ')) {
          const parts = categoryString.split(' > ');
          categoryString = parts[0] || '';
          extractedSubCategory = parts[1] || '';
        }
      }
      categoryType = Object.values(ProductCategory).includes(json.category.type)
        ? json.category.type
        : ProductCategory.other;
    }
  }
  
  return {
    id: json._id || json.id || '',
    name: json.name || 'Unknown Product',
    description: json.description,
    imageUrl: json.imageUrl,
    price: Number(json.price) || 0,
    currency: json.currency === 'HBD' ? Currency.HBD : Currency.USD,
    quantityType: {
      type: Object.values(QuantityUnit).includes(json.quantityType?.type || json.quantityType) 
        ? (json.quantityType?.type || json.quantityType) 
        : QuantityUnit.Each,
      customUnit: json.quantityType?.customUnit
    },
    category: {
      type: categoryType,
      customCategory: categoryString || json.category?.customCategory
    },
    subCategory: json.subCategory || json.subcategory || extractedSubCategory, // Support both camelCase and lowercase, and extract from category string
    businessId: Array.isArray(json.businessId) ? json.businessId : [],
    brand: json.brand,
    stockQuantity: json.stockQuantity ? Number(json.stockQuantity) : undefined,
    createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
    updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined,
  };
}