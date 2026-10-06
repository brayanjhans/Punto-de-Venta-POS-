import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import BottomSheet from '@gorhom/bottom-sheet';

interface Presentation {
  id: string;
  type: 'UNIT' | 'HALF' | 'PACKAGE';
  name: string;
  price: number;
  quantity_multiplier: number;
}

interface CartItem {
  id: string;
  productName: string;
  selectedPresentation: Presentation;
  presentations: Presentation[];
  quantity: number;
}

const mockProducts = [
  {
    id: 'prod_1',
    barcode: '123456',
    name: 'Alfajor Triple',
    presentations: [
      { id: 'pres_1', type: 'UNIT', name: 'Unidad', price: 1.5, quantity_multiplier: 1 },
      { id: 'pres_2', type: 'HALF', name: 'Medio (12 un)', price: 16.0, quantity_multiplier: 12 },
      { id: 'pres_3', type: 'PACKAGE', name: 'Caja (24 un)', price: 30.0, quantity_multiplier: 24 },
    ] as Presentation[]
  }
];

export const POSScreen = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCartItem, setSelectedCartItem] = useState<CartItem | null>(null);
  
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['30%', '50%'], []);

  const handleScan = useCallback((barcode: string) => {
    // 1. Find product
    const product = mockProducts.find(p => p.barcode === barcode);
    if (!product) {
      Alert.alert("Aviso", `Producto no encontrado: ${barcode}`);
      return;
    }

    // 2. Add as UNIT by default
    const unitPresentation = product.presentations.find(p => p.type === 'UNIT') || product.presentations[0];
    
    setCart(prev => {
      // Check if already in cart with same presentation
      const existing = prev.find(item => item.id === product.id && item.selectedPresentation.id === unitPresentation.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id && item.selectedPresentation.id === unitPresentation.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: product.id,
        productName: product.name,
        selectedPresentation: unitPresentation,
        presentations: product.presentations,
        quantity: 1
      }];
    });
  }, []);

  useBarcodeScanner(handleScan);

  const total = cart.reduce((acc, item) => acc + (item.selectedPresentation.price * item.quantity), 0);

  const openPresentationModal = (item: CartItem) => {
    setSelectedCartItem(item);
    bottomSheetRef.current?.expand();
  };

  const changePresentation = (presentation: Presentation) => {
    if (!selectedCartItem) return;
    
    setCart(prev => prev.map(item => 
      item.id === selectedCartItem.id ? { ...item, selectedPresentation: presentation } : item
    ));
    bottomSheetRef.current?.close();
  };

  return (
    <View className="flex-1 bg-gray-100 pt-10">
      {/* Header */}
      <View className="p-4 bg-blue-600 shadow-md">
        <Text className="text-white text-2xl font-bold">POS Movil - Pre-Venta</Text>
        <Text className="text-blue-100">Escanea un codigo (Ej: 123456)</Text>
      </View>

      {/* Cart List */}
      <FlatList
        data={cart}
        keyExtractor={(item, index) => `${item.id}-${item.selectedPresentation.id}-${index}`}
        className="flex-1 p-4"
        ListEmptyComponent={<Text className="text-gray-500 text-center mt-10">Carrito vacio. Escanea un producto.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => openPresentationModal(item)}
            className="bg-white p-4 mb-3 rounded-xl shadow-sm flex-row justify-between items-center"
          >
            <View>
              <Text className="text-lg font-bold text-gray-800">{item.productName}</Text>
              <Text className="text-sm text-blue-500 font-semibold">{item.selectedPresentation.name} (Toque para cambiar)</Text>
            </View>
            <View className="items-end">
              <Text className="text-lg font-bold">${(item.selectedPresentation.price * item.quantity).toFixed(2)}</Text>
              <Text className="text-gray-500 text-xs font-bold">Cant: {item.quantity}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Footer Total */}
      <View className="p-6 bg-white border-t border-gray-200">
        <View className="flex-row justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-800">Total:</Text>
          <Text className="text-3xl font-black text-green-600">${total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity 
          className="bg-green-500 py-4 rounded-xl items-center shadow-lg"
          onPress={() => Alert.alert("Ticket", "Generando Ticket Termico y QR...")}
        >
          <Text className="text-white text-xl font-bold">Finalizar Pre-Venta</Text>
        </TouchableOpacity>
      </View>

      {/* Presentation Modal */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
      >
        <View className="p-5 flex-1 bg-white">
          <Text className="text-xl font-bold mb-4 text-gray-800">Seleccionar Presentación</Text>
          {selectedCartItem?.presentations.map(pres => (
            <TouchableOpacity
              key={pres.id}
              onPress={() => changePresentation(pres)}
              className="py-4 border-b border-gray-100 flex-row justify-between items-center"
            >
              <Text className="text-lg text-gray-700">{pres.name}</Text>
              <Text className="text-lg font-bold text-blue-600">${pres.price.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>
    </View>
  );
};
