import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString({ message: 'Görünür ad metin olmalıdır.' })
  @MaxLength(100, { message: 'Görünür ad en fazla 100 karakter olabilir.' })
  @IsOptional()
  displayName?: string;

  @IsUrl({}, { message: 'Geçerli bir avatar URL giriniz.' })
  @IsOptional()
  avatarUrl?: string;
}
