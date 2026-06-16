/**
 * Lightweight i18n system for Sohokari.
 * Supports English (en) and Bengali (bn).
 * No external dependencies (no i18next needed).
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Locale = 'en' | 'bn';

// ─── Translation Dictionaries ─────────────────────────────────────────
const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Common
    'app.name':            'Sohokari',
    'common.save':         'Save Changes',
    'common.cancel':       'Cancel',
    'common.confirm':      'Confirm',
    'common.back':         'Back',
    'common.loading':      'Loading...',
    'common.search':       'Search',
    'common.logout':       'Logout',
    'common.submit':       'Submit',
    'common.delete':       'Delete',
    'common.edit':         'Edit',

    // Home
    'home.greeting':       'Hello',
    'home.subGreeting':    'Find trusted services near you',
    'home.searchPlaceholder': 'Search electrician, plumber…',
    'home.categories':     'Categories',
    'home.nearbyProviders':'Nearby Providers',
    'home.aiAssistant':    '🤖 AI Assistant',
    'home.aiDescription':  'Describe your problem in Bangla or English',
    'home.updateLocation': 'Update location',

    // Auth
    'auth.login':          'Sign In',
    'auth.register':       'Create Account',
    'auth.loginTitle':     'Welcome back',
    'auth.loginSubtitle':  'Sign in to your account',
    'auth.registerTitle':  'Create account',
    'auth.registerCustomerSub': 'Sign up as a customer',
    'auth.registerProviderSub': 'Sign up as a service provider',
    'auth.fullName':       'Full Name',
    'auth.email':          'Email',
    'auth.phone':          'Phone Number',
    'auth.password':       'Password',
    'auth.confirmPassword':'Confirm Password',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.noAccount':      "Don't have an account?",
    'auth.registerAsProvider': 'Register as Provider',
    'auth.registerAsCustomer': 'Register as Customer',

    // Bookings
    'bookings.title':      'Bookings',
    'bookings.noBookings': 'No bookings yet',
    'bookings.yourBookings':'Your bookings will appear here',
    'bookings.accept':     'Accept',
    'bookings.reject':     'Reject',
    'bookings.startService':'Start Service',
    'bookings.markComplete':'Mark Complete',
    'bookings.cancelBooking':'Cancel Booking',
    'bookings.leaveReview': 'Leave a Review',
    'bookings.messageProvider': 'Message Provider',

    // Payment
    'payment.title':       'Payment / Invoice',
    'payment.totalAmount': 'Total Amount',
    'payment.method':      'Payment Method',
    'payment.pending':     'Pending',
    'payment.confirmed':   'Confirmed',
    'payment.confirmBtn':  'Confirm Payment Received',
    'payment.confirmHint': 'Only confirm after you have received the full payment',
    'payment.completed':   'Payment completed successfully',
    'payment.noPayment':   'No payment record found',
    'payment.cash':        'Cash',

    // Profile
    'profile.title':       'Profile',
    'profile.editProfile': 'Edit Profile',
    'profile.settings':    'Settings',
    'profile.language':    'Language',
    'profile.totalBookings':'Total Bookings',
    'profile.memberSince': 'Member since',

    // Notifications
    'notif.title':         'Notifications',
    'notif.markAllRead':   'Mark all read',
    'notif.empty':         'All caught up!',
    'notif.emptySubtext':  'No notifications right now',

    // Map
    'map.searchArea':      'Search this area',
    'map.nearby':          'providers nearby',
    'map.noProviders':     'No providers in this area',
    'map.tryPanning':      'Try panning the map or changing filters',
    'map.filters':         'Filters',
    'map.minRating':       'Min Rating',
    'map.maxRate':         'Max Rate',
    'map.radius':          'Radius',
    'map.clearAll':        'Clear All',

    // Categories
    'cat.ELECTRICIAN':     'Electrician',
    'cat.PLUMBER':         'Plumber',
    'cat.CLEANER':         'Cleaner',
    'cat.BUA':             'Bua',
    'cat.AC_CLEANER':      'AC Cleaner',
    'cat.REPAIRMAN':       'Repairman',
    'cat.TECHNICIAN':      'Technician',
    'cat.OTHER':           'Other',

    // Provider
    'provider.available':  'Available',
    'provider.busy':       'Busy',
    'provider.hourlyRate': '/hr',
    'provider.reviews':    'reviews',
    'provider.bookNow':    'Book Now',
  },

  bn: {
    // Common
    'app.name':            'সহকারী',
    'common.save':         'সেভ করুন',
    'common.cancel':       'বাতিল',
    'common.confirm':      'নিশ্চিত',
    'common.back':         'পেছনে',
    'common.loading':      'লোড হচ্ছে...',
    'common.search':       'খুঁজুন',
    'common.logout':       'লগআউট',
    'common.submit':       'জমা দিন',
    'common.delete':       'মুছুন',
    'common.edit':         'সম্পাদনা',

    // Home
    'home.greeting':       'হ্যালো',
    'home.subGreeting':    'আপনার কাছের বিশ্বস্ত সেবা খুঁজুন',
    'home.searchPlaceholder': 'ইলেকট্রিশিয়ান, প্লাম্বার খুঁজুন…',
    'home.categories':     'ক্যাটাগরি',
    'home.nearbyProviders':'কাছের সেবাদাতা',
    'home.aiAssistant':    '🤖 AI সহকারী',
    'home.aiDescription':  'আপনার সমস্যা বাংলা বা ইংরেজিতে বলুন',
    'home.updateLocation': 'লোকেশন আপডেট',

    // Auth
    'auth.login':          'লগইন',
    'auth.register':       'অ্যাকাউন্ট তৈরি',
    'auth.loginTitle':     'স্বাগতম',
    'auth.loginSubtitle':  'আপনার অ্যাকাউন্টে সাইন ইন করুন',
    'auth.registerTitle':  'অ্যাকাউন্ট তৈরি করুন',
    'auth.registerCustomerSub': 'কাস্টমার হিসেবে সাইন আপ',
    'auth.registerProviderSub': 'সেবাদাতা হিসেবে সাইন আপ',
    'auth.fullName':       'পূর্ণ নাম',
    'auth.email':          'ইমেইল',
    'auth.phone':          'ফোন নম্বর',
    'auth.password':       'পাসওয়ার্ড',
    'auth.confirmPassword':'পাসওয়ার্ড নিশ্চিত করুন',
    'auth.alreadyHaveAccount': 'ইতিমধ্যে অ্যাকাউন্ট আছে?',
    'auth.noAccount':      'অ্যাকাউন্ট নেই?',
    'auth.registerAsProvider': 'সেবাদাতা হিসেবে নিবন্ধন',
    'auth.registerAsCustomer': 'কাস্টমার হিসেবে নিবন্ধন',

    // Bookings
    'bookings.title':      'বুকিংস',
    'bookings.noBookings': 'কোনো বুকিং নেই',
    'bookings.yourBookings':'আপনার বুকিংগুলো এখানে দেখা যাবে',
    'bookings.accept':     'গ্রহণ',
    'bookings.reject':     'প্রত্যাখ্যান',
    'bookings.startService':'সেবা শুরু',
    'bookings.markComplete':'সম্পন্ন',
    'bookings.cancelBooking':'বুকিং বাতিল',
    'bookings.leaveReview': 'রিভিউ দিন',
    'bookings.messageProvider': 'মেসেজ পাঠান',

    // Payment
    'payment.title':       'পেমেন্ট / ইনভয়েস',
    'payment.totalAmount': 'মোট পরিমাণ',
    'payment.method':      'পেমেন্ট পদ্ধতি',
    'payment.pending':     'অপেক্ষমাণ',
    'payment.confirmed':   'নিশ্চিত',
    'payment.confirmBtn':  'পেমেন্ট গ্রহণ নিশ্চিত করুন',
    'payment.confirmHint': 'সম্পূর্ণ পেমেন্ট পাওয়ার পরই নিশ্চিত করুন',
    'payment.completed':   'পেমেন্ট সফলভাবে সম্পন্ন',
    'payment.noPayment':   'কোনো পেমেন্ট রেকর্ড নেই',
    'payment.cash':        'নগদ',

    // Profile
    'profile.title':       'প্রোফাইল',
    'profile.editProfile': 'প্রোফাইল সম্পাদনা',
    'profile.settings':    'সেটিংস',
    'profile.language':    'ভাষা',
    'profile.totalBookings':'মোট বুকিং',
    'profile.memberSince': 'সদস্য হয়েছেন',

    // Notifications
    'notif.title':         'নোটিফিকেশন',
    'notif.markAllRead':   'সব পড়া হয়েছে',
    'notif.empty':         'সব ধরা আছে!',
    'notif.emptySubtext':  'এখন কোনো নোটিফিকেশন নেই',

    // Map
    'map.searchArea':      'এই এলাকায় খুঁজুন',
    'map.nearby':          'জন কাছে আছেন',
    'map.noProviders':     'এই এলাকায় কোনো সেবাদাতা নেই',
    'map.tryPanning':      'মানচিত্রে সরান অথবা ফিল্টার পরিবর্তন করুন',
    'map.filters':         'ফিল্টার',
    'map.minRating':       'সর্বনিম্ন রেটিং',
    'map.maxRate':         'সর্বোচ্চ রেট',
    'map.radius':          'ব্যাসার্ধ',
    'map.clearAll':        'সব সাফ',

    // Categories
    'cat.ELECTRICIAN':     'ইলেকট্রিশিয়ান',
    'cat.PLUMBER':         'প্লাম্বার',
    'cat.CLEANER':         'ক্লিনার',
    'cat.BUA':             'বুয়া',
    'cat.AC_CLEANER':      'এসি ক্লিনার',
    'cat.REPAIRMAN':       'মেরামতকারী',
    'cat.TECHNICIAN':      'টেকনিশিয়ান',
    'cat.OTHER':           'অন্যান্য',

    // Provider
    'provider.available':  'উপলব্ধ',
    'provider.busy':       'ব্যস্ত',
    'provider.hourlyRate': '/ঘন্টা',
    'provider.reviews':    'রিভিউ',
    'provider.bookNow':    'বুক করুন',
  },
};

// ─── Store ────────────────────────────────────────────────────────────
type I18nState = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string) => string;
};

const LOCALE_KEY = 'sohokari_locale';

export const useI18n = create<I18nState>((set, get) => ({
  locale: 'en',

  setLocale: async (locale: Locale) => {
    set({ locale });
    await AsyncStorage.setItem(LOCALE_KEY, locale);
  },

  t: (key: string): string => {
    const { locale } = get();
    return translations[locale]?.[key] ?? translations.en[key] ?? key;
  },
}));

// Hydrate on import
AsyncStorage.getItem(LOCALE_KEY).then((saved) => {
  if (saved === 'bn' || saved === 'en') {
    useI18n.setState({ locale: saved });
  }
}).catch(() => {});

// ─── Formatting Utilities (I16) ──────────────────────────────────────
/**
 * Format amount in BDT with proper thousands separator.
 * formatBDT(1500) → "৳1,500"
 * formatBDT(25000) → "৳25,000"
 */
export function formatBDT(amount: number | undefined | null): string {
  if (amount == null) return '৳0';
  return '৳' + amount.toLocaleString('en-IN');
}
