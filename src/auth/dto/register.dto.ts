import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz.' })
  @IsNotEmpty({ message: 'E-posta alanı boş bırakılamaz.' })
  email!: string;

  @IsString({ message: 'Şifre metin olmalıdır.' })
  @IsNotEmpty({ message: 'Şifre alanı boş bırakılamaz.' })
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır.' })
  password!: string;

  @IsString({ message: 'Görünür ad metin olmalıdır.' })
  @IsOptional()
  displayName?: string;
}
