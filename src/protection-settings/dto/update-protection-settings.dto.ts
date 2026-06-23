import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateProtectionSettingsDto {
  @IsBoolean({ message: 'autoBlockEnabled alanı true/false olmalıdır.' })
  @IsOptional()
  autoBlockEnabled?: boolean;

  @IsBoolean({ message: 'autoBanEnabled alanı true/false olmalıdır.' })
  @IsOptional()
  autoBanEnabled?: boolean;

  @IsBoolean({ message: 'alertOnDetection alanı true/false olmalıdır.' })
  @IsOptional()
  alertOnDetection?: boolean;

  @IsInt({ message: 'riskScoreThreshold tam sayı olmalıdır.' })
  @Min(0, { message: 'riskScoreThreshold en az 0 olmalıdır.' })
  @Max(100, { message: 'riskScoreThreshold en fazla 100 olmalıdır.' })
  @IsOptional()
  riskScoreThreshold?: number;

  @IsInt({ message: 'maxMessagesPerMinute tam sayı olmalıdır.' })
  @Min(1, { message: 'maxMessagesPerMinute en az 1 olmalıdır.' })
  @Max(1000, { message: 'maxMessagesPerMinute en fazla 1000 olmalıdır.' })
  @IsOptional()
  maxMessagesPerMinute?: number;
}
