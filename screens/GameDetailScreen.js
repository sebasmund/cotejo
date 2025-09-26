import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'react-native-elements';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const GameDetailScreen = ({ route }) => {
  const { game: initialGame = {} } = route.params || {};
  const [game, setGame] = useState(initialGame);
  const [isUserJoined, setIsUserJoined] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [payVisible, setPayVisible] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const navigation = useNavigation();
  const userId = auth.currentUser?.uid;

  // Verificar si el usuario está inscrito y si es el creador
  useEffect(() => {
    if (!initialGame?.id) return;

    const load = async () => {
      const ref = doc(db, 'games', initialGame.id);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        const joinedUsers = data.joinedUsers || [];
        setIsUserJoined(!!userId && joinedUsers.includes(userId));
        setIsCreator(!!userId && data.creatorId === userId);
        setGame(prev => ({ ...prev, ...data, id: initialGame.id }));
      } else {
        Alert.alert('Aviso', 'El partido ya no existe.', [{ text: 'OK', onPress: () => navigation.popToTop() }]);
      }
    };

    load();
  }, [initialGame?.id, userId]);

  // --- Pago y unión ---
  const openPayment = () => {
    if (!userId) {
      Alert.alert('Error', 'Debes iniciar sesión para unirte a un partido.');
      return;
    }
    if (isUserJoined) {
      Alert.alert('Aviso', 'Ya estás inscrito en este partido.');
      return;
    }
    setPayAmount('');
    setPayVisible(true);
  };

  const cents = (n) => Math.round(Number(n) * 100);

  const processPaymentAndJoin = async () => {
    // Validaciones de monto exacto
    const price = Number(game.price);
    const entered = Number(payAmount);

    if (Number.isNaN(entered)) {
      Alert.alert('Monto inválido', 'Ingresa un número válido (ej: 15000 o 15000.00).');
      return;
    }

    if (cents(entered) !== cents(price)) {
      Alert.alert('Monto incorrecto', `El pago debe ser exactamente $${price}.`);
      return;
    }

    setPaying(true);
    const gameRef = doc(db, 'games', game.id);

    try {
      const snap = await getDoc(gameRef);
      if (!snap.exists()) {
        setPaying(false);
        setPayVisible(false);
        Alert.alert('Error', 'El partido no existe o fue eliminado.');
        return;
      }

      const data = snap.data();
      const joinedUsers = data.joinedUsers || [];

      if (joinedUsers.includes(userId)) {
        setPaying(false);
        setPayVisible(false);
        Alert.alert('Aviso', 'Ya estabas inscrito en este partido.');
        return;
      }

      if ((data.slots ?? 0) <= 0) {
        setPaying(false);
        setPayVisible(false);
        Alert.alert('Sin cupos', 'Lo sentimos, ya no hay cupos disponibles.');
        return;
      }

      // "Pago" correcto -> unirse
      await updateDoc(gameRef, {
        slots: (data.slots ?? 0) - 1,
        joinedUsers: arrayUnion(userId),
      });

      // Estado local
      setIsUserJoined(true);
      setGame(prev => ({ ...prev, slots: (prev.slots ?? data.slots) - 1 }));

      // Cerrar modal de pago y abrir confirmación
      setPaying(false);
      setPayVisible(false);
      setSuccessVisible(true);
    } catch (e) {
      console.error('Error en pago/unión:', e);
      setPaying(false);
      setPayVisible(false);
      Alert.alert('Error', 'No se pudo completar la acción.');
    }
  };

  const handleLeaveGame = async () => {
    if (!userId) {
      Alert.alert('Error', 'Debes iniciar sesión para desinscribirte de un partido.');
      return;
    }
    const gameRef = doc(db, 'games', game.id);

    try {
      const snap = await getDoc(gameRef);
      if (!snap.exists()) {
        Alert.alert('Error', 'El partido no existe o ha sido eliminado.');
        return;
      }

      const data = snap.data();
      const joinedUsers = data.joinedUsers || [];

      if (!joinedUsers.includes(userId)) {
        Alert.alert('Error', 'No estás inscrito en este partido.');
        return;
      }

      await updateDoc(gameRef, {
        slots: (data.slots ?? 0) + 1,
        joinedUsers: arrayRemove(userId),
      });

      Alert.alert('Listo', 'Te desinscribiste del partido.');
      setIsUserJoined(false);
      setGame(prev => ({ ...prev, slots: (prev.slots ?? data.slots) + 1 }));
    } catch (error) {
      console.error('Error al desinscribirse del juego:', error);
      Alert.alert('Error', 'Hubo un problema al desinscribirse del juego.');
    }
  };

  // Cancelar partido (solo creador)
  const cancelGame = async () => {
    Alert.alert(
      'Cancelar partido',
      '¿Estás seguro de que deseas eliminar este partido?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'games', game.id));
              Alert.alert(
                'Partido cancelado',
                'El partido fue eliminado.',
                [{ text: 'OK', onPress: () => navigation.popToTop() }],
                { cancelable: true }
              );
            } catch (error) {
              console.error('Error al cancelar partido:', error);
              Alert.alert('Error', 'No se pudo eliminar el partido.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const formatDate = (dateTime) => (!dateTime ? 'Fecha no disponible' : moment(dateTime.toDate()).format('MMMM D'));
  const formatTime = (dateTime) => (!dateTime ? 'Hora no disponible' : moment(dateTime.toDate()).format('h:mm A'));
  const goHome = () => navigation.popToTop();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={styles.title}>{game.title}</Text>
        <Text style={styles.description}>{game.description || 'Sin descripción'}</Text>

        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#555" />
          <Text style={styles.detailText}>{game.address}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#555" />
          <Text style={styles.detailText}>{formatDate(game.dateTime)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#555" />
          <Text style={styles.detailText}>{formatTime(game.dateTime)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people" size={16} color="#555" />
          <Text style={styles.detailText}>{game.players || 'Sin jugadores'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="grid" size={16} color="#555" />
          <Text style={styles.detailText}>Cupos disponibles: {game.slots ?? 'No disponible'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#555" />
          <Text style={styles.detailText}>Precio: ${game.price}</Text>
        </View>

        {/* Botones acción */}
        {isUserJoined ? (
          <Button title="Desinscribirse" buttonStyle={styles.leaveButton} onPress={handleLeaveGame} />
        ) : (
          <Button title="Unirse" buttonStyle={styles.joinButton} onPress={openPayment} />
        )}

        {/* Solo creador puede cancelar */}
        {isCreator && (
          <Button title="Cancelar partido" buttonStyle={styles.cancelButton} onPress={cancelGame} />
        )}

        {/* Ir a Home */}
        <TouchableOpacity style={styles.homeButton} onPress={goHome}>
          <Ionicons name="home-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.homeButtonText}>Pantalla principal</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de pago */}
      <Modal visible={payVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pagar cupo</Text>
            <Text style={styles.modalSubtitle}>Debes pagar exactamente: ${game.price}</Text>

            <View style={styles.inputRow}>
              <Ionicons name="cash-outline" size={18} color="#33883F" />
              <TextInput
                style={styles.amountInput}
                placeholder="Ingresa el monto exacto"
                keyboardType="decimal-pad"
                value={payAmount}
                onChangeText={setPayAmount}
              />
            </View>

            {paying ? (
              <ActivityIndicator size="small" />
            ) : (
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelPayBtn} onPress={() => setPayVisible(false)}>
                  <Text style={styles.cancelPayText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmPayBtn} onPress={processPaymentAndJoin}>
                  <Text style={styles.confirmPayText}>Pagar y Unirme</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de éxito */}
      <Modal visible={successVisible} animationType="fade" transparent>
        <View style={styles.successBackdrop}>
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
            <Text style={styles.successTitle}>¡Estás adentro!</Text>
            <Text style={styles.successText}>Tu pago fue validado y ya quedaste inscrito.</Text>

            <View style={{ height: 8 }} />
            <TouchableOpacity style={styles.successBtn} onPress={() => setSuccessVisible(false)}>
              <Text style={styles.successBtnText}>Cerrar</Text>
            </TouchableOpacity>
            <View style={{ height: 6 }} />
            <TouchableOpacity style={styles.goHomeBtn} onPress={goHome}>
              <Text style={styles.goHomeBtnText}>Ir al Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  description: { fontSize: 16, color: '#555', marginBottom: 20, textAlign: 'center' },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  detailText: { fontSize: 16, color: '#555', marginLeft: 10 },

  joinButton: { backgroundColor: '#33883F', marginTop: 20, paddingHorizontal: 20 },
  leaveButton: { backgroundColor: '#FF9500', marginTop: 20, paddingHorizontal: 20 },
  cancelButton: { backgroundColor: '#FF3B30', marginTop: 20, paddingHorizontal: 20 },

  homeButton: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: '#33883F',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  homeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // Modal pago
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%', backgroundColor: '#fff',
    borderRadius: 12, padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  modalSubtitle: { textAlign: 'center', color: '#555', marginBottom: 12 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#33883F', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  amountInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#000' },
  modalActions: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 14,
  },
  cancelPayBtn: {
    flex: 1, marginRight: 8, backgroundColor: '#e5e7eb',
    paddingVertical: 10, borderRadius: 8, alignItems: 'center',
  },
  cancelPayText: { color: '#111827', fontWeight: '600' },
  confirmPayBtn: {
    flex: 1, marginLeft: 8, backgroundColor: '#33883F',
    paddingVertical: 10, borderRadius: 8, alignItems: 'center',
  },
  confirmPayText: { color: '#fff', fontWeight: '700' },

  // Modal éxito
  successBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  successCard: {
    width: '100%', backgroundColor: '#fff',
    borderRadius: 12, padding: 20, alignItems: 'center',
  },
  successTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  successText: { textAlign: 'center', color: '#555', marginTop: 6 },
  successBtn: {
    backgroundColor: '#e5e7eb', paddingVertical: 10,
    borderRadius: 8, alignItems: 'center', width: '100%',
  },
  successBtnText: { color: '#111827', fontWeight: '700' },
  goHomeBtn: {
    backgroundColor: '#33883F', paddingVertical: 10,
    borderRadius: 8, alignItems: 'center', width: '100%',
  },
  goHomeBtnText: { color: '#fff', fontWeight: '700' },
});

export default GameDetailScreen;
