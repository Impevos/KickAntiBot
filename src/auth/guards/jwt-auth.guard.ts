import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private supabaseService: SupabaseService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization başlığı eksik.');
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = this.supabaseService.getClient();

    // Verify token with Supabase Auth API
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedException(error?.message || 'Geçersiz veya süresi dolmuş token.');
    }

    // Sync/retrieve user record in local PostgreSQL database
    let localUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!localUser) {
      localUser = await this.prisma.user.create({
        data: {
          id: user.id,
          email: user.email || '',
          displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          role: 'STREAMER',
        },
      });
    }

    request.user = localUser;
    return true;
  }
}
