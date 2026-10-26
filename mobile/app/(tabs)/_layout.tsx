import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { colors, fonts } from '@/theme';

type Icon = ComponentProps<typeof Feather>['name'];
const icon =
  (name: Icon) =>
  ({ color, size }: { color: string; size: number }) => <Feather name={name} size={size - 2} color={color} />;

// Five tabs, following the Atlas loop: problems → map → startups → jobs → you.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.ink3,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Problems', tabBarIcon: icon('list') }} />
      <Tabs.Screen name="atlas" options={{ title: 'Atlas', tabBarIcon: icon('globe') }} />
      <Tabs.Screen name="startups" options={{ title: 'Startups', tabBarIcon: icon('trending-up') }} />
      <Tabs.Screen name="jobs" options={{ title: 'Jobs', tabBarIcon: icon('briefcase') }} />
      <Tabs.Screen name="me" options={{ title: 'My Atlas', tabBarIcon: icon('user') }} />
    </Tabs>
  );
}
