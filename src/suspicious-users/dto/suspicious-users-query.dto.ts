import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SuspiciousUserStatus, Severity } from '@prisma/client';

export class SuspiciousUsersQueryDto {
  @IsUUID('4', { message: 'Geçersiz kanal ID formatı (UUID olmalıdır).' })
  @IsNotEmpty({ message: 'channelId parametresi zorunludur.' })
  channelId!: string;

  @IsEnum(SuspiciousUserStatus, { message: 'Geçersiz durum değeri.' })
  @IsOptional()
  status?: SuspiciousUserStatus;

  @IsEnum(Severity, { message: 'Geçersiz önem derecesi.' })
  @IsOptional()
  severity?: Severity;

  @IsString({ message: 'Arama sorgusu metin olmalıdır.' })
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsInt({ message: 'Sayfa numarası tam sayı olmalıdır.' })
  @Min(1, { message: 'Sayfa numarası en az 1 olmalıdır.' })
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt({ message: 'Limit tam sayı olmalıdır.' })
  @Min(1, { message: 'Limit en az 1 olmalıdır.' })
  @IsOptional()
  limit?: number;
}
