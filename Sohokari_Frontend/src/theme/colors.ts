export const Colors = {
  primary:     '#1B3A5C',
  primaryLight:'#2A5298',
  accent:      '#1D9E75',
  accentLight: '#5DCAA5',

  background:  '#F4F7FB',
  surface:     '#FFFFFF',
  border:      '#C5CDD8',

  text:          '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted:     '#9CA3AF',

  success: '#1D9E75',
  warning: '#EF9F27',
  error:   '#E24B4A',
  info:    '#378ADD',

  white: '#FFFFFF',
  black: '#000000',

  statusPending:    '#EF9F27',
  statusAccepted:   '#378ADD',
  statusInProgress: '#8B5CF6',
  statusCompleted:  '#1D9E75',
  statusCancelled:  '#9CA3AF',
  statusRejected:   '#E24B4A',
} as const;

export const statusColor = (status: string): string => {
  const map: Record<string, string> = {
    PENDING:     Colors.statusPending,
    ACCEPTED:    Colors.statusAccepted,
    IN_PROGRESS: Colors.statusInProgress,
    COMPLETED:   Colors.statusCompleted,
    CANCELLED:   Colors.statusCancelled,
    REJECTED:    Colors.statusRejected,
  };
  return map[status] ?? Colors.textMuted;
};