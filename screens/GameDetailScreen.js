import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; // Para los iconos
import { Button } from 'react-native-elements';
import { database } from '../firebaseConfig';
import { ref, update } from 'firebase/database';

const GameDetailScreen = ({ route }) => {
  // Obtén los datos del juego seleccionado
  const { game } = route.params;

  // Función para unirse al juego
  const handleJoinGame = (gameId, currentSlots) => {
    if (currentSlots > 0) {
      const gameRef = ref(database, `games/${gameId}`);
      update(gameRef, { slots: currentSlots - 1 })
        .then(() => {
          Alert.alert(
            'Unido correctamente',
            'Has sido añadido al juego y el número de cupos ha sido actualizado.',
            [{ text: 'OK' }]
          );
        })
        .catch((error) => {
          Alert.alert('Error', 'Hubo un problema al unirse al juego.', [{ text: 'OK' }]);
          console.error('Error al unirse al juego:', error);
        });
    } else {
      Alert.alert(
        'Sin cupos disponibles',
        'Lo sentimos, este juego ya no tiene cupos disponibles.',
        [{ text: 'OK' }]
      );
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

        {/* Botón "Unirse" */}
        <Button
          title="Unirse"
          buttonStyle={styles.joinButton}
          onPress={() => handleJoinGame(game.id, game.slots)}
        />
      </View>
    </SafeAreaView>
  );
};

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
});

export default GameDetailScreen;