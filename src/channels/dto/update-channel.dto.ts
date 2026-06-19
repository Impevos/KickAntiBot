import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateChannelDto {
  @IsString({ message: 'Kanal adı metin olmalıdır.' })
  @IsOptional()
  channelName?: string;

  @IsBoolean({ message: 'Aktiflik durumu boolean olmalıdır.' })
  @IsOptional()
  isActive?: boolean;
}
