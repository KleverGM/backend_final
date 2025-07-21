// Custom error types for type-safe error handling
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

export interface DatabaseError extends AppError {
  query?: string;
  parameters?: any[];
}

export interface ValidationError extends AppError {
  field: string;
  value: any;
  constraints: string[];
}

// Utility functions for safe error handling
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

export function createAppError(
  message: string,
  code?: string,
  statusCode?: number,
  details?: any,
): AppError {
  return {
    message,
    code,
    statusCode,
    details,
  };
}

export function createDatabaseError(
  message: string,
  query?: string,
  parameters?: any[],
): DatabaseError {
  return {
    message,
    code: 'DATABASE_ERROR',
    statusCode: 500,
    query,
    parameters,
  };
}

export function createValidationError(
  field: string,
  value: any,
  constraints: string[],
): ValidationError {
  return {
    message: `Validation failed for field '${field}'`,
    code: 'VALIDATION_ERROR',
    statusCode: 400,
    field,
    value,
    constraints,
  };
}
