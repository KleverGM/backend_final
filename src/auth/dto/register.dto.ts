import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class RegisterCustomerDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Calle Principal 123', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'Ciudad de México', required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ example: 'CDMX', required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '12345', required: false })
  @IsOptional()
  @IsString()
  zipCode?: string;
}

export class RegisterAdminDto {
  @ApiProperty({ example: 'admin@motoshop.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'admin123456', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Admin password must be at least 8 characters long' })
  password: string;

  @ApiProperty({ example: 'Admin' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Principal' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'MOTORCYCLE_ADMIN_KLEVER_2025', description: 'Clave secreta para crear admin' })
  @IsString()
  adminSecretKey: string;
}

export class RegisterSellerDto {
  @ApiProperty({ example: 'seller@motoshop.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'seller123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'María' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'González' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  phone: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class LoginCustomerDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class LoginAdminDto {
  @ApiProperty({ example: 'admin@motoshop.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'admin123456' })
  @IsString()
  password: string;
}

export class LoginSellerDto {
  @ApiProperty({ example: 'seller@motoshop.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'seller123' })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  refreshToken: string;
}

// ...eliminado UpdateUserDto duplicado. Usar el de update-user.dto.ts
