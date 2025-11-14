import axios from 'axios';
import type { PredictResponse, InfoResponse } from '@/types/flower';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const predictFlower = async (imageFile: File): Promise<PredictResponse> => {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await api.post<PredictResponse>('/predict', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const getFlowerInfo = async (classId: string): Promise<InfoResponse> => {
  const response = await api.get<InfoResponse>(`/info/${classId}`);
  return response.data;
};
