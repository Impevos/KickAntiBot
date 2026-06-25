import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class AlertsQueryDto {
  @IsUUID('4', { message: 'Geçersiz kanal ID formatı (UUID olmalıdır).' })
  @IsNotEmpty({ message: 'channelId parametresi zorunludur.' })
  channelId!: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isRead alanı true veya false olmalıdır.' })
  isRead?: boolean;

  @Type(() => Number)
  @IsInt({ message: 'Limit tam sayı olmalıdır.' })
  @Min(1, { message: 'Limit en az 1 olmalıdır.' })
  @IsOptional()
  limit?: number;
}
