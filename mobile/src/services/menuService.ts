import api from './api';

// Types
export interface Category {
  id: string;
  name: string;
  nameTr: string;
  description?: string;
  descriptionTr?: string;
  imageUrl?: string;
  brand: 'coffee' | 'sandwich';
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  nameTr: string;
  description?: string;
  descriptionTr?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  isCoffee: boolean;
  isActive: boolean;
  sortOrder: number;
  category?: Category;
}

// ==================== PUBLIC ENDPOINTS ====================

export const getCategories = async (brand?: string): Promise<Category[]> => {
  const params = brand ? `?brand=${brand}` : '';
  const response = await api.get(`/menu/categories${params}`);
  return response.data.data.categories;
};

export const getProducts = async (categoryId?: string, brand?: string): Promise<Product[]> => {
  const params = new URLSearchParams();
  if (categoryId) params.append('categoryId', categoryId);
  if (brand) params.append('brand', brand);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  const response = await api.get(`/menu/products${queryString}`);
  return response.data.data.products;
};

export const getFullMenu = async (brand: string) => {
  const response = await api.get(`/menu/full?brand=${brand}`);
  return response.data.data.menu;
};

// ==================== ADMIN ENDPOINTS ====================

// Categories
export const adminGetCategories = async (brand?: string, includeInactive = true): Promise<Category[]> => {
  const params = new URLSearchParams();
  if (brand) params.append('brand', brand);
  params.append('includeInactive', String(includeInactive));
  const response = await api.get(`/admin/menu/categories?${params.toString()}`);
  return response.data.data.categories;
};

export const createCategory = async (data: {
  name: string;
  nameTr: string;
  description?: string;
  descriptionTr?: string;
  brand: 'coffee' | 'sandwich';
  sortOrder?: number;
}): Promise<Category> => {
  const response = await api.post('/admin/menu/category', data);
  return response.data.data.category;
};

export const updateCategory = async (id: string, data: Partial<{
  name: string;
  nameTr: string;
  description?: string;
  descriptionTr?: string;
  sortOrder?: number;
  isActive?: boolean;
}>): Promise<Category> => {
  const response = await api.put(`/admin/menu/category/${id}`, data);
  return response.data.data.category;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/admin/menu/category/${id}`);
};

export const reorderCategories = async (orderedIds: string[]): Promise<void> => {
  await api.post('/admin/menu/categories/reorder', { orderedIds });
};

// Products
export const adminGetProducts = async (categoryId?: string, includeInactive = true): Promise<Product[]> => {
  const params = new URLSearchParams();
  if (categoryId) params.append('categoryId', categoryId);
  params.append('includeInactive', String(includeInactive));
  const response = await api.get(`/admin/menu/products?${params.toString()}`);
  return response.data.data.products;
};

export const createProduct = async (data: {
  name: string;
  nameTr: string;
  description?: string;
  descriptionTr?: string;
  price: number;
  categoryId: string;
  isCoffee?: boolean;
  sortOrder?: number;
}): Promise<Product> => {
  const response = await api.post('/admin/menu/product', data);
  return response.data.data.product;
};

export const updateProduct = async (id: string, data: Partial<{
  name: string;
  nameTr: string;
  description?: string;
  descriptionTr?: string;
  price: number;
  categoryId: string;
  isCoffee?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  imageUrl?: string;
}>): Promise<Product> => {
  const response = await api.put(`/admin/menu/product/${id}`, data);
  return response.data.data.product;
};

export const toggleProductStatus = async (id: string, isActive: boolean): Promise<Product> => {
  const response = await api.patch(`/admin/menu/product/${id}/toggle`, { isActive });
  return response.data.data.product;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/admin/menu/product/${id}`);
};

export const menuService = {
  // Public
  getCategories,
  getProducts,
  getFullMenu,
  // Admin
  adminGetCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
  adminGetProducts,
  createProduct,
  updateProduct,
  toggleProductStatus,
  deleteProduct,
};
