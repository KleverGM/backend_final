import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum EntityType {
  MOTORCYCLE = 'motorcycle',
  CUSTOMER = 'customer',
  USER = 'user',
}

export class UploadDto {
  @IsOptional()
  @IsEnum(EntityType)
  entityType?: EntityType;

  @IsOptional()
  @IsString()
  entityId?: string;
}

export class UploadResponseDto {
  id: string;
  originalName: string;
  filename: string;
  url: string;
  size: number;
  mimetype: string;
  entityType?: string;
  entityId?: string;
  createdAt: Date;
}
