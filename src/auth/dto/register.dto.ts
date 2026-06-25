import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz.' })
  @IsNotEmpty({ message: 'E-posta alanı boş bırakılamaz.' })
  @MaxLength(254, { message: 'E-posta adresi çok uzun.' })
  email!: string;

  @IsString({ message: 'Şifre metin olmalıdır.' })
  @IsNotEmpty({ message: 'Şifre alanı boş bırakılamaz.' })
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
  @MaxLength(72, { message: 'Şifre en fazla 72 karakter olabilir.' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.',
  })
  password!: string;

  @IsString({ message: 'Görünür ad metin olmalıdır.' })
  @MaxLength(100, { message: 'Görünür ad en fazla 100 karakter olabilir.' })
  @IsOptional()
  displayName?: string;
}
