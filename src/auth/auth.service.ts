import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, displayName } = registerDto;
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data.user) {
      throw new BadRequestException('User registration failed.');
    }

    // Explicitly create user profile in PostgreSQL database
    const localUser = await this.prisma.user.upsert({
      where: { id: data.user.id },
      update: {
        displayName: displayName || email.split('@')[0],
      },
      create: {
        id: data.user.id,
        email: email,
        displayName: displayName || email.split('@')[0],
        role: 'STREAMER',
      },
    });

    return {
      success: true,
      message: 'Kullanıcı başarıyla kaydedildi.',
      data: {
        user: {
          id: localUser.id,
          email: localUser.email,
          displayName: localUser.displayName,
          role: localUser.role,
          createdAt: localUser.createdAt,
        },
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException('E-posta adresi veya şifre hatalı.');
    }

    if (!data.session || !data.user) {
      throw new UnauthorizedException('Oturum açma başarısız.');
    }

    // Sync/Upsert user in local PostgreSQL
    const localUser = await this.prisma.user.upsert({
      where: { id: data.user.id },
      update: {
        email: data.user.email || email,
      },
      create: {
        id: data.user.id,
        email: data.user.email || email,
        displayName: data.user.user_metadata?.display_name || email.split('@')[0],
        role: 'STREAMER',
      },
    });

    return {
      success: true,
      data: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
        user: {
          id: localUser.id,
          email: localUser.email,
          displayName: localUser.displayName,
          role: localUser.role,
        },
      },
    };
  }

  async logout(token: string) {
    const supabase = this.supabaseService.getClient();
    
    // We can sign out from Supabase Auth using the user token
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new BadRequestException(error.message);
    }

    return {
      success: true,
      message: 'Başarıyla çıkış yapıldı.',
    };
  }
}
