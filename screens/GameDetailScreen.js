import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from 'react-native-elements';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const GameDetailScreen = ({ route }) => {
  const { game: initialGame = {} } = route.params || {}; // Datos iniciales del juego
  const [game, setGame] = useState(initialGame);
  const [isUserJoined, setIsUserJoined] = useState(false); // Estado para verificar si el usuario está inscrito
  const navigation = useNavigation();
  const userId = auth.currentUser?.uid; // Obtén el ID del usuario actual

  // Verificar si el usuario está inscrito
  useEffect(() => {
    if (!userId || !game.id) return;

    const checkIfUserJoined = async () => {
      const gameRef = doc(db, 'games', game.id);
      const gameSnapshot = await getDoc(gameRef);

      if (gameSnapshot.exists()) {
        const gameData = gameSnapshot.data();
        const joinedUsers = gameData.joinedUsers || [];
        setIsUserJoined(joinedUsers.includes(userId)); // Verifica si el usuario está en la lista
      }
    };

    checkIfUserJoined();
  }, [game.id, userId]);

  // Función para unirse al juego
  const handleJoinGame = async () => {
    if (!userId) {
      Alert.alert('Error', 'Debes iniciar sesión para unirte a un partido.', [{ text: 'OK' }]);
      return;
    }

    const gameRef = doc(db, 'games', game.id);

    try {
      const gameSnapshot = await getDoc(gameRef);
      if (!gameSnapshot.exists()) {
        Alert.alert('Error', 'El partido no existe o ha sido eliminado.', [{ text: 'OK' }]);
        return;
      }

      const gameData = gameSnapshot.data();
      const joinedUsers = gameData.joinedUsers || [];

      // Verificar si el usuario ya está inscrito
      if (joinedUsers.includes(userId)) {
        Alert.alert('Error', 'Ya estás inscrito en este partido.', [{ text: 'OK' }]);
        return;
      }

      // Verificar si hay cupos disponibles
      if (gameData.slots > 0) {
        // Reducir el número de cupos y agregar el usuario a la lista de inscritos
        await updateDoc(gameRef, {
          slots: gameData.slots - 1,
          joinedUsers: arrayUnion(userId), // Agrega el usuario a la lista
        });

        Alert.alert(
          'Unido correctamente',
          'Has sido añadido al juego y el número de cupos ha sido actualizado.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (navigation.canGoBack()) {
                  navigation.goBack(); // Navegar hacia atrás solo si es posible
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Sin cupos disponibles',
          'Lo sentimos, este juego ya no tiene cupos disponibles.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al unirse al juego.', [{ text: 'OK' }]);
      console.error('Error al unirse al juego:', error);
    }
  };

  // Función para desinscribirse del juego
  const handleLeaveGame = async () => {
    if (!userId) {
      Alert.alert('Error', 'Debes iniciar sesión para desinscribirte de un partido.', [{ text: 'OK' }]);
      return;
    }

    const gameRef = doc(db, 'games', game.id);

    try {
      const gameSnapshot = await getDoc(gameRef);
      if (!gameSnapshot.exists()) {
        Alert.alert('Error', 'El partido no existe o ha sido eliminado.', [{ text: 'OK' }]);
        return;
      }

      const gameData = gameSnapshot.data();
      const joinedUsers = gameData.joinedUsers || [];

      // Verificar si el usuario está inscrito
      if (!joinedUsers.includes(userId)) {
        Alert.alert('Error', 'No estás inscrito en este partido.', [{ text: 'OK' }]);
        return;
      }

      // Aumentar el número de cupos y eliminar el usuario de la lista de inscritos
      await updateDoc(gameRef, {
        slots: gameData.slots + 1,
        joinedUsers: arrayRemove(userId), // Elimina el usuario de la lista
      });

      Alert.alert(
        'Desinscrito correctamente',
        'Has sido eliminado del juego y el número de cupos ha sido actualizado.',
        [
          {
            text: 'OK',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack(); // Navegar hacia atrás solo si es posible
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al desinscribirse del juego.', [{ text: 'OK' }]);
      console.error('Error al desinscribirse del juego:', error);
    }
  };

  // Función para formatear la fecha sin el año
const formatDate = (dateTime) => {
  if (!dateTime) return 'Fecha no disponible';
  return moment(dateTime.toDate()).format('MMMM D'); // Formato: "octubre 15"
};

// Función para formatear la hora en AM/PM
const formatTime = (dateTime) => {
  if (!dateTime) return 'Hora no disponible';
  return moment(dateTime.toDate()).format('h:mm A'); // Formato: "10:30 AM"
};

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={styles.title}>{game.title}</Text>
        <Text style={styles.description}>{game.description || 'Sin descripción'}</Text>

        {/* Detalles del juego con iconos */}
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
          <Text style={styles.detailText}>
            {game.players || 'Sin jugadores'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="grid" size={16} color="#555" />
          <Text style={styles.detailText}>
            Cupos disponibles: {game.slots || 'No disponible'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#555" />
          <Text style={styles.detailText}>Precio: ${game.price}</Text>
        </View>

        {/* Botón "Unirse" o "Desinscribirse" */}
        {isUserJoined ? (
          <Button
            title="Desinscribirse"
            buttonStyle={styles.leaveButton}
            onPress={handleLeaveGame}
          />
        ) : (
          <Button
            title="Unirse"
            buttonStyle={styles.joinButton}
            onPress={handleJoinGame}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
  },
  joinButton: {
    backgroundColor: '#33883F',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  leaveButton: {
    backgroundColor: '#FF3B30',
    marginTop: 20,
    paddingHorizontal: 20,
  },
});

export default GameDetailScreen;