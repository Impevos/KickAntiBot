import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateRiskScoreDto {
  @IsUUID('4', { message: 'Geçersiz şüpheli kullanıcı ID formatı (UUID olmalıdır).' })
  @IsNotEmpty({ message: 'Şüpheli kullanıcı ID\'si boş bırakılamaz.' })
  suspiciousUserId!: string;

  @IsInt({ message: 'Risk skoru tam sayı olmalıdır.' })
  @Min(0, { message: 'Risk skoru en az 0 olabilir.' })
  @Max(100, { message: 'Risk skoru en fazla 100 olabilir.' })
  @IsNotEmpty({ message: 'Risk skoru boş bırakılamaz.' })
  score!: number;

  @IsString({ message: 'Risk hesaplanma nedeni metin olmalıdır.' })
  @IsNotEmpty({ message: 'Risk hesaplanma nedeni boş bırakılamaz.' })
  reason!: string;

  @IsString({ message: 'Algoritma versiyonu metin olmalıdır.' })
  @IsNotEmpty({ message: 'Algoritma versiyonu boş bırakılamaz.' })
  algorithmVersion!: string;

  @IsOptional()
  metadata?: any;
}
