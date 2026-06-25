import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ReportPeriod } from '@prisma/client';

export class ReportsQueryDto {
  @IsUUID('4', { message: 'Geçersiz kanal ID formatı (UUID olmalıdır).' })
  @IsNotEmpty({ message: 'channelId parametresi zorunludur.' })
  channelId!: string;

  @IsEnum(ReportPeriod, { message: 'Geçersiz periyot değeri.' })
  @IsOptional()
  period?: ReportPeriod;
}
