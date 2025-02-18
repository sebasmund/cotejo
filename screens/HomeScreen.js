import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import moment from 'moment';
import 'moment/locale/es';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
moment.locale('es');

export default function HomeScreen() {
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [searchText, setSearchText] = useState('');
  const navigation = useNavigation();

  // Cargar partidos desde Firestore y escuchar cambios en tiempo real
  useEffect(() => {
    const gamesRef = collection(db, 'games'); // Referencia a la colección "games"

    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(gamesRef, (snapshot) => {
      const gamesArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGames(gamesArray); // Actualiza el estado con los partidos cargados

      // Filtra los partidos para la fecha seleccionada
      const filtered = gamesArray.filter((game) => game.date === selectedDate);
      setFilteredGames(filtered);
    });

    return () => unsubscribe(); // Limpiar la suscripción al desmontar el componente
  }, [selectedDate]); // Dependencia: selectedDate

  // Filtrar partidos por fecha
  const handleDatePress = (selectedDate) => {
    if (!selectedDate) return;

    // Formatea la fecha seleccionada en el mismo formato que se guarda en Firestore
    const formattedSelectedDate = moment(selectedDate).format('YYYY-MM-DD');
    setSelectedDate(formattedSelectedDate);

    // Filtra los partidos por la fecha seleccionada
    const filtered = games.filter((game) => {
      if (!game.date) return false; // Ignora partidos sin fecha
      return game.date === formattedSelectedDate; // Compara las fechas
    });

    setFilteredGames(filtered); // Actualiza el estado con los partidos filtrados
  };

  // Función de búsqueda
  const handleSearch = (text) => {
    setSearchText(text);

    if (!text.trim()) {
      // Si el texto de búsqueda está vacío, muestra todos los partidos de la fecha seleccionada
      const filtered = games.filter((game) => {
        if (!game.date) return false; // Ignora partidos sin fecha
        return game.date === selectedDate; // Filtra por fecha seleccionada
      });
      setFilteredGames(filtered);
      return;
    }

    // Filtra los partidos por título o dirección
    const filtered = games.filter((game) => {
      if (!game.date) return false; // Ignora partidos sin fecha
      const matchesDate = game.date === selectedDate; // Filtra por fecha seleccionada
      const matchesSearch =
        game.title.toLowerCase().includes(text.toLowerCase()) ||
        game.address.toLowerCase().includes(text.toLowerCase()); // Filtra por título o dirección
      return matchesDate && matchesSearch;
    });

    setFilteredGames(filtered);
  };

  // Renderizar el calendario
  const renderCalendar = () => {
    const days = [];
    for (let i = 0; i < 6; i++) {
      const day = moment().add(i, 'days');
      days.push({
        label: day.format('ddd').toUpperCase().replace('.', ''),
        number: day.format('D'),
        value: day.format('YYYY-MM-DD'), // Formatea la fecha en el mismo formato
      });
    }

    return days.map((day, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => handleDatePress(day.value)} // Pasa la fecha formateada
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

  // Renderizar un partido
  const renderGame = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <View style={styles.cardDetailRow}>
        <Ionicons name="time-outline" size={18} color="#33883F" />
        <Text style={styles.cardText}>{item.time || 'Hora no disponible'}</Text>
      </View>
      <View style={styles.cardDetailRow}>
        <Ionicons name="people-outline" size={18} color="#33883F" />
        <Text style={styles.cardText}>{item.players}</Text>
      </View>
      <View style={styles.cardDetailRow}>
        <Ionicons name="grid-outline" size={18} color="#33883F" />
        <Text style={styles.cardText}>Espacios disponibles: {item.slots}</Text>
      </View>
      <View style={styles.cardDetailRow}>
        <Ionicons name="pricetag-outline" size={18} color="#33883F" />
        <Text style={styles.cardText}>${item.price}</Text>
      </View>
      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() => navigation.navigate('Details', { game: item })} // Navega a GameDetailScreen
      >
        <Text style={styles.detailsButtonText}>Detalles</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Barra de búsqueda y botón de agregar partido */}
      <View style={styles.header}>
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar partidos..."
            placeholderTextColor="#aaa"
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddGame')} // Navega a la pantalla de agregar partido
        >
          <Ionicons name="add-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Calendario */}
      <View style={styles.calendarContainer}>{renderCalendar()}</View>

      {/* Lista de partidos */}
      <FlatList
        data={filteredGames}
        keyExtractor={(item) => item.id}
        renderItem={renderGame}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBarContainer: {
    flex: 1,
    marginRight: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#33883F',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  dateButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedDateButton: {
    backgroundColor: '#33883F',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  selectedDateLabel: {
    color: '#fff',
  },
  dateNumber: {
    fontSize: 16,
    color: '#000',
  },
  selectedDateNumber: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#33883F',
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
  },
  detailsButton: {
    backgroundColor: '#33883F',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});