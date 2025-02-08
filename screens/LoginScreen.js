import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Importa tu configuración de Firebase
import Ionicons from 'react-native-vector-icons/Ionicons';

const LoginScreen = ({ navigation, setIsAuthenticated, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthenticated(true); // Redirige al DrawerNavigator
    } catch (error) {
      console.error(error.message);
      Alert.alert('Error', 'Credenciales inválidas');
    }
  };

  const goRegister = () => {
    if (route.params?.previousScreen === 'Phone') {
      navigation.goBack(); 
    } else {
      navigation.navigate('Phone', { previousScreen: 'Login' });
    }
  };

  return (
    <View style={styles.container}>
      {/* Título */}
      <Text style={styles.title}>Iniciar Sesión</Text>

      {/* Campo de correo electrónico */}
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

      {/* Campo de contraseña */}
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

      {/* Link de contraseña olvidada */}
      <TouchableOpacity onPress={() => navigation.navigate('Password')}>
        <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
      </TouchableOpacity>

      {/* Botón de iniciar sesión */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar sesión</Text>
      </TouchableOpacity>

      <View style={styles.separatorContainer}>
      <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>¿Todavía no eres miembro?</Text>
      </View>

      {/* Link para registro */}
      <TouchableOpacity onPress={goRegister} style={styles.registerButton}>
        <Text style={styles.registerButtonText}>Regístrate gratis</Text>
      </TouchableOpacity>

      {/* Botón de regreso */}
      <TouchableOpacity onPress={() => navigation.navigate('Welcome')}>
        <Text style={styles.goBackText}>Regresar</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
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
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  linkText: {
    marginTop: 10,
    marginBottom: 10,
    color: '#33883F',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  registerButton: {
    marginTop: 20,
    borderColor: '#33883F',
    borderWidth: 1,
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  registerButtonText: {
    color: '#33883F',
    fontWeight: 'bold',
    fontSize: 18,
  },
  goBackText: {
    marginTop: 20,
    color: '#33883F',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  separatorContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: -20, // Espacio entre el texto y la línea
  },
  separatorLine: {
    width: '100%',
    height: 1,
    marginBottom: 20,
    backgroundColor: '#33883F',
  },
});

export default LoginScreen;
