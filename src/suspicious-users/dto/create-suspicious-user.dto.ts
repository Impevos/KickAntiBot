import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Severity } from '@prisma/client';

export class CreateSuspiciousUserDto {
  @IsString({ message: 'Kick kullanıcı ID\'si metin olmalıdır.' })
  @IsNotEmpty({ message: 'Kick kullanıcı ID\'si boş bırakılamaz.' })
  kickUserId!: string;

  @IsString({ message: 'Kullanıcı adı metin olmalıdır.' })
  @IsNotEmpty({ message: 'Kullanıcı adı boş bırakılamaz.' })
  username!: string;

  @IsUUID('4', { message: 'Geçersiz kanal ID formatı (UUID olmalıdır).' })
  @IsNotEmpty({ message: 'Kanal ID\'si boş bırakılamaz.' })
  channelId!: string;

  @IsString({ message: 'Şüphe sebebi metin olmalıdır.' })
  @IsNotEmpty({ message: 'Şüphe sebebi boş bırakılamaz.' })
  reason!: string;

  @IsArray({ message: 'Etiketler dizi olmalıdır.' })
  @IsString({ each: true, message: 'Her etiket metin olmalıdır.' })
  @IsOptional()
  tags?: string[];

  @IsEnum(Severity, { message: 'Geçersiz önem derecesi.' })
  @IsOptional()
  severity?: Severity;
}
