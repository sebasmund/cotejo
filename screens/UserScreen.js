import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function UsuarioScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla de Usuario</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#33883F',
  },
});