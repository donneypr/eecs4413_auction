import { apiClient } from './api';

export interface SignupData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
  street_name: string;
  street_number: string;
  city: string;
  country: string;
  postal_code: string;
}
export interface LoginData {
  username: string;
  password: string;
}

export const authService = {
  async signup(data: SignupData) {
    return apiClient.post('auth/signup/', data);  
  },

  async login(data: LoginData) {
    return apiClient.post('auth/login/', data); 
  },

  async logout() {
    return apiClient.post('auth/logout/', {}); 
  },

  async getCurrentUser() {
    return apiClient.get('auth/me/');  
  },
};
