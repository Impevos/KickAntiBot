import { join } from 'path';
import { existsSync } from 'fs';
import * as dotenv from 'dotenv';

const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
