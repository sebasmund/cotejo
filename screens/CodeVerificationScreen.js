import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const CodeVerificationScreen = ({ route, navigation }) => {
  const { verificationId, phoneNumber } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']); // Array para 6 cuadros
  const inputs = useRef([]); // Referencias a los cuadros de texto

  const verifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa un código de 6 dígitos.');
      return;
    }

    try {
      const credential = PhoneAuthProvider.credential(verificationId, fullCode);
      await signInWithCredential(auth, credential);
      Alert.alert('Verificación exitosa', 'Tu número ha sido verificado.');
      navigation.navigate('Register', { phoneNumber });
    } catch (error) {
      Alert.alert('Error', 'El código de verificación es inválido. Inténtalo de nuevo.');
    }
  };

  const handleInputChange = (text, index) => {
    if (text.length > 1) {
      text = text[text.length - 1]; // Asegúrate de que solo se tome el último dígito
    }
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputs.current[index + 1].focus(); // Pasa al siguiente cuadro
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && index > 0 && !code[index]) {
      inputs.current[index - 1].focus(); // Vuelve al cuadro anterior
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingresa el código de 6 dígitos que enviamos al</Text>
      <Text style={styles.phoneNumber}>{phoneNumber.replace('+57', '')}</Text>

      <View style={styles.codeInputContainer}>
        {code.map((value, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={styles.codeInput}
            value={value}
            onChangeText={(text) => handleInputChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            maxLength={1}
            keyboardType="number-pad"
          />
        ))}
      </View>

      <Text style={styles.helperText}>
        ¿No recibiste el código?{''}
        Regresa y verifica que tu número es correcto.
      </Text>

      <TouchableOpacity style={styles.verifyButton} onPress={verifyCode}>
        <Text style={styles.verifyButtonText}>Verificar</Text>
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
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  codeInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 24,
    marginHorizontal: 5,
  },
  helperText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },
  resendButton: {
    marginBottom: 30,
  },
  resendButtonText: {
    fontSize: 16,
    color: '#33883F',
    textDecorationLine: 'underline',
  },
  verifyButton: {
    backgroundColor: '#33883F',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 5,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CodeVerificationScreen;
