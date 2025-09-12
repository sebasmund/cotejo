import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function SettingsScreen({ navigation }) {
  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí', onPress: () => console.log('Sesión cerrada') },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Eliminar cuenta', '¿Estás seguro? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', onPress: () => console.log('Cuenta eliminada') },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Configuración</Text>

      <Option icon="mail-outline" label="Actualizar correo" onPress={() => navigation.navigate('UpdateEmail')} />
      <Option icon="lock-closed-outline" label="Cambiar contraseña" onPress={() => navigation.navigate('UpdatePassword')} />
      <Option icon="information-circle-outline" label="Acerca de" onPress={() => navigation.navigate('About')} />
      <Option icon="log-out-outline" label="Cerrar sesión" onPress={handleSignOut} />
      <Option icon="person-remove-outline" label="Eliminar cuenta" onPress={handleDeleteAccount} />
    </SafeAreaView>
  );
}

const Option = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.option} onPress={onPress}>
    <Icon name={icon} size={22} color="#333" style={styles.icon} />
    <Text style={styles.optionText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#222',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  icon: {
    marginRight: 14,
  },
});