import { IsNotEmpty, IsUUID } from 'class-validator';

export class DashboardSummaryQueryDto {
  @IsUUID('4', { message: 'Geçersiz kanal ID formatı (UUID olmalıdır).' })
  @IsNotEmpty({ message: 'channelId parametresi zorunludur.' })
  channelId!: string;
}
