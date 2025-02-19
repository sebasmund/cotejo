import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { PhoneAuthProvider, signInWithCredential, deleteUser } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const CodeVerificationScreen = ({ route, navigation }) => {
  const { verificationId, phoneNumber } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const verifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa un código de 6 dígitos.');
      return;
    }

    try {
      const credential = PhoneAuthProvider.credential(verificationId, fullCode);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      await deleteUser(user);

      Alert.alert('Número verificado', 'Tu número ha sido validado. Continúa con el registro.');
      navigation.navigate('Register', { phoneNumber });

    } catch (error) {
      console.error("Error al verificar el código:", error);
      Alert.alert('Error', 'El código de verificación es inválido. Inténtalo de nuevo.');
    }
  };

  const handleInputChange = (text, index) => {
    if (text.length > 1) {
      const pastedCode = text.replace(/\D/g, '').slice(0, 6).split('');
      setCode(pastedCode);

      pastedCode.forEach((char, i) => {
        if (inputRefs.current[i]) {
          inputRefs.current[i].setNativeProps({ text: char });
        }
      });

      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    } else {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);

      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace') {
      if (!code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      const newCode = [...code];
      newCode[index] = '';
      setCode(newCode);
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
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={styles.codeInput}
            value={value}
            onChangeText={(text) => handleInputChange(text, index)}
            onKeyPress={(event) => handleKeyPress(event, index)}
            maxLength={1}
            keyboardType="number-pad"
            autoCapitalize="none"
            autoFocus={index === 0}
          />
        ))}
      </View>

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
