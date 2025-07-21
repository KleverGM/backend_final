import { Request } from 'express';

// JWT Payload interface
export interface JwtPayload {
  sub: string; // User ID
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Validated user interface (after JWT validation)
export interface ValidatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  customerId?: string;
}

// Request with authenticated user
export interface RequestWithUser extends Request {
  user: ValidatedUser;
}

// Authentication response interfaces
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    customer?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
}
