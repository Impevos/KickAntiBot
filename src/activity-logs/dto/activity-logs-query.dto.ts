import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ActivityLogTypeEnum {
  ALERT = 'ALERT',
  SUSPICIOUS_USER = 'SUSPICIOUS_USER',
  RISK_SCORE = 'RISK_SCORE',
  REPORT = 'REPORT',
}

export class ActivityLogsQueryDto {
  @IsUUID('4', { message: 'Geçersiz kanal ID formatı (UUID olmalıdır).' })
  @IsNotEmpty({ message: 'channelId parametresi zorunludur.' })
  channelId!: string;

  @IsEnum(ActivityLogTypeEnum, { message: 'Geçersiz aktivite türü.' })
  @IsOptional()
  type?: ActivityLogTypeEnum;

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
