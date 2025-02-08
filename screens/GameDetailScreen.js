import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Para los iconos
import { Button } from 'react-native-elements';
import { database, auth } from '../firebaseConfig'; // Importa Firebase y auth
import { ref, update, get, onValue } from 'firebase/database'; // Importa las funciones necesarias
import { useNavigation } from '@react-navigation/native';

const GameDetailScreen = ({ route }) => {
  const { game: initialGame } = route.params; // Datos iniciales del juego
  const [game, setGame] = useState(initialGame); // Estado local para el juego
  const [isUserJoined, setIsUserJoined] = useState(false); // Estado para verificar si el usuario está inscrito
  const navigation = useNavigation();
  const userId = auth.currentUser?.uid; // Obtén el ID del usuario actual

  // Verificar si el usuario está inscrito
  useEffect(() => {
    if (!userId) return;

    const userJoinedRef = ref(database, `games/${game.id}/joinedUsers/${userId}`);
    const unsubscribe = onValue(userJoinedRef, (snapshot) => {
      setIsUserJoined(snapshot.exists()); // Actualiza el estado si el usuario está inscrito
    });

    return () => unsubscribe(); // Desuscribirse al desmontar el componente
  }, [game.id, userId]);

  // Función para unirse al juego
  const handleJoinGame = async () => {
    if (!userId) {
      Alert.alert('Error', 'Debes iniciar sesión para unirte a un partido.', [{ text: 'OK' }]);
      return;
    }

    const gameRef = ref(database, `games/${game.id}`);
    const userJoinedRef = ref(database, `games/${game.id}/joinedUsers/${userId}`);

    try {
      // Verificar si el usuario ya está inscrito (usando `get`)
      const userJoinedSnapshot = await get(userJoinedRef);
      if (userJoinedSnapshot.exists()) {
        Alert.alert('Error', 'Ya estás inscrito en este partido.', [{ text: 'OK' }]);
        return;
      }

      // Verificar si hay cupos disponibles (usando `get`)
      const gameSnapshot = await get(gameRef);
      const gameData = gameSnapshot.val();

      if (gameData.slots > 0) {
        // Reducir el número de cupos y agregar el usuario a la lista de inscritos
        await update(gameRef, {
          slots: gameData.slots - 1,
          [`joinedUsers/${userId}`]: true,
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

    const gameRef = ref(database, `games/${game.id}`);
    const userJoinedRef = ref(database, `games/${game.id}/joinedUsers/${userId}`);

    try {
      // Verificar si el usuario está inscrito (usando `get`)
      const userJoinedSnapshot = await get(userJoinedRef);
      if (!userJoinedSnapshot.exists()) {
        Alert.alert('Error', 'No estás inscrito en este partido.', [{ text: 'OK' }]);
        return;
      }

      // Aumentar el número de cupos y eliminar el usuario de la lista de inscritos
      const gameSnapshot = await get(gameRef);
      const gameData = gameSnapshot.val();

      await update(gameRef, {
        slots: gameData.slots + 1,
        [`joinedUsers/${userId}`]: null,
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <Text style={styles.title}>{game.title}</Text>

        {/* Detalles del juego con iconos */}
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#555" />
          <Text style={styles.detailText}>{game.address}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#555" />
          <Text style={styles.detailText}>{game.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#555" />
          <Text style={styles.detailText}>{game.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people" size={16} color="#555" />
          <Text style={styles.detailText}>
            {game.players || 'Sin jugadores'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="ticket" size={16} color="#555" />
          <Text style={styles.detailText}>
            {game.slots || 'No disponible'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash" size={16} color="#555" />
          <Text style={styles.detailText}>${game.price}</Text>
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