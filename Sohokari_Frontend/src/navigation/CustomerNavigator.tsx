import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons }                 from '@expo/vector-icons';
import { useSafeAreaInsets }        from 'react-native-safe-area-context';
import { Colors }                   from '@theme/colors';
import type { CustomerTabParamList } from '@app-types/navigation.types';

import HomeScreen            from '@screens/home/HomeScreen';
import BookingsListScreen    from '@screens/bookings/BookingsListScreen';
import ChatListScreen        from '@screens/chat/ChatListScreen';
import NotificationsScreen   from '@screens/profile/NotificationsScreen';
import CustomerProfileScreen from '@screens/profile/CustomerProfileScreen';

const Tab = createBottomTabNavigator<CustomerTabParamList>();
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, [IconName, IconName]> = {
  Home:          ['home',          'home-outline'          ],
  Bookings:      ['calendar',      'calendar-outline'      ],
  Chat:          ['chatbubbles',   'chatbubbles-outline'   ],
  Notifications: ['notifications', 'notifications-outline' ],
  Profile:       ['person',        'person-outline'        ],
};

export default function CustomerNavigator() {
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
      <Tab.Screen name="Home"          component={HomeScreen}            options={{ title: 'Sohokari'      }} />
      <Tab.Screen name="Bookings"      component={BookingsListScreen}    options={{ title: 'My Bookings'   }} />
      <Tab.Screen name="Chat"          component={ChatListScreen}        options={{ title: 'Messages'      }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen}   options={{ title: 'Notifications' }} />
      <Tab.Screen name="Profile"       component={CustomerProfileScreen} options={{ title: 'My Profile'    }} />
    </Tab.Navigator>
  );
}