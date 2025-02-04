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
import { ref, onValue } from 'firebase/database';
import { database } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; // Para los iconos

const MapScreen = () => {
  const [games, setGames] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null); // Estado para el partido seleccionado
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

    const fetchGames = () => {
      try {
        const gamesRef = ref(database, 'games'); // Asegúrate de que 'games' sea la ruta correcta
        onValue(gamesRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const fetchedGames = Object.keys(data).map((key) => ({
              id: key,
              title: data[key].title,
              latitude: data[key].latitude,
              longitude: data[key].longitude,
              address: data[key].address,
              date: data[key].date,
              time: data[key].time,
              players: data[key].players,
              price: data[key].price,
              slots: data[key].slots,
              description: `Dirección: ${data[key].address}\nFecha: ${data[key].date}\nHora: ${data[key].time}\nJugadores: ${data[key].players}\nPrecio: $${data[key].price}\nCupos: ${data[key].slots}`,
            }));
            setGames(fetchedGames);
          }
        }, (error) => {
          console.error('Error fetching games:', error);
        });
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
          customMapStyle={googleMapStyle} // Estilo personalizado (opcional)
        >
          {games.map((game) => (
            <Marker
              key={game.id}
              coordinate={{ latitude: game.latitude, longitude: game.longitude }}
              title={game.title}
              pinColor="#33883F"
              onPress={() => setSelectedGame(game)} // Al tocar el pin, se selecciona el partido
            />
          ))}
        </MapView>

        {/* Tarjeta de detalles del partido */}
        {selectedGame && (
          <View style={styles.cardContainer}>
            <View style={styles.card}>
              {/* Botón de cerrar (X) */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedGame(null)}
              >
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>

              <Text style={styles.cardTitle}>{selectedGame.title}</Text>

              {/* Detalles con iconos */}
              <View style={styles.detailsContainer}>
                <View style={styles.detailsColumn}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color="#555" />
                    <Text style={styles.cardText}>{selectedGame.address}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color="#555" />
                    <Text style={styles.cardText}>{selectedGame.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color="#555" />
                    <Text style={styles.cardText}>{selectedGame.time}</Text>
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
                      {selectedGame.slots || 'No disponible'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="cash" size={16} color="#555" />
                    <Text style={styles.cardText}>${selectedGame.price}</Text>
                  </View>
                </View>

                {/* Botón "Ver detalles" a la derecha */}
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
  {
    elementType: 'geometry',
    stylers: [{ color: '#f5f5f5' }],
  },
  {
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#f5f5f5' }],
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#eeeeee' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#e5e5e5' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#757575' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#dadada' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#616161' }],
  },
  {
    featureType: 'road.local',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'transit.line',
    elementType: 'geometry',
    stylers: [{ color: '#e5e5e5' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'geometry',
    stylers: [{ color: '#eeeeee' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c9c9c9' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
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

