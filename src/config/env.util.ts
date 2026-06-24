import { existsSync } from 'fs';
import { join } from 'path';

/**
 * NestJS varsayılan olarak process.cwd() altında .env arar.
 * Monorepo veya iç içe klasör yapısında cwd ile .env konumu farklı olabilir.
 */
export function resolveEnvFilePaths(): string[] {
  const candidates = [
    join(process.cwd(), '.env'),
    join(process.cwd(), '..', '.env'),
    join(__dirname, '..', '.env'),
    join(__dirname, '..', '..', '.env'),
  ];

  const existing = [...new Set(candidates.filter((path) => existsSync(path)))];

  return existing.length > 0 ? existing : [join(process.cwd(), '.env')];
}
