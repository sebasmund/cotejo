import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function AddGame() {
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [time, setTime] = useState(new Date());
  const [date, setDate] = useState(new Date());
  const [players, setPlayers] = useState('');
  const [slots, setSlots] = useState('');
  const [price, setPrice] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const navigation = useNavigation();

  const handleAddGame = async () => {
    if (!title || !address || !players || !slots || !price) {
      Alert.alert('Campos incompletos', 'Por favor, llena todos los campos.');
      return;
    }

    const parsedSlots = parseInt(slots, 10);
    const parsedPrice = parseFloat(price);

    if (isNaN(parsedSlots) || isNaN(parsedPrice)) {
      Alert.alert('Datos inválidos', 'Cupos y precio deben ser números válidos.');
      return;
    }

    // Combinar fecha + hora y crear Timestamp
    const combined = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      0,
      0
    );
    const dateTime = Timestamp.fromDate(combined);

    const creatorId = auth.currentUser?.uid ?? null;

    const newGame = {
      title,
      address,
      // opcionales de apoyo
      time: combined.toTimeString().slice(0, 5),   // HH:MM
      date: combined.toISOString().split('T')[0],  // YYYY-MM-DD
      // principal
      dateTime,
      players,
      slots: parsedSlots,
      price: parsedPrice,
      creatorId,           // 🔑 dueño del partido
      joinedUsers: [],     // para inscripciones
    };

    try {
      const docRef = await addDoc(collection(db, 'games'), newGame);
      console.log('Partido guardado con ID:', docRef.id);

      Alert.alert(
        'Partido agregado',
        'El partido se ha agregado correctamente.',
        [{ text: 'OK', onPress: () => navigation.popToTop() }],
        { cancelable: true }
      );

      // limpiar (si te quedas en pantalla)
      setTitle('');
      setAddress('');
      setTime(new Date());
      setDate(new Date());
      setPlayers('');
      setSlots('');
      setPrice('');
    } catch (error) {
      console.error('Error al agregar partido:', error);
      Alert.alert('Error', 'Hubo un problema al agregar el partido.');
    }
  };

  const irAPantallaPrincipal = () => {
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Agregar Nuevo Partido</Text>

        <TextInput
          style={styles.input}
          placeholder="Título"
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={styles.input}
          placeholder="Dirección"
          value={address}
          onChangeText={setAddress}
        />

        <View style={styles.section}>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.inputTextLike}>Fecha: {date.toISOString().split('T')[0]}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity onPress={() => setShowTimePicker(true)}>
            <Text style={styles.inputTextLike}>Hora: {time.toTimeString().slice(0, 5)}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) setTime(selectedTime);
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tipo de Fútbol:</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.optionButton, players === '5v5' && styles.selectedButton]}
              onPress={() => setPlayers('5v5')}
            >
              <Text style={[styles.optionText, players === '5v5' && styles.selectedText]}>
                10 jugadores (5v5)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, players === '7v7' && styles.selectedButton]}
              onPress={() => setPlayers('7v7')}
            >
              <Text style={[styles.optionText, players === '7v7' && styles.selectedText]}>
                14 jugadores (7v7)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, players === '11v11' && styles.selectedButton]}
              onPress={() => setPlayers('11v11')}
            >
              <Text style={[styles.optionText, players === '11v11' && styles.selectedText]}>
                22 jugadores (11v11)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Cupos restantes"
          value={slots}
          keyboardType="numeric"
          onChangeText={setSlots}
        />

        <TextInput
          style={styles.input}
          placeholder="Precio (Ej: 50000)"
          value={price}
          keyboardType="numeric"
          onChangeText={setPrice}
        />

        <TouchableOpacity style={styles.addButton} onPress={handleAddGame}>
          <Text style={styles.addButtonText}>Agregar Partido</Text>
        </TouchableOpacity>

        <View style={styles.homeBottomContainer}>
          <TouchableOpacity style={styles.homeButton} onPress={irAPantallaPrincipal}>
            <Ionicons name="home-outline" size={15} color="#fff" style={{ marginRight: 4 }} />
            <Text style={styles.homeButtonText}>Pantalla principal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContainer: { padding: 20, paddingBottom: 40 },

  header: {
    fontSize: 24, fontWeight: 'bold', textAlign: 'center',
    marginBottom: 20, color: '#000',
  },

  input: {
    borderWidth: 1, borderColor: '#33883F', padding: 12,
    marginBottom: 15, borderRadius: 8, backgroundColor: '#fff',
  },
  inputTextLike: {
    borderWidth: 1, borderColor: '#33883F', padding: 12,
    borderRadius: 8, backgroundColor: '#fff', color: '#000',
  },

  section: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },

  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  optionButton: {
    flex: 1, padding: 10, marginHorizontal: 5, borderWidth: 1,
    borderColor: '#ccc', borderRadius: 8, backgroundColor: '#fff',
  },
  selectedButton: { backgroundColor: '#33883F' },
  optionText: { textAlign: 'center', color: '#333' },
  selectedText: { color: '#fff' },

  addButton: {
    backgroundColor: '#33883F', padding: 15,
    borderRadius: 8, alignItems: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  homeBottomContainer: { marginTop: 12, alignItems: 'center' },
  homeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#33883F',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
    elevation: 2,
  },
  homeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
