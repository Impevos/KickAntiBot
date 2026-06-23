import { useQuery } from '@tanstack/react-query';
import {
  riskScoresService,
  suspiciousUsersService,
} from '../services/api-services';

export function useSuspiciousUserDetail(id: string | null) {
  return useQuery({
    queryKey: ['suspicious-users', 'detail', id],
    queryFn: () => suspiciousUsersService.getById(id!),
    enabled: !!id,
  });
}

export function useRiskScores(suspiciousUserId: string | null) {
  return useQuery({
    queryKey: ['risk-scores', suspiciousUserId],
    queryFn: () => riskScoresService.getHistory(suspiciousUserId!),
    enabled: !!suspiciousUserId,
  });
}
