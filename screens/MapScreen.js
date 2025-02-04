import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  Text,
  Button,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';

const MapScreen = () => {
  const [games, setGames] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
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
        // Se utiliza Firestore para obtener los juegos
        const querySnapshot = await getDocs(collection(db, 'games'));
        const fetchedGames = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedGames.push({
            id: doc.id,
            title: data.title,
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address,
            date: data.date,
            time: data.time,
            players: data.players,
            price: data.price,
            slots: data.slots,
            // Construimos una descripción detallada para la tarjeta
            description: `Dirección: ${data.address}\nFecha: ${data.date}\nHora: ${data.time}\nJugadores: ${data.players}\nPrecio: $${data.price}\nCupos: ${data.slots}`,
          });
        });
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

  return (
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
            pinColor="green"
          >
            <Callout tooltip>
              <View style={styles.calloutCard}>
                <Text style={styles.calloutTitle}>{game.title}</Text>
                <Text style={styles.calloutText}>
                  <Text style={styles.label}>Dirección: </Text>
                  {game.address}
                </Text>
                <Text style={styles.calloutText}>
                  <Text style={styles.label}>Fecha: </Text>
                  {game.date}
                </Text>
                <Text style={styles.calloutText}>
                  <Text style={styles.label}>Hora: </Text>
                  {game.time}
                </Text>
                <Text style={styles.calloutText}>
                  <Text style={styles.label}>Jugadores: </Text>
                  {game.players || 'Sin jugadores'}
                </Text>
                <Text style={styles.calloutText}>
                  <Text style={styles.label}>Cupos: </Text>
                  {game.slots || 'No disponible'}
                </Text>
                <Text style={styles.calloutText}>
                  <Text style={styles.label}>Precio: </Text>
                  ${game.price}
                </Text>
                <Button
                  title="Ver detalles"
                  onPress={() =>
                    navigation.navigate('GameDetails', { gameId: game.id })
                  }
                />
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </SafeAreaView>
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
  calloutCard: {
    width: 250,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  calloutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  calloutText: {
    fontSize: 14,
    color: '#555',
    marginVertical: 2,
  },
  label: {
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

