export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  riskAppetite: 'low' | 'moderate' | 'high';
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SignupData {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  riskAppetite: 'low' | 'moderate' | 'high';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface GetMeResponse {
  user: User;
}

export interface UpdateProfileData {
  firstName: string;
  lastName?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}
