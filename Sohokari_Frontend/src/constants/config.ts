export const BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://sohokari-backend.onrender.com';

export const WS_URL =
  process.env.EXPO_PUBLIC_WS_URL ?? 'wss://sohokari-backend.onrender.com/ws';

export const API_TIMEOUT = 15000;

// ✅ Matches backend ServiceCategory enum exactly
export type ServiceCategory =
  | 'ELECTRICIAN'
  | 'PLUMBER'
  | 'CLEANER'
  | 'BUA'
  | 'AC_CLEANER'
  | 'REPAIRMAN'
  | 'TECHNICIAN'
  | 'OTHER';

export const SERVICE_CATEGORIES: { key: ServiceCategory; label: string; icon: string }[] = [
  { key: 'ELECTRICIAN', label: 'Electrician', icon: 'flash-outline'        },
  { key: 'PLUMBER',     label: 'Plumber',     icon: 'water-outline'        },
  { key: 'CLEANER',     label: 'Cleaner',     icon: 'sparkles-outline'     },
  { key: 'BUA',         label: 'House Maid',  icon: 'home-outline'         },
  { key: 'AC_CLEANER',  label: 'AC Service',  icon: 'snow-outline'         },
  { key: 'REPAIRMAN',   label: 'Repairman',   icon: 'build-outline'        },
  { key: 'TECHNICIAN',  label: 'Technician',  icon: 'hardware-chip-outline'},
  { key: 'OTHER',       label: 'Other',       icon: 'ellipsis-horizontal-outline' },
];

// ✅ Matches backend BookingStatus enum exactly
export type BookingStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REVIEWED'
  | 'REJECTED'
  | 'CANCELLED';

export const BOOKING_STATUSES: BookingStatus[] = [
  'REQUESTED',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'REVIEWED',
  'REJECTED',
  'CANCELLED',
];

export const DEFAULT_LOCATION = {
  latitude:       23.8103,
  longitude:      90.4125,
  latitudeDelta:  0.05,
  longitudeDelta: 0.05,
};

export const NEARBY_RADIUS_KM = 10;