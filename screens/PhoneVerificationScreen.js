import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  Keyboard, TouchableWithoutFeedback, Platform
} from 'react-native';

import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider } from 'firebase/auth';
import { auth, firebaseConfig } from '../firebaseConfig';

const PhoneVerificationScreen = ({ navigation, route }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sending, setSending] = useState(false);
  // 🔎 Forzamos CAPTCHA visible:
  const [invisibleRecaptcha, setInvisibleRecaptcha] = useState(false);
  const recaptchaVerifier = useRef(null);

  const formatPhoneNumber = (n) => (n.startsWith('+57') ? n : `+57${n}`);

  const sendVerificationCode = async () => {
    if (sending) return;
    setSending(true);
    try {
      if (phoneNumber.length < 10) {
        Alert.alert('Error', 'Por favor ingresa un número de teléfono válido.');
        return;
      }

      const fullPhone = formatPhoneNumber(phoneNumber);

      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        fullPhone,
        recaptchaVerifier.current
      );

      Alert.alert('Código enviado', 'Revisa tu teléfono.');
      navigation.navigate('Code', { verificationId, phoneNumber: fullPhone });
    } catch (error) {
      console.log('Error al enviar código:', error);

      const msg = String(error?.message || '');
      if (invisibleRecaptcha && (
          msg.includes('unable to load external script') ||
          msg.includes('network') ||
          msg.includes('blocked')
        )) {
        setInvisibleRecaptcha(false);
        Alert.alert(
          'Verificación',
          'No se pudo cargar el reCAPTCHA invisible. Intentaremos con el captcha visible. Toca "Enviar Código" otra vez.'
        );
      } else {
        Alert.alert('Error', error?.message || 'No se pudo enviar el código.');
      }
    } finally {
      setSending(false);
    }
  };

  const goLogin = () => {
    if (route?.params?.previousScreen === 'Login') {
      navigation.goBack();
    } else {
      navigation.navigate('Login', { previousScreen: 'Phone' });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>

        {/* ⚙️ reCAPTCHA Modal (VISIBLE porque attemptInvisibleVerification=false) */}
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifier}
          firebaseConfig={firebaseConfig}
          attemptInvisibleVerification={false}
          // ⬇️ Si usas reCAPTCHA Enterprise, descomenta y pon tu site key:
          //enterpriseRecaptchaSiteKey="6LcKVb8rAAAAAANRfnCVw1luMsUjDQgiV5mZvDs7"
        />

        <Text style={styles.title}>Únete a Cotejo</Text>
        <Text style={styles.subtitle}>Estás a solo unos pasos de tu próximo partido de fútbol</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.flag}>🇨🇴</Text>
          <TextInput
            style={styles.input}
            placeholder="Número de celular"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, sending && { opacity: 0.7 }]}
          onPress={sendVerificationCode}
          disabled={sending}
        >
          <Text style={styles.buttonText}>{sending ? 'Enviando...' : 'Enviar Código'}</Text>
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
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20, textAlign: 'center' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#33883F',
    borderRadius: 10, paddingHorizontal: 10, marginBottom: 20, width: '100%', height: 50,
  },
  flag: { fontSize: 24, marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  button: { backgroundColor: '#33883F', padding: 15, borderRadius: 5, width: '100%', alignItems: 'center', marginBottom: 20 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  divider: { marginTop: 15, width: '100%', height: 1, marginBottom: 20, backgroundColor: '#33883F' },
  footerText: { fontSize: 16, color: '#666' },
  signInButton: {
    marginTop: 15, marginBottom: 15, borderColor: '#33883F', borderWidth: 1,
    width: '100%', height: 50, justifyContent: 'center', alignItems: 'center',
    borderRadius: 10, backgroundColor: '#fff',
  },
  signInButtonText: { color: '#33883F', fontWeight: 'bold', fontSize: 18 },
  goBackText: { fontSize: 16, color: '#33883F', textDecorationLine: 'underline' },
});

export default PhoneVerificationScreen;
