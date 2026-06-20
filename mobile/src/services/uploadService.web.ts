// Image upload — WEB.
// Mirrors src/services/uploadService.ts but assembles multipart bodies the way a
// browser needs: the picker yields a blob:/data: URI, which we fetch into a real
// File/Blob and append to FormData. We must NOT set Content-Type manually — the
// browser adds the multipart boundary automatically. (The native version appends
// the React-Native { uri, name, type } object, which a browser serialises to
// "[object Object]".) Same export surface so importers resolve this on web with
// no call-site changes.
import api from './api';
import { API_ENDPOINTS, API_BASE_URL } from '../constants/api';

export const getImageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const baseUrl = API_BASE_URL.replace('/api/v1', '');
  return `${baseUrl}${path}`;
};

async function uriToFile(uri: string, filename: string): Promise<Blob> {
  const res = await fetch(uri);
  const blob = await res.blob();
  try {
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  } catch {
    // Older browsers without the File constructor — a Blob is accepted too.
    return blob;
  }
}

// Let the browser set `multipart/form-data; boundary=...` itself.
const MULTIPART_CONFIG = { headers: { 'Content-Type': undefined } } as any;

export const uploadAvatar = async (imageUri: string): Promise<string> => {
  const formData = new FormData();
  const file = await uriToFile(imageUri, 'avatar.jpg');
  formData.append('avatar', file, 'avatar.jpg');

  const response = await api.post(API_ENDPOINTS.UPLOAD.AVATAR, formData, MULTIPART_CONFIG);
  return response.data.avatarUrl;
};

export const uploadProductImage = async (productId: string, imageUri: string): Promise<string> => {
  const formData = new FormData();
  const file = await uriToFile(imageUri, 'product.jpg');
  formData.append('productImage', file, 'product.jpg');

  const response = await api.put(
    `${API_ENDPOINTS.UPLOAD.PRODUCT}/${productId}`,
    formData,
    MULTIPART_CONFIG,
  );
  return response.data.imageUrl;
};

export const uploadService = {
  getImageUrl,
  uploadAvatar,
  uploadProductImage,
};
