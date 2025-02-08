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
import { database } from '../firebaseConfig';
import { ref, push } from 'firebase/database';

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

  const handleAddGame = () => {
    if (!title || !address || !players || !slots || !price) {
      Alert.alert('Campos incompletos', 'Por favor, llena todos los campos.', [
        { text: 'OK' },
      ]);
      return;
    }

    const parsedSlots = parseInt(slots, 10);
    const parsedPrice = parseFloat(price);

    if (isNaN(parsedSlots) || isNaN(parsedPrice)) {
      Alert.alert(
        'Datos inválidos',
        'Cupos y precio deben ser números válidos.',
        [{ text: 'OK' }]
      );
      return;
    }

    const gamesRef = ref(database, 'games');
    const newGame = {
      title,
      address,
      time: time.toTimeString().slice(0, 5), // Hora en formato HH:MM
      date: date.toISOString().split('T')[0], // Fecha en formato YYYY-MM-DD
      players,
      slots: parsedSlots,
      price: parsedPrice,
    };

    push(gamesRef, newGame)
      .then(() => {
        Alert.alert(
          'Partido agregado',
          'El partido se ha agregado correctamente.',
          [{ text: 'OK' }]
        );
        setTitle('');
        setAddress('');
        setTime(new Date());
        setDate(new Date());
        setPlayers('');
        setSlots('');
        setPrice('');
      })
      .catch((error) => {
        Alert.alert('Error', 'Hubo un problema al agregar el partido.', [
          { text: 'OK' },
        ]);
        console.error('Error al agregar partido:', error);
      });
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
            <Text style={styles.input}>
              Fecha: {date.toISOString().split('T')[0]}
            </Text>
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
            <Text style={styles.input}>
              Hora: {time.toTimeString().slice(0, 5)}
            </Text>
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
              style={[
                styles.optionButton,
                players === '5v5' && styles.selectedButton,
              ]}
              onPress={() => setPlayers('5v5')}
            >
              <Text
                style={[
                  styles.optionText,
                  players === '5v5' && styles.selectedText,
                ]}
              >
                10 jugadores (5v5)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                players === '7v7' && styles.selectedButton,
              ]}
              onPress={() => setPlayers('7v7')}
            >
              <Text
                style={[
                  styles.optionText,
                  players === '7v7' && styles.selectedText,
                ]}
              >
                14 jugadores (7v7)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                players === '11v11' && styles.selectedButton,
              ]}
              onPress={() => setPlayers('11v11')}
            >
              <Text
                style={[
                  styles.optionText,
                  players === '11v11' && styles.selectedText,
                ]}
              >
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#00000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderColor: '#33883F',
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  selectedButton: {
    backgroundColor: '#33883F',
  },
  optionText: {
    textAlign: 'center',
    color: '#333',
  },
  selectedText: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#33883F',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});