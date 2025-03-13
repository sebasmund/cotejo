import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const MapScreen = () => {
  const [games, setGames] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Location permission not granted');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    };

    const fetchGames = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'games'));
        const fetchedGames = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title,
              latitude: data.location.latitude, // Accede a la latitud del GeoPoint
              longitude: data.location.longitude, // Accede a la longitud del GeoPoint
              address: data.address,
              dateTime: data.dateTime, // Usa el campo dateTime directamente
              players: data.players,
              price: data.price,
              slots: data.slots,
              description: data.description,
            };
          })
          .filter((game) => game.latitude && game.longitude); // Filtra juegos con coordenadas válidas

        setGames(fetchedGames);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };

    fetchLocation();
    fetchGames();
  }, []);

  if (!currentLocation) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Obteniendo tu ubicación...</Text>
      </SafeAreaView>
    );
  }

  // Función para formatear la fecha y hora
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Fecha y hora no disponibles';
    const date = moment(dateTime.toDate()).format('LL'); // Formato de fecha: "15 de octubre de 2023"
    const time = moment(dateTime.toDate()).format('LT'); // Formato de hora: "10:30 AM"
    return `${date} a las ${time}`;
  };

  return (
    <TouchableWithoutFeedback onPress={() => setSelectedGame(null)}>
      <SafeAreaView style={styles.container}>
        <MapView
          style={styles.map}
          showsUserLocation={true}
          initialRegion={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          customMapStyle={googleMapStyle}
        >
          {games.map((game) => (
            <Marker
              key={game.id}
              coordinate={{
                latitude: Number(game.latitude), // Asegúrate de que sea un número
                longitude: Number(game.longitude), // Asegúrate de que sea un número
              }}
              title={game.title}
              pinColor="#33883F"
              onPress={() => setSelectedGame(game)}
            />
          ))}
        </MapView>

        {/* Tarjeta de detalles del partido */}
        {selectedGame && (
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedGame(null)}
              >
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>

              <Text style={styles.cardTitle}>{selectedGame.title}</Text>

              <View style={styles.detailsContainer}>
                <View style={styles.detailsColumn}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color="#555" />
                    <Text style={styles.cardText}>{selectedGame.address}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color="#555" />
                    <Text style={styles.cardText}>
                      {formatDateTime(selectedGame.dateTime)} {/* Formatea la fecha y hora */}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="people" size={16} color="#555" />
                    <Text style={styles.cardText}>
                      {selectedGame.players || 'Sin jugadores'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="ticket" size={16} color="#555" />
                    <Text style={styles.cardText}>
                      Cupos disponibles: {selectedGame.slots || 'No disponible'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="cash" size={16} color="#555" />
                    <Text style={styles.cardText}>Precio: ${selectedGame.price}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() =>
                    navigation.navigate('Details', { game: selectedGame })
                  }
                >
                  <Text style={styles.detailsButtonText}>Ver detalles</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const googleMapStyle = [
  // Estilos del mapa (sin cambios)
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  cardContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  card: {
    width: '90%',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsColumn: {
    flex: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  cardText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  detailsButton: {
    backgroundColor: '#33883F',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
  },
});

export default MapScreen;
