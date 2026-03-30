import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export class HttpError<T = unknown> extends Error {
  readonly status?: number;
  readonly payload?: T;

  constructor(message: string, status?: number, payload?: T) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.payload = payload;
  }
}

const baseURL = import.meta.env.VITE_API_URL ?? "/api";

const client: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response: AxiosResponse<ApiResponse<T>> =
      await client.request<ApiResponse<T>>(config);
    return response.data.data;
  } catch (error: unknown) {
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
      const status = error.response?.status;
      const payload = error.response?.data;
      let message: string;

      if (typeof payload === "object" && payload && "message" in payload) {
        message = String((payload as any).message);
      } else if (typeof error.response?.data?.data === "string") {
        message = error.response.data.data;
      } else {
        message = error.message;
      }
      throw new HttpError(message, status, payload);
    }

    throw error;
  }
}

export const httpClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "GET", url }),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "POST", url, data }),
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "PATCH", url, data }),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    request<T>({ ...config, method: "DELETE", url }),
};

export type { ApiResponse };
