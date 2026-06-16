import apiClient from './client';
import { Platform } from 'react-native';

export const filesApi = {
  uploadFile: async (fileUri: string, mimeType: string = 'image/jpeg'): Promise<string> => {
    const formData = new FormData();
    const filename = fileUri.split('/').pop() || 'photo.jpg';
    
    // React Native FormData requires this specific structure for files
    formData.append('file', {
      uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);

    const response = await apiClient.post<{ success: boolean; data: { url: string } }>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data.url;
  },
};
