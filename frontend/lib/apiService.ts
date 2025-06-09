import axios, { AxiosInstance, AxiosResponse } from "axios";

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  user: string;
  passwd: string;
}

export interface SignupRequest {
  user: string;
  passwd: string;
  name?: string;
}

export interface AuthResponse {
  message: string;
  access_token: string;
  expires_in: number;
}

export interface UserData {
  id: number;
  name: string;
  email: string;
  balance: number;
  auth_provider: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  amount: number;
  type: "sent" | "received";
  from_user: string;
  to_user: string;
  timestamp: string;
  status: string;
}

export interface TransactionHistory {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = this.getTokenFromStorage();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();

            const token = this.getTokenFromStorage();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return this.api(originalRequest);
          } catch (refreshError) {
            this.clearAuthData();
            if (typeof window !== "undefined") {
              window.location.href = "/login";
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getTokenFromStorage(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  }

  private setTokenInStorage(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("access_token", token);
  }

  private clearAuthData(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post(
        "/auth/email/login",
        credentials
      );

      if (response.data.access_token) {
        this.setTokenInStorage(response.data.access_token);
      }
      return response.data;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : "Login failed");
    }
  }

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post(
        "/auth/email/signup",
        userData
      );

      if (response.data.access_token) {
        this.setTokenInStorage(response.data.access_token);
      }
      return response.data;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : "Signup failed");
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post("/auth/logout");
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      this.clearAuthData();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    try {
      const response: AxiosResponse<AuthResponse> = await this.api.post(
        "/auth/refresh"
      );

      if (response.data.access_token) {
        this.setTokenInStorage(response.data.access_token);
      }
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error ? error.message : "Token refresh failed"
      );
    }
  }

  async getCurrentUser(): Promise<UserData> {
    try {
      const response: AxiosResponse<UserData> = await this.api.get("/api/me");
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch user data"
      );
    }
  }

  async getUserBalance(): Promise<{ balance: number }> {
    try {
      const response: AxiosResponse<{ balance: number }> = await this.api.get(
        "/api/wallet/balance"
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch balance"
      );
    }
  }

  async getTransactionHistory(
    page: number = 1,
    limit: number = 10
  ): Promise<TransactionHistory> {
    try {
      const response: AxiosResponse<TransactionHistory> = await this.api.get(
        "/api/transactions/history",
        {
          params: { page, limit },
        }
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch transaction history"
      );
    }
  }

  async sendMoney(
    recipientId: number,
    amount: number,
    note?: string
  ): Promise<Transaction> {
    try {
      const response: AxiosResponse<Transaction> = await this.api.post(
        "/api/transactions/send",
        {
          recipient_id: recipientId,
          amount,
          note,
        }
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to send money"
      );
    }
  }

  async addMoney(
    amount: number
  ): Promise<{ message: string; new_balance: number }> {
    try {
      const response: AxiosResponse<{ message: string; new_balance: number }> =
        await this.api.post("/api/wallet/balance", {
          amount,
        });
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to add money"
      );
    }
  }

  async searchUsers(query: string): Promise<UserData[]> {
    try {
      const response: AxiosResponse<{ users: UserData[] }> = await this.api.get(
        "/api/users/search",
        {
          params: { q: query },
        }
      );
      return response.data.users || [];
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to search users"
      );
    }
  }

  async getFriends(): Promise<UserData[]> {
    try {
      const response: AxiosResponse<{ friends: UserData[] }> =
        await this.api.get<{ friends: UserData[] }>("/api/friends");
      return response.data.friends || [];
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to fetch friends"
      );
    }
  }

  async addFriend(friendId: number): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> = await this.api.post(
        "/api/friends/add",
        {
          friend_id: friendId,
        }
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to add friend"
      );
    }
  }

  async removeFriend(friendId: number): Promise<{ message: string }> {
    try {
      const response: AxiosResponse<{ message: string }> =
        await this.api.delete(`/api/friends/${friendId}`);
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error ? error.message : "Failed to remove friend"
      );
    }
  }

  getGoogleAuthUrl(): string {
    return `${this.baseURL}/auth/google`;
  }

  isAuthenticated(): boolean {
    return !!this.getTokenFromStorage();
  }

  async healthCheck(): Promise<{ status: string }> {
    try {
      const response: AxiosResponse<{ status: string }> = await this.api.get(
        "/health"
      );
      return response.data;
    } catch (error: unknown) {
      throw new Error(
        error instanceof Error ? error.message : "API health check failed"
      );
    }
  }
}

export const apiService = new ApiService();
export default apiService;
