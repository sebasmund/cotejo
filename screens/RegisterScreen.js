import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth, database } from '../firebaseConfig';
import { ref, set, get } from 'firebase/database';
import Ionicons from 'react-native-vector-icons/Ionicons';

const RegisterScreen = ({ route, navigation }) => {
  const phoneNumber = route?.params?.phoneNumber || null;

  if (!phoneNumber) {
    Alert.alert('Error', 'No se proporcionó el número de teléfono.');
    navigation.goBack();
    return null;
  }

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const checkUsernameExists = async (username) => {
    const usersRef = ref(database, `users`);
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
      const users = snapshot.val();
      for (const uid in users) {
        if (users[uid].username === username) {
          return true;
        }
      }
    }
    return false;
  };

  const handleRegister = async () => {
    if (!firstName || !lastName || !username || !email || !password) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }

    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      Alert.alert('Error', 'Este nombre de usuario ya está en uso.');
      return;
    }

    try {
      const user = auth.currentUser; // Obtenemos el usuario actual autenticado
      if (!user) {
        Alert.alert('Error', 'No se pudo autenticar al usuario.');
        return;
      }

      const userRef = ref(database, `users/${user.uid}`);
      const initialData = {
        firstName,
        lastName,
        username,
        email,
        phoneNumber,
        createdAt: new Date().toISOString(),
        followers: {},
        following: {},
        reliability: {
          matchesPlayed: 0,
          matchesAttended: 0,
          attendanceRate: 0,
        }
      };

      await set(userRef, initialData);
      Alert.alert('Registro exitoso', 'Tu cuenta ha sido creada.');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Completa tu Registro</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#33883F" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="people-outline" size={20} color="#33883F" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Apellido"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="person-circle-outline" size={20} color="#33883F" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Nombre de usuario"
          value={username}
          onChangeText={setUsername}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#33883F" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#33883F" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrarse</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 50,
    borderColor: '#33883F',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#33883F',
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;