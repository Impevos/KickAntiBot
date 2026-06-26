import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateChannelDto {
  @IsString({ message: 'Kick kanal ID\'si metin olmalıdır.' })
  @IsNotEmpty({ message: 'Kick kanal ID\'si boş bırakılamaz.' })
  @MaxLength(100, { message: 'Kick kanal ID en fazla 100 karakter olabilir.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  kickChannelId!: string;

  @IsString({ message: 'Kanal adı metin olmalıdır.' })
  @IsNotEmpty({ message: 'Kanal adı boş bırakılamaz.' })
  @MaxLength(100, { message: 'Kanal adı en fazla 100 karakter olabilir.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  channelName!: string;
}
