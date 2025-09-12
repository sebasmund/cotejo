import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, ScrollView, Platform
} from 'react-native';

import { auth, db } from '../firebaseConfig';
import {
  collection, doc, setDoc, query, where, getDocs, serverTimestamp
} from 'firebase/firestore';

import Ionicons from 'react-native-vector-icons/Ionicons';
import { EmailAuthProvider, linkWithCredential } from 'firebase/auth';

const RegisterScreen = ({ route, navigation }) => {
  const phoneNumber = route?.params?.phoneNumber || null;

  if (!phoneNumber) {
    Alert.alert('Error', 'No se proporcionó el número de teléfono.');
    navigation.goBack();
    return null;
  }

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Verifica si username ya existe (case-insensitive usando usernameLower)
  const checkUsernameExists = async (value) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('usernameLower', '==', value.trim().toLowerCase()));
      const snap = await getDocs(q);
      return !snap.empty;
    } catch (err) {
      console.log('Error al verificar nombre de usuario:', err);
      // En caso de error de red/permiso, mejor bloquear el registro para evitar duplicados
      return true;
    }
  };

  const isPasswordValid = (value) => /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(value);

  const handleRegister = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      if (!firstName || !lastName || !username || !email || !password || !confirmPassword) {
        Alert.alert('Error', 'Todos los campos son obligatorios.');
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Las contraseñas no coinciden.');
        return;
      }

      if (!isPasswordValid(password)) {
        Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres, incluir una letra y un número.');
        return;
      }

      // Debes venir logueado por teléfono desde CodeVerificationScreen
      if (!auth.currentUser) {
        Alert.alert('Error', 'No hay sesión activa para vincular. Verifica tu teléfono primero.');
        return;
      }

      const usernameTaken = await checkUsernameExists(username);
      if (usernameTaken) {
        Alert.alert('Error', 'Este nombre de usuario ya está en uso.');
        return;
      }

      // Vincular email+password a la MISMA cuenta (mismo UID)
      const emailNorm = email.trim().toLowerCase();
      const cred = EmailAuthProvider.credential(emailNorm, password);
      await linkWithCredential(auth.currentUser, cred);

      const uid = auth.currentUser.uid;

      // Crear/actualizar perfil en Firestore
      await setDoc(doc(db, 'users', uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        usernameLower: username.trim().toLowerCase(),
        email: emailNorm,
        phoneNumber: phoneNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        followers: [],
        following: [],
        reliability: { matchesPlayed: 0, matchesAttended: 0 },
      }, { merge: true });

      Alert.alert('¡Listo!', 'Tu cuenta quedó vinculada y el perfil creado.');
      // Ya estás autenticado: entra a la app
      navigation.replace('Home');

    } catch (error) {
      console.log('Error al vincular/registrar:', error);
      if (error?.code === 'auth/email-already-in-use') {
        Alert.alert('Error', 'Ese correo ya está registrado en otra cuenta. Inicia sesión con ese correo o usa otro.');
      } else if (error?.code === 'auth/credential-already-in-use') {
        Alert.alert('Error', 'Las credenciales ya están vinculadas a otra cuenta.');
      } else {
        Alert.alert('Error', error?.message || 'No fue posible completar el registro.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Completa tu registro</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nombre"
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Apellido"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons name="at-outline" size={20} color="#33883F" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Nombre de usuario"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
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

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={[styles.button, submitting && { opacity: 0.7 }]} onPress={handleRegister} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Creando...' : 'Registrarse'}</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Al registrarte, aceptas nuestros Términos y Condiciones, Política de Privacidad y Política de Cookies.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 30,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000', marginBottom: 20 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', width: '100%', height: 50,
    borderColor: '#33883F', borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, marginBottom: 15, backgroundColor: '#fff',
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#000' },
  button: {
    backgroundColor: '#33883F', width: '100%', height: 50,
    justifyContent: 'center', alignItems: 'center', borderRadius: 10, marginBottom: 20,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  disclaimer: { fontSize: 12, color: '#666', textAlign: 'center', marginTop: 10 },
});

export default RegisterScreen;