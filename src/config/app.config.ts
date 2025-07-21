export interface DatabaseConfig {
  postgres: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  mongodb: {
    uri: string;
  };
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export interface AppConfig {
  port: number;
  environment: string;
  database: DatabaseConfig;
  jwt: JwtConfig;
  uploadPath: string;
  maxFileSize: number;
  cors: {
    origin: string;
  };
  swagger: {
    enabled: boolean;
  };
  security: {
    bcryptRounds: number;
  };
  pagination: {
    defaultPageSize: number;
    maxPageSize: number;
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  database: {
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      username: process.env.POSTGRES_USERNAME || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      database: process.env.POSTGRES_DATABASE || 'motorcycles_db',
    },
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/motorcycles_mongo',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  swagger: {
    enabled: process.env.ENABLE_SWAGGER === 'true' || process.env.NODE_ENV === 'development',
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '10', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
  },
});
