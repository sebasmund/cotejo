import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth } from '../firebaseConfig';
import { PhoneAuthProvider } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';

const PhoneVerificationScreen = ({ navigation, route }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const recaptchaVerifier = useRef(null);

  const sendVerificationCode = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Por favor ingresa un número de teléfono válido (10 dígitos).');
      return;
    }

    try {
      const provider = new PhoneAuthProvider(auth);
      const fullPhoneNumber = `+57${phoneNumber}`;
      const verificationId = await provider.verifyPhoneNumber(fullPhoneNumber, recaptchaVerifier.current);
      Alert.alert('Código enviado', 'Por favor revisa tu teléfono.');
      navigation.navigate('Code', { verificationId, phoneNumber: fullPhoneNumber });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const goLogin = () => {
    if (route.params?.previousScreen === 'Login') {
      navigation.goBack(); // Regresa a LoginScreen si viene de ahí
    } else {
      navigation.navigate('Login', { previousScreen: 'Phone' });
    }
  };

  return (
    <View style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
        attemptInvisibleVerification={false}
      />
      <Text style={styles.title}>Únete a cotejo</Text>
      <Text style={styles.subtitle}>Estás a solo unos pasos de tu próximo partido de fútbol</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.flag}>🇨🇴</Text>
        <TextInput
          style={styles.input}
          placeholder="Número de teléfono"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="number-pad"
          maxLength={10}
        />
      </View>
      <TouchableOpacity style={styles.button} onPress={sendVerificationCode}>
        <Text style={styles.buttonText}>Enviar Código</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.footerText}>¿Ya eres miembro?</Text>
      <TouchableOpacity style={styles.signInButton} onPress={goLogin}>
        <Text style={styles.signInButtonText}>Iniciar sesión</Text>
      </TouchableOpacity>
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
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#33883F',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    width: '100%',
    height: 50,
  },
  flag: {
    fontSize: 24,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#33883F',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  divider: {
    marginTop: 15,
    width: '100%',
    height: 1,
    marginBottom: 20,
    backgroundColor: '#33883F'
  },
  footerText: {
    fontSize: 16,
    color: '#666',
  },
  signInButton: {
    marginTop: 15,
    marginBottom: 15,
    borderColor: '#33883F',
    borderWidth: 1,
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  signInButtonText: {
    color: '#33883F',
    fontWeight: 'bold',
    fontSize: 18,
  },
  goBackText: {
    fontSize: 16,
    color: '#33883F',
    textDecorationLine: 'underline',
  },
});

export default PhoneVerificationScreen;
