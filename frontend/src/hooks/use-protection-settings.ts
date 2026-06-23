import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { protectionService } from '../services/api-services';
import type { ProtectionSettings } from '../types/api';

export function useProtectionSettings(channelId: string | undefined) {
  return useQuery({
    queryKey: ['protection-settings', channelId],
    queryFn: () => protectionService.getSettings(channelId!),
    enabled: !!channelId,
  });
}

export function useUpdateProtectionSettings(channelId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ProtectionSettings>) =>
      protectionService.updateSettings(channelId!, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['protection-settings', channelId], updated);
    },
  });
}
