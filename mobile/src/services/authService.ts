import api, { getErrorMessage } from './api';
import { API_ENDPOINTS } from '../constants/api';
import type { User, AuthTokens } from '../stores/authStore';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  kvkkAccepted: boolean;
  phoneVerified?: boolean;
}

export interface LoginData {
  identifier: string;
  password: string;
}

export interface VerifyEmailData {
  email: string;
  code: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  code: string;
  newPassword: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

class AuthService {
  async register(data: RegisterData): Promise<{ userId: string; email: string }> {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REGISTER, data);
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async verifyEmail(data: VerifyEmailData): Promise<AuthResponse> {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, data);
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async resendVerification(email: string): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.AUTH.RESEND_VERIFICATION, { email });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.LOGIN, data);
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async resetPassword(data: ResetPasswordData): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async logout(refreshToken?: string): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error);
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get(API_ENDPOINTS.AUTH.ME);
      return response.data.data.user;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
      return response.data.data.tokens;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async sendPhoneCode(phone: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.SEND_PHONE_CODE, { phone });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async verifyPhoneCode(phone: string, code: string): Promise<{ success: boolean; verified: boolean }> {
    try {
      const response = await api.post(API_ENDPOINTS.AUTH.VERIFY_PHONE_CODE, { phone, code });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }
}

export const authService = new AuthService();
