import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from 'react-native-elements';
import moment from 'moment';
import { SafeAreaView } from 'react-native';
import { database } from '../firebaseConfig';
import { ref, onValue, update } from 'firebase/database';
import { useNavigation } from '@react-navigation/native'; // Para redireccionar
import 'moment/locale/es';
moment.locale('es');
import { Alert } from 'react-native';

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [searchText, setSearchText] = useState('');
  //const [isFilterMenuVisible, setIsFilterMenuVisible] = useState(false); // Control del menú lateral
  const navigation = useNavigation(); // Hook para navegación

  // Filtrar juegos por fecha
  const handleDatePress = (date) => {
    if (!date) return;
    setSelectedDate(date);
    const filtered = games.filter(
      (game) => moment(game.date, 'YYYY-MM-DD', true).isSame(date, 'day')
    );
    setFilteredGames(filtered);
  };
  
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
          Alert.alert('Error', 'Hubo un problema al unirse al juego.', [
            { text: 'OK' },
          ]);
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

  // Filtrar juegos por texto de búsqueda
  const handleSearch = (text) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredGames(games);
      return;
    }
    const filtered = games.filter(
      (game) =>
        game.title.toLowerCase().includes(text.toLowerCase()) ||
        game.address.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredGames(filtered);
  };

  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < 6; i++) {
      const day = moment().add(i, 'days');
      days.push({
        label: day.format('ddd').toUpperCase().replace('.', ''),
        number: day.format('D'),
        value: day.format('D'),
      });
    }

    return days.map((day, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => handleDatePress(day.value)}
        style={[
          styles.dateButton,
          selectedDate === day.value && styles.selectedDateButton,
        ]}
      >
        <Text
          style={[
            styles.dateLabel,
            selectedDate === day.value && styles.selectedDateLabel,
          ]}
        >
          {day.label}
        </Text>
        <Text
          style={[
            styles.dateNumber,
            selectedDate === day.value && styles.selectedDateNumber,
          ]}
        >
          {day.number}
        </Text>
      </TouchableOpacity>
    ));
  };

  // Cargar juegos desde Firebase y seleccionar la primera fecha disponible
  useEffect(() => {
    const gamesRef = ref(database, "games");
    const unsubscribe = onValue(
      gamesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const gamesArray = Object.entries(data).map(([key, value]) => ({
            id: key,
            ...value,
          }));
          setGames(gamesArray);
  
          // Seleccionar la primera fecha disponible
          const firstDate = moment().format("YYYY-MM-DD"); // Fecha completa de hoy
          setSelectedDate(firstDate);
  
          // Filtrar juegos por la primera fecha
          const filtered = gamesArray.filter((game) => {
            const gameDate = moment(game.date, "YYYY-MM-DD", true); // Validación estricta
            return gameDate.isValid() && gameDate.isSame(firstDate, "day");
          });
  
          setFilteredGames(filtered);
        } else {
          setGames([]);
          setFilteredGames([]);
        }
      },
      (error) => {
        console.error("Error fetching data from Firebase:", error);
      }
    );
  
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra superior */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#aaa" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar juegos"
            placeholderTextColor="#aaa"
            value={searchText}
            onChangeText={handleSearch} // Manejar texto
          />
        </View>
        {/* Botón de filtro 
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setIsFilterMenuVisible(!isFilterMenuVisible)}
        >
          <Ionicons name="filter-outline" size={24} color="#000" />
        </TouchableOpacity>*/}
        
        {/* Botón de añadir */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('AddGame')} // Redireccionar
        >
          <Ionicons name="add-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Calendario */}
      <View style={styles.calendarContainer}>{renderCalendar()}</View>

      {/* Lista de juegos */}
      <FlatList
        data={filteredGames}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardText}>
                <Ionicons name="location-outline" size={18} color="#33883F" />{' '}
                {item.address}
              </Text>
              <Text style={styles.cardText}>
                <Ionicons name="time-outline" size={18} color="#33883F" /> {item.time}
              </Text>
              <Text style={styles.cardText}>
                <Ionicons name="people-outline" size={18} color="#33883F" />{' '}
                {item.players || 'Sin jugadores'}
              </Text>
              <Text style={styles.cardText}>
                <Ionicons name="grid-outline" size={18} color="#33883F" /> Espacios disponibles:{' '}
                {item.slots || 'No disponible'}
              </Text>
              <View style={styles.footerContainer}>
                <View style={styles.priceInfo}>
                  <Ionicons name="pricetag-outline" size={18} color="#33883F" />
                  <Text style={styles.cardPrice}> ${item.price}</Text>
                </View>
                <Button
                  title="Unirse"
                  buttonStyle={styles.joinButton}
                  onPress={() => handleJoinGame(item.id, item.slots)}
                />
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    marginLeft: 10,
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
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
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  selectedDateLabel: {
    color: '#fff', // Texto blanco cuando está seleccionado
    fontWeight: 'bold',
  },
  dateNumber: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  selectedDateNumber: {
    color: '#fff', // Número blanco cuando está seleccionado
    fontWeight: 'bold',
  },
  card: {
    margin: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
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
    marginVertical: 4,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  joinButton: {
    backgroundColor: '#33883F',
    paddingHorizontal: 20,
  },
});