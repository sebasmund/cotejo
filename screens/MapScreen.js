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

const FALLBACK_REGION = {
  latitude: 4.7110,       // Bogotá
  longitude: -74.0721,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MapScreen = () => {
  const [games, setGames] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permiso de ubicación no concedido, usando región por defecto.');
          setCurrentLocation({
            latitude: FALLBACK_REGION.latitude,
            longitude: FALLBACK_REGION.longitude,
          });
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location?.coords?.latitude ?? FALLBACK_REGION.latitude,
          longitude: location?.coords?.longitude ?? FALLBACK_REGION.longitude,
        });
      } catch (e) {
        console.error('Error obteniendo ubicación:', e);
        setCurrentLocation({
          latitude: FALLBACK_REGION.latitude,
          longitude: FALLBACK_REGION.longitude,
        });
      }
    };

    const fetchGames = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'games'));

        // Log básico para detectar documentos problemáticos
        querySnapshot.docs.forEach((d) => {
          const x = d.data();
          const gp = x?.location ?? x?.geoPoint ?? x?.coords;
          if (!gp && (x?.lat == null || x?.lng == null) && (x?.latitude == null || x?.longitude == null)) {
            console.warn('Juego sin coords:', d.id, x);
          }
        });

        const fetchedGames = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();

            // Soporta varias formas de guardar coordenadas:
            // 1) GeoPoint en data.location / data.geoPoint / data.coords
            // 2) Números planos: lat/lng o latitude/longitude
            const gp = data?.location ?? data?.geoPoint ?? data?.coords;

            const latRaw =
              gp?.latitude ??
              data?.lat ??
              data?.latitude ??
              null;

            const lngRaw =
              gp?.longitude ??
              data?.lng ??
              data?.longitude ??
              null;

            const latitude =
              typeof latRaw === 'number' ? latRaw : parseFloat(latRaw);
            const longitude =
              typeof lngRaw === 'number' ? lngRaw : parseFloat(lngRaw);

            return {
              id: doc.id,
              title: data?.title ?? 'Partido',
              latitude,
              longitude,
              address: data?.address ?? '',
              dateTime: data?.dateTime ?? data?.datetime ?? null, // Timestamp, ISO string o Date
              players: data?.players ?? null,
              price: data?.price ?? null,
              slots: data?.slots ?? null,
              description: data?.description ?? '',
            };
          })
          // Solo dejamos los que tengan coordenadas válidas
          .filter(
            (g) => Number.isFinite(g.latitude) && Number.isFinite(g.longitude)
          );

        setGames(fetchedGames);
      } catch (error) {
        console.error('Error fetching games:', error);
      }
    };

    fetchLocation();
    fetchGames();
  }, []);

  // Formatea la fecha/hora soportando Timestamp, Date o string ISO
  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Fecha y hora no disponibles';
    const jsDate =
      typeof dateTime?.toDate === 'function'
        ? dateTime.toDate()
        : new Date(dateTime);
    if (Number.isNaN(jsDate?.getTime?.())) return 'Fecha y hora no disponibles';
    const date = moment(jsDate).format('LL');
    const time = moment(jsDate).format('LT');
    return `${date} a las ${time}`;
  };

  // Mientras conseguimos ubicación inicial, mostramos loader
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
            latitude: currentLocation.latitude ?? FALLBACK_REGION.latitude,
            longitude: currentLocation.longitude ?? FALLBACK_REGION.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          customMapStyle={googleMapStyle}
        >
          {games.map((game) => (
            <Marker
              key={game.id}
              coordinate={{
                latitude: game.latitude,
                longitude: game.longitude,
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
                      {formatDateTime(selectedGame.dateTime)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="people" size={16} color="#555" />
                    <Text style={styles.cardText}>
                      {selectedGame.players ?? 'Sin jugadores'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="ticket" size={16} color="#555" />
                    <Text style={styles.cardText}>
                      Cupos disponibles: {selectedGame.slots ?? 'No disponible'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="cash" size={16} color="#555" />
                    <Text style={styles.cardText}>
                      Precio: {selectedGame.price != null ? `$${selectedGame.price}` : 'N/A'}
                    </Text>
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
  // Tus estilos de mapa...
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
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
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  detailsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailsColumn: { flex: 1 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  cardText: { fontSize: 14, color: '#555', marginLeft: 10 },
  closeButton: { position: 'absolute', top: 10, right: 10 },
  detailsButton: { backgroundColor: '#33883F', padding: 10, borderRadius: 5, marginLeft: 10 },
  detailsButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#333' },
});

export default MapScreen;
