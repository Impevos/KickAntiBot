import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertsService } from '../services/api-services';

export function useAlerts(channelId: string | undefined, isRead?: boolean) {
  return useQuery({
    queryKey: ['alerts', channelId, isRead],
    queryFn: () =>
      alertsService.getAlerts({
        channelId: channelId!,
        isRead,
        limit: 20,
      }),
    enabled: !!channelId,
  });
}

export function useMarkAlertRead(channelId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => alertsService.markAsRead(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts', channelId] });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'summary', channelId],
      });
    },
  });
}
