import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
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
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import 'moment/locale/es';
moment.locale('es');

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();

  // Filtrar juegos por fecha
  const handleDatePress = (date) => {
    if (!date) return;
    setSelectedDate(date);
    const filtered = games.filter((game) => {
      if (!game.dateTime) return false; // Ignora juegos sin fecha
      const gameDate = moment(game.dateTime.toDate()).format('YYYY-MM-DD');
      return gameDate === date;
    });
    setFilteredGames(filtered);
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

  // Renderizar el calendario con fechas completas
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

  // Cargar juegos desde Firestore y seleccionar la fecha de hoy
  useEffect(() => {
    const fetchGames = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'games'));
        const gamesArray = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            dateTime: data.dateTime || null, // Usa el campo correcto (dateTime)
          };
        });

        //console.log('Games loaded:', gamesArray); // Verifica los datos cargados

        setGames(gamesArray);

        const firstDate = moment().format('YYYY-MM-DD');
        setSelectedDate(firstDate);

        const filtered = gamesArray.filter((game) => {
          if (!game.dateTime) return false; // Ignora juegos sin fecha
          const gameDate = moment(game.dateTime.toDate()).format('YYYY-MM-DD');
          return gameDate === firstDate;
        });

        setFilteredGames(filtered);
      } catch (error) {
        console.error('Error fetching games from Firestore:', error);
      }
    };

    fetchGames();
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
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('AddGame')}>
          <Ionicons name="add-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Calendario */}
      <View style={styles.calendarContainer}>{renderCalendar()}</View>

      {/* Lista de juegos */}
      <View style={styles.listContainer}>
        <FlatList
          data={filteredGames}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const gameDate = item.dateTime ? moment(item.dateTime.toDate()).format('YYYY-MM-DD') : 'Fecha no disponible';
            const gameTime = item.dateTime ? moment(item.dateTime.toDate()).format('hh:mm A') : 'Hora no disponible'; // Formato AM/PM

            return (
              <View style={styles.card}>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardText}>
                    <Ionicons name="location-outline" size={18} color="#33883F" /> {item.address}
                  </Text>
                  <Text style={styles.cardText}>
                    <Ionicons name="time-outline" size={18} color="#33883F" /> {gameTime} {/* Hora en AM/PM */}
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
                      title="Detalles"
                      buttonStyle={styles.detailsButton}
                      onPress={() => navigation.navigate('Details', { game: item })}
                    />
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>
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
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  selectedDateLabel: {
    color: '#fff',
    fontWeight: 'bold',
  },
  dateNumber: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
  },
  selectedDateNumber: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 10,
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
  detailsButton: {
    backgroundColor: '#33883F',
    paddingHorizontal: 20,
  },
});
