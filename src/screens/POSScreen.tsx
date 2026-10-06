import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Modal } from 'react-native';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
// import QRCode from 'react-native-qrcode-svg'; // Se activará cuando hagamos el Paso 4 visual

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
  const [modalVisible, setModalVisible] = useState(false);

  const handleScan = useCallback((barcode: string) => {
    const product = mockProducts.find(p => p.barcode === barcode);
    if (!product) {
      Alert.alert("Aviso", `Producto no encontrado: ${barcode}`);
      return;
    }

    const unitPresentation = product.presentations.find(p => p.type === 'UNIT') || product.presentations[0];
    
    setCart(prev => {
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
    setModalVisible(true);
  };

  const changePresentation = (presentation: Presentation) => {
    if (!selectedCartItem) return;
    setCart(prev => prev.map(item => 
      item.id === selectedCartItem.id ? { ...item, selectedPresentation: presentation } : item
    ));
    setModalVisible(false);
  };

  const handleGenerarTicket = () => {
    if (cart.length === 0) {
      Alert.alert("Aviso", "El carrito está vacío");
      return;
    }
    const pedidoId = `PED-${Math.floor(1000 + Math.random() * 9000)}`;
    
    let ticketTexto = "--- COMERCIAL GOLOSINAS ---\n";
    ticketTexto += `Pedido: ${pedidoId}\n`;
    ticketTexto += "---------------------------\n";
    
    cart.forEach(item => {
      const nombreCorto = item.productName.substring(0, 15);
      const subtotal = (item.selectedPresentation.price * item.quantity).toFixed(2);
      ticketTexto += `${item.quantity}x ${nombreCorto} ... $${subtotal}\n`;
    });
    
    ticketTexto += "---------------------------\n";
    ticketTexto += `TOTAL: $${total.toFixed(2)}\n`;
    ticketTexto += "¡Gracias por su compra!\n\n";

    console.log(ticketTexto);

    Alert.alert(
      "Ticket Generado: " + pedidoId, 
      "Envíe al cliente a la caja con este código."
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>POS Movil - Pre-Venta</Text>
        <Text style={styles.headerSubtitle}>Escanea un codigo (Ej: 123456)</Text>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item, index) => `${item.id}-${item.selectedPresentation.id}-${index}`}
        style={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>Carrito vacio. Escanea un producto.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => openPresentationModal(item)}
            style={styles.cartItem}
          >
            <View>
              <Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.itemPres}>{item.selectedPresentation.name} (Toque para cambiar)</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.itemTotal}>${(item.selectedPresentation.price * item.quantity).toFixed(2)}</Text>
              <Text style={styles.itemQty}>Cant: {item.quantity}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.btnTicket} onPress={handleGenerarTicket}>
          <Text style={styles.btnTicketText}>Generar Ticket (Paso 4)</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Presentación</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
            {selectedCartItem?.presentations.map(pres => (
              <TouchableOpacity key={pres.id} onPress={() => changePresentation(pres)} style={styles.presOption}>
                <Text style={styles.presName}>{pres.name}</Text>
                <Text style={styles.presPrice}>${pres.price.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', paddingTop: 40 },
  header: { padding: 16, backgroundColor: '#2563eb' },
  headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: '#bfdbfe', fontSize: 14 },
  list: { flex: 1, padding: 16 },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 40 },
  cartItem: { backgroundColor: 'white', padding: 16, marginBottom: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  itemName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  itemPres: { fontSize: 14, color: '#3b82f6', fontWeight: '600' },
  itemTotal: { fontSize: 18, fontWeight: 'bold' },
  itemQty: { fontSize: 12, color: '#6b7280', fontWeight: 'bold' },
  footer: { padding: 24, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#e5e7eb' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  totalLabel: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  totalValue: { fontSize: 28, fontWeight: '900', color: '#16a34a' },
  btnTicket: { backgroundColor: '#22c55e', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnTicketText: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, minHeight: 300 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  modalCloseText: { fontSize: 16, color: '#ef4444', fontWeight: 'bold' },
  presOption: { paddingVertical: 16, borderBottomWidth: 1, borderColor: '#f3f4f6', flexDirection: 'row', justifyContent: 'space-between' },
  presName: { fontSize: 18, color: '#374151' },
  presPrice: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' }
});
