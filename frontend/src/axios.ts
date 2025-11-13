import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_URL } from './config';

interface RequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: Record<string, any> | FormData;
  headers?: Record<string, string>;
}

const request = async ({
  url,
  method,
  data,
  headers,
}: RequestOptions): Promise<AxiosResponse> => {
  const token = localStorage.getItem('accessToken');
  const config: AxiosRequestConfig = {
    method,
    url: API_URL + url, // ✅ DO NOT prepend /api again
    headers: {
      ...headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    withCredentials: true,
  };

  if (data) {
    if (data instanceof FormData) {
      config.data = data;
    } else {
      config.data = JSON.stringify(data);
      config.headers = {
        ...config.headers,
        'Content-Type': 'application/json',
      };
    }
  }

  try {
    const response = await axios(config);
    return response;
  } catch (error) {
    throw error;
  }
};


export default request;
