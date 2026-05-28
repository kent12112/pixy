import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '@/constants';

/**
 * Root index — shown briefly while AuthGate checks the session
 * and redirects to either (auth)/welcome or the appropriate home tab.
 */
export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}
