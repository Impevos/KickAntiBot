import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { RiskScoresService } from './risk-scores.service';
import { CreateRiskScoreDto } from './dto/create-risk-score.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('api/risk-scores')
@UseGuards(JwtAuthGuard)
export class RiskScoresController {
  constructor(private readonly riskScoresService: RiskScoresService) {}

  @Post()
  async create(@GetUser() user: User, @Body() createRiskScoreDto: CreateRiskScoreDto) {
    return this.riskScoresService.create(user, createRiskScoreDto);
  }

  @Get(':suspiciousUserId')
  async findBySuspiciousUser(
    @Param('suspiciousUserId') suspiciousUserId: string,
    @GetUser() user: User,
  ) {
    return this.riskScoresService.findBySuspiciousUser(suspiciousUserId, user);
  }
}
