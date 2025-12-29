import api from './api';
import { API_ENDPOINTS, API_BASE_URL } from '../constants/api';

// Get full URL for uploaded images
export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;

  // If it's already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Otherwise, prepend the base URL (remove /api/v1 from base URL)
  const baseUrl = API_BASE_URL.replace('/api/v1', '');
  return `${baseUrl}${path}`;
};

// Upload user avatar
export const uploadAvatar = async (imageUri: string): Promise<string> => {
  const formData = new FormData();

  // Get file extension and mime type
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1];

  formData.append('avatar', {
    uri: imageUri,
    name: `avatar.${fileType}`,
    type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
  } as any);

  const response = await api.post(API_ENDPOINTS.UPLOAD.AVATAR, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.avatarUrl;
};

// Upload product image (admin only)
export const uploadProductImage = async (productId: string, imageUri: string): Promise<string> => {
  const formData = new FormData();

  // Get file extension and mime type
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1];

  formData.append('productImage', {
    uri: imageUri,
    name: `product.${fileType}`,
    type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
  } as any);

  const response = await api.put(`${API_ENDPOINTS.UPLOAD.PRODUCT}/${productId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.imageUrl;
};

export const uploadService = {
  getImageUrl,
  uploadAvatar,
  uploadProductImage,
};
