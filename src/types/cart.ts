/* eslint-disable @typescript-eslint/no-explicit-any */
export interface CartItem {
  productId: string;
  productName: string;
  productBrand: string;
  productCategory: string;
  productSubCategory: string;
  productImageUrl: string[]; // Changed to array
  productQty: number;
  productQtyType?: string;
  totalPerProduct: number;
}

export interface CartModel {
  id?: string;
  items: CartItem[];
  serviceGuyName: string;
  serviceGuyTipPercent: string;
  serviceGuyTipValue: number;
  overAllTotal: number;
  businessHiveUserName: string;
  businessId: string;
  hiveUserName?: string;
  transactionId?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  generatedByBusiness: boolean;
}

export function createCartModel(json: any): CartModel {
  return {
    id: json._id || json.id,
    items: (json.items || []).map((item: any) => ({
      productId: item.productId || '',
      productName: item.productName || '',
      productBrand: item.productBrand || '',
      productCategory: item.productCategory || '',
      productSubCategory: item.productSubCategory || '',
      productImageUrl: Array.isArray(item.productImageUrl) 
        ? item.productImageUrl 
        : item.productImageUrl 
          ? [item.productImageUrl] 
          : [],
      productQty: item.productQty || 0,
      productQtyType: item.productQtyType || '',
      totalPerProduct: Number(item.totalPerProduct) || 0,
    })),
    serviceGuyName: json.serviceGuyName || '',
    serviceGuyTipPercent: json.serviceGuyTipPercent || '',
    serviceGuyTipValue: Number(json.serviceGuyTipValue) || 0,
    overAllTotal: Number(json.overAllTotal) || 0,
    businessHiveUserName: json.businessHiveUserName || '',
    businessId: json.businessId || '',
    hiveUserName: json.hiveUserName,
    transactionId: json.transactionId,
    status: json.status,
    createdAt: json.createdAt ? new Date(json.createdAt) : undefined,
    updatedAt: json.updatedAt ? new Date(json.updatedAt) : undefined,
    generatedByBusiness: json.generatedByBusiness || false,
  };
}