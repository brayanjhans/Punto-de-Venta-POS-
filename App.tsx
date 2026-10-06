import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { POSScreen } from './src/screens/POSScreen';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <POSScreen />
    </GestureHandlerRootView>
  );
}
