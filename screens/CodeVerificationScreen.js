import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { PhoneAuthProvider } from 'firebase/auth';

const CodeVerificationScreen = ({ route, navigation }) => {
  const { verificationId, phoneNumber } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRefs = useRef([]);

  const verifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa un código de 6 dígitos.');
      return;
    }

    try {
      const credential = PhoneAuthProvider.credential(verificationId, fullCode);
      Alert.alert('Número verificado', 'Tu número ha sido validado. Continúa con el registro.');
      navigation.navigate('Register', { phoneNumber });
    } catch (error) {
      Alert.alert('Error', 'El código de verificación es inválido. Inténtalo de nuevo.');
    }
  };

  const handleInputChange = (text, index) => {
    // Si se pega o se ingresan varios caracteres de una vez
    if (text.length > 1) {
      // Extraer solo digitos, primeros 6 y separar
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
      // Ingreso normal de un dígito
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);
      if (text && index < 5) {
        inputRefs.current[index + 1].focus();
      }
    }
  };

  const handleKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
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
            // Para el primer campo permite pegar hasta 6 caracteres los demas se mantienen en 1
            maxLength={index === 0 ? 6 : 1}
            keyboardType="number-pad"
            autoCapitalize="none"
          />
        ))}
      </View>

      {errorMessage !== '' && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      <Text style={styles.helperText}>
        ¿No recibiste el código? Regresa y verifica que tu número es correcto.
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
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  helperText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
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
