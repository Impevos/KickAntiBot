/**
 * Canlı test kullanıcısı oluşturur (Supabase Auth + Prisma).
 * Kullanım: npx ts-node scripts/create-test-user.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

// .env yükle (dotenv paketi olmadan)
const envPath = join(process.cwd(), '.env');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.error('.env dosyası bulunamadı.');
  process.exit(1);
}

const EMAIL = 'wtcn@gmail.com';
const PASSWORD = 'Test123!';
const DISPLAY_NAME = 'WTCN';

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const prisma = new PrismaClient();

  const { data: loginData } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });

  if (loginData.session) {
    console.log(`✓ Giriş başarılı — ${EMAIL} zaten mevcut ve şifre doğru.`);
    await prisma.$disconnect();
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email: EMAIL,
    password: PASSWORD,
    options: { data: { display_name: DISPLAY_NAME } },
  });

  if (error) {
    console.error('Kayıt hatası:', error.message);
    process.exit(1);
  }

  if (!data.user) {
    console.error('Kullanıcı oluşturulamadı.');
    process.exit(1);
  }

  await prisma.user.upsert({
    where: { id: data.user.id },
    update: { email: EMAIL, displayName: DISPLAY_NAME },
    create: {
      id: data.user.id,
      email: EMAIL,
      displayName: DISPLAY_NAME,
      role: 'STREAMER',
    },
  });

  if (data.session) {
    console.log(`✓ Kayıt ve giriş hazır — ${EMAIL}`);
  } else {
    console.log(`✓ Kayıt oluşturuldu — ${EMAIL} (e-posta doğrulama gerekebilir)`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
