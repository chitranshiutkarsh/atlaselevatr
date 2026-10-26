import { router, Stack } from 'expo-router';
import { View } from 'react-native';
import { Body, Button, Display } from '@/components/ui';
import { space } from '@/theme';

export default function NotFound() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md }}>
      <Stack.Screen options={{ title: '' }} />
      <Display size={24}>Off the map</Display>
      <Body muted style={{ textAlign: 'center' }}>That page doesn't exist in the app.</Body>
      <Button title="Go to problems" onPress={() => router.replace('/')} />
    </View>
  );
}
