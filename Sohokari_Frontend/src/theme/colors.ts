export const Colors = {
  // Premium Deep Blue-Grey Primary
  primary:     '#0F172A',
  primaryLight:'#1E293B',
  // Vibrant Emerald Green for accents/CTAs
  accent:      '#10B981',
  accentLight: '#34D399',

  background:  '#F8FAFC',
  surface:     '#FFFFFF',
  border:      '#E2E8F0',

  text:          '#0F172A',
  textSecondary: '#475569',
  textMuted:     '#94A3B8',

  success: '#1D9E75',
  warning: '#EF9F27',
  error:   '#E24B4A',
  info:    '#378ADD',

  white: '#FFFFFF',
  black: '#000000',

  statusRequested:  '#EF9F27',
  statusAccepted:   '#378ADD',
  statusInProgress: '#8B5CF6',
  statusCompleted:  '#1D9E75',
  statusCancelled:  '#9CA3AF',
  statusRejected:   '#E24B4A',
} as const;

export const statusColor = (status: string): string => {
  const map: Record<string, string> = {
    REQUESTED:   Colors.statusRequested,
    ACCEPTED:    Colors.statusAccepted,
    IN_PROGRESS: Colors.statusInProgress,
    COMPLETED:   Colors.statusCompleted,
    CANCELLED:   Colors.statusCancelled,
    REJECTED:    Colors.statusRejected,
  };
  return map[status] ?? Colors.textMuted;
};