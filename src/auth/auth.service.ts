import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from './supabase.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '@prisma/client';

type SupabaseAuthUser = {
  id: string;
  email?: string;
  user_metadata?: {
    display_name?: string;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, displayName } = registerDto;
    const supabase = this.supabaseService.getClient();

    // Local check to see if email is already in use
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Bu e-posta adresiyle kayıtlı bir kullanıcı zaten mevcut.');
    }

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
      throw this.mapAuthError(error, 'register');
    }

    if (!data.user) {
      throw new BadRequestException('User registration failed.');
    }

    // Explicitly create user profile in PostgreSQL database
    const localUser = await this.syncLocalUser(data.user, email, displayName);

    return {
      success: true,
      message: data.session
        ? 'Kullanıcı başarıyla kaydedildi.'
        : 'Kayıt başarılı. Giriş yapmadan önce e-posta adresinizi doğrulayın.',
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
      throw this.mapAuthError(error, 'login');
    }

    if (!data.session || !data.user) {
      throw new UnauthorizedException('Oturum açma başarısız.');
    }

    // Sync/Upsert user in local PostgreSQL
    const localUser = await this.syncLocalUser(data.user, email);

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

  private async syncLocalUser(
    authUser: SupabaseAuthUser,
    fallbackEmail: string,
    displayNameOverride?: string,
  ): Promise<User> {
    const email = authUser.email || fallbackEmail;
    const displayName =
      displayNameOverride ||
      authUser.user_metadata?.display_name ||
      email.split('@')[0];

    const existingByEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    // Supabase'de kullanıcı silinip yeniden oluşturulursa UUID değişir;
    // eski Prisma kaydı unique email kısıtında 500 hatasına yol açar.
    if (existingByEmail && existingByEmail.id !== authUser.id) {
      await this.prisma.user.delete({
        where: { id: existingByEmail.id },
      });
    }

    return this.prisma.user.upsert({
      where: { id: authUser.id },
      update: {
        email,
        displayName,
      },
      create: {
        id: authUser.id,
        email,
        displayName,
        role: 'STREAMER',
      },
    });
  }

  private mapAuthError(
    error: { message?: string; code?: string },
    action: 'login' | 'register',
  ): BadRequestException | UnauthorizedException {
    const message = error.message?.toLowerCase() ?? '';
    const code = error.code?.toLowerCase() ?? '';

    if (
      code === 'email_not_confirmed' ||
      message.includes('email not confirmed')
    ) {
      return new UnauthorizedException(
        'E-posta adresiniz henüz doğrulanmamış. Gelen kutunuzu (ve spam klasörünü) kontrol edin.',
      );
    }

    if (action === 'login') {
      return new UnauthorizedException('E-posta adresi veya şifre hatalı.');
    }

    return new BadRequestException(error.message || 'Kimlik doğrulama hatası.');
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

  async getProfile(user: User) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        _count: {
          select: { channels: true },
        },
        channels: {
          select: {
            id: true,
            kickChannelId: true,
            channelName: true,
            kickAvatarUrl: true,
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      throw new BadRequestException('Kullanıcı profili bulunamadı.');
    }

    const { channels, _count, ...userData } = profile;

    return {
      success: true,
      data: {
        ...userData,
        channelCount: _count.channels,
        channels,
      },
    };
  }

  async updateProfile(user: User, updateProfileDto: UpdateProfileDto) {
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: updateProfileDto,
    });

    return {
      success: true,
      message: 'Profil başarıyla güncellendi.',
      data: updatedUser,
    };
  }
}
