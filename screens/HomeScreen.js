import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from 'react-native-elements';
import moment from 'moment';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import 'moment/locale/es';

moment.locale('es');

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  // Cargar juegos desde Firestore
  const fetchGames = async (date = selectedDate) => {
    setRefreshing(true); // Activa el estado de refreshing
    try {
      const querySnapshot = await getDocs(collection(db, 'games'));
      const gamesArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        dateTime: doc.data().dateTime || null,
      }));

      setGames(gamesArray); // Actualiza la lista completa de juegos
      filterGamesByDate(gamesArray, date); // Filtra los juegos por fecha
    } catch (error) {
      console.error('Error fetching games from Firestore:', error);
    } finally {
      setRefreshing(false); // Desactiva el estado de refreshing
    }
  };

  // Cargar los juegos al montar el componente
  useEffect(() => {
    fetchGames();
  }, []);

  // Filtrar juegos por fecha
  const filterGamesByDate = (gamesList, date) => {
    setSelectedDate(date);
    const filtered = gamesList.filter((game) => {
      if (!game.dateTime) return false;
      const gameDate = moment(game.dateTime.toDate()).format('YYYY-MM-DD');
      return gameDate === date;
    });
    setFilteredGames(filtered); // Actualiza los juegos filtrados
  };

  // Manejar el cambio de fecha
  const handleDatePress = (date) => {
    fetchGames(date);
  };

  // Manejar la búsqueda de juegos
  const handleSearch = (text) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredGames(games); // Si no hay texto de búsqueda, muestra todos los juegos
      return;
    }
    const filtered = games.filter(
      (game) =>
        game.title.toLowerCase().includes(text.toLowerCase()) ||
        game.address.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredGames(filtered); // Actualiza los juegos filtrados por búsqueda
  };

  // Renderizar el calendario
  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < 6; i++) {
      const day = moment().add(i, 'days');
      days.push({
        label: day.format('ddd').toUpperCase().replace('.', ''),
        number: day.format('D'),
        value: day.format('YYYY-MM-DD'),
      });
    }

    return days.map((day, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => handleDatePress(day.value)}
        style={[styles.dateButton, selectedDate === day.value && styles.selectedDateButton]}
      >
        <Text style={[styles.dateLabel, selectedDate === day.value && styles.selectedDateLabel]}>
          {day.label}
        </Text>
        <Text style={[styles.dateNumber, selectedDate === day.value && styles.selectedDateNumber]}>
          {day.number}
        </Text>
      </TouchableOpacity>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#aaa" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar juegos"
            placeholderTextColor="#aaa"
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('AddGame')}>
          <Ionicons name="add-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Calendario */}
      <View style={styles.calendarContainer}>{renderCalendar()}</View>

      {/* Lista de juegos con pull-to-refresh */}
      <FlatList
        data={filteredGames}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing} // Estado de refreshing
            onRefresh={() => fetchGames()} // Función que se ejecuta al refrescar
            colors={['#33883F']} // Color del spinner (opcional)
            tintColor="#33883F" // Color del spinner (opcional)
          />
        }
        renderItem={({ item }) => {
          const gameTime = item.dateTime ? moment(item.dateTime.toDate()).format('hh:mm A') : 'Hora no disponible';
          return (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardText}>
                  <Ionicons name="location-outline" size={18} color="#33883F" /> {item.address}
                </Text>
                <Text style={styles.cardText}>
                  <Ionicons name="time-outline" size={18} color="#33883F" /> {gameTime}
                </Text>
                <Text style={styles.cardText}>
                  <Ionicons name="people-outline" size={18} color="#33883F" /> {item.players || 'Sin jugadores'}
                </Text>
                <Text style={styles.cardText}>
                  <Ionicons name="grid-outline" size={18} color="#33883F" /> Espacios disponibles: {item.slots || 'No disponible'}
                </Text>
                <View style={styles.footerContainer}>
                  <View style={styles.priceInfo}>
                    <Ionicons name="cash-outline" size={18} color="#33883F" />
                    <Text style={styles.cardPrice}> ${item.price}</Text>
                  </View>
                  <Button
                    title="Detalles"
                    buttonStyle={styles.detailsButton}
                    onPress={() => navigation.navigate('Details', { game: item })}
                  />
                </View>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.flatListContent} // Estilo para el contenido de la FlatList
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 8,
    marginRight: 10,
  },
  searchIcon: {
    marginHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    color: '#000',
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
    width: '100%',
  },
  dateButton: {
    width: 55,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 5,
  },
  selectedDateButton: {
    backgroundColor: '#33883F',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  selectedDateLabel: {
    color: '#fff',
  },
  dateNumber: {
    fontSize: 16,
    textAlign: 'center',
  },
  selectedDateNumber: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  detailsButton: {
    backgroundColor: '#33883F',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  flatListContent: {
    paddingBottom: 16, // Espacio adicional al final de la lista
  },
});
