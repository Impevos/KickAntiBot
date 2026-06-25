import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz.' })
  @IsNotEmpty({ message: 'E-posta alanı boş bırakılamaz.' })
  @MaxLength(254, { message: 'E-posta adresi çok uzun.' })
  email!: string;

  // Giriste sifre politikasi (uzunluk/karmasiklik) ZORLANMAZ; aksi halde
  // politika degisirse eski kullanicilar giris yapamaz ve politika disari sizar.
  // Yalnizca alanin dolu oldugu kontrol edilir.
  @IsString({ message: 'Şifre metin olmalıdır.' })
  @IsNotEmpty({ message: 'Şifre alanı boş bırakılamaz.' })
  @MaxLength(72, { message: 'Şifre en fazla 72 karakter olabilir.' })
  password!: string;
}
