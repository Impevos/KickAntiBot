import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChannelDto {
  @IsString({ message: 'Kick kanal ID\'si metin olmalıdır.' })
  @IsNotEmpty({ message: 'Kick kanal ID\'si boş bırakılamaz.' })
  kickChannelId!: string;

  @IsString({ message: 'Kanal adı metin olmalıdır.' })
  @IsNotEmpty({ message: 'Kanal adı boş bırakılamaz.' })
  channelName!: string;
}
