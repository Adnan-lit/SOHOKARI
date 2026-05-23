import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons }                 from '@expo/vector-icons';
import { useSafeAreaInsets }        from 'react-native-safe-area-context';
import { Colors }                   from '@theme/colors';
import type { ProviderTabParamList } from '@app-types/navigation.types';

import ProviderDashboardScreen from '@screens/profile/ProviderDashboardScreen';
import BookingsListScreen      from '@screens/bookings/BookingsListScreen';
import ChatListScreen          from '@screens/chat/ChatListScreen';
import NotificationsScreen     from '@screens/profile/NotificationsScreen';
import MyProviderProfileTab    from '@screens/providers/MyProviderProfileTab';

const Tab = createBottomTabNavigator<ProviderTabParamList>();
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, [IconName, IconName]> = {
  Dashboard:     ['grid',          'grid-outline'          ],
  MyBookings:    ['calendar',      'calendar-outline'      ],
  Chat:          ['chatbubbles',   'chatbubbles-outline'   ],
  Notifications: ['notifications', 'notifications-outline' ],
  Profile:       ['person',        'person-outline'        ],
};

export default function ProviderNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const [active, inactive] = TAB_ICONS[route.name] ?? ['ellipse', 'ellipse-outline'];
          return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
        },
        tabBarActiveTintColor:   Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor:  Colors.border,
          borderTopWidth:  0.5,
          height:          56 + insets.bottom,
          paddingBottom:   insets.bottom,
          paddingTop:      6,
        },
        tabBarLabelStyle: { fontSize: 11, marginBottom: 2 },
        headerStyle:      { backgroundColor: Colors.primary },
        headerTintColor:  Colors.white,
        headerTitleStyle: { fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Dashboard"     component={ProviderDashboardScreen} options={{ title: 'Dashboard'    }} />
      <Tab.Screen name="MyBookings"    component={BookingsListScreen}      options={{ title: 'My Bookings'  }} />
      <Tab.Screen name="Chat"          component={ChatListScreen}          options={{ title: 'Messages'     }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen}     options={{ title: 'Notifications'}} />
      <Tab.Screen name="Profile"       component={MyProviderProfileTab}    options={{ title: 'My Profile'   }} />
    </Tab.Navigator>
  );
}