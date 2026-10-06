import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import KeyEvent from 'react-native-keyevent';

export const useBarcodeScanner = (onScan: (barcode: string) => void) => {
  const barcodeBuffer = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Protección para Expo Go (donde KeyEvent no está disponible nativamente)
    if (!KeyEvent || !KeyEvent.onKeyDownListener) {
      console.warn("KeyEvent módulo nativo no está disponible. Estás usando Expo Go o web. El lector de código físico requiere el APK compilado.");
      return;
    }

    const listener = KeyEvent.onKeyDownListener((keyEvent: { pressedKey: string, keyCode: number }) => {
      if (keyEvent.keyCode === 66 || keyEvent.pressedKey === '\n' || keyEvent.pressedKey === '\r') {
        if (barcodeBuffer.current.length > 0) {
          onScan(barcodeBuffer.current.trim());
          barcodeBuffer.current = '';
        }
      } else {
        if (keyEvent.pressedKey && keyEvent.pressedKey.length === 1) {
          barcodeBuffer.current += keyEvent.pressedKey;
        }
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          barcodeBuffer.current = '';
        }, 300);
      }
    });

    return () => {
      if (KeyEvent && KeyEvent.removeKeyDownListener) {
        KeyEvent.removeKeyDownListener();
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onScan]);
};
