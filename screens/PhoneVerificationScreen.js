import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { auth, database } from '../firebaseConfig';
import { PhoneAuthProvider } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { ref, get } from 'firebase/database';

const PhoneVerificationScreen = ({ navigation, route }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const recaptchaVerifier = useRef(null);

  // Función que convierte el número ingresado al formato internacional (+57...)
  const formatPhoneNumber = (inputNumber) => {
    return inputNumber.startsWith('+57') ? inputNumber : `+57${inputNumber}`;
  };

  // Verifica si el número ya está registrado en la base de datos
  const checkPhoneNumberExists = async (inputNumber) => {
    const fullPhoneNumber = formatPhoneNumber(inputNumber);
    try {
      // Consulta directa en el nodo de índice (asegúrate de que en userPhoneNumbers se almacene sin prefijo)
      const phoneRef = ref(database, `userPhoneNumbers/${fullPhoneNumber}`);
      const snapshot = await get(phoneRef);
      console.log("Buscando el número:", fullPhoneNumber, "resultado:", snapshot.val());
      return snapshot.exists();
    } catch (error) {
      console.log("Error al verificar el número de teléfono:", error);
      return false;
    }
  };

  const sendVerificationCode = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert('Error', 'Por favor ingresa un número de teléfono válido.');
      return;
    }
    
    // Convertir el número ingresado al formato internacional
    const fullPhoneNumber = formatPhoneNumber(phoneNumber);

    // Verificar si el número ya está registrado
    const exists = await checkPhoneNumberExists(phoneNumber);
    if (exists) {
      Alert.alert('Número registrado', 'El número de teléfono ya se encuentra registrado.');
      return;
    }
    
    try {
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        fullPhoneNumber,
        recaptchaVerifier.current
      );
      Alert.alert('Código enviado', 'Por favor revisa tu teléfono.');
      // Se envía el número ya formateado para mantener consistencia
      navigation.navigate('Code', { verificationId, phoneNumber: fullPhoneNumber });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const goLogin = () => {
    if (route.params?.previousScreen === 'Login') {
      navigation.goBack();
    } else {
      navigation.navigate('Login', { previousScreen: 'Phone' });
    }
  };

  return (
    <View style={styles.container}>
      {/* Se utiliza el modal de reCAPTCHA en modo invisible */}
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
        attemptInvisibleVerification={true}
      />
      <Text style={styles.title}>Únete a cotejo</Text>
      <Text style={styles.subtitle}>
        Estás a solo unos pasos de tu próximo partido de fútbol
      </Text>
      
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

      {/*<Text style={styles.captchaHint}>
        La verificación captcha se realizará de forma invisible.
      </Text>*/}

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
  captchaHint: {
    fontSize: 14,
    color: '#33883F',
    marginBottom: 20,
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
    backgroundColor: '#33883F',
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
