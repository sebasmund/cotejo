import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig'; // Asegúrate de importar db y auth desde tu configuración de Firebase

const UserScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null); // Estado para almacenar los datos del usuario
  const [loading, setLoading] = useState(true); // Estado para manejar la carga

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = auth.currentUser?.uid; // Obtén el ID del usuario actual
        if (!userId) {
          console.error('No se pudo obtener el ID del usuario');
          return;
        }

        // Consulta Firestore para obtener los datos del usuario
        const userDocRef = doc(db, 'users', userId); // Referencia al documento del usuario
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          // Si el documento existe, guarda los datos en el estado
          setUserData(userDocSnap.data());
        } else {
          console.error('El usuario no existe en Firestore');
        }
      } catch (error) {
        console.error('Error al obtener los datos del usuario:', error);
      } finally {
        setLoading(false); // Finaliza la carga
      }
    };

    fetchUserData();
  }, []);

  // Si está cargando, muestra un indicador de carga
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#33883F" />
      </View>
    );
  }

  // Si no hay datos del usuario, muestra un mensaje
  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No se pudieron cargar los datos del usuario.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Encabezado con ícono de configuración */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Información del usuario */}
      <View style={styles.userInfo}>
        <Text style={styles.username}>{userData.firstName} {userData.lastName}</Text>
        <Text style={styles.userHandle}>@{userData.username}</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>{userData.followers?.length || 0} Followers</Text>
          <Text style={styles.statsText}>{userData.following?.length || 0} Following</Text>
        </View>
        <Text style={styles.reliability}>
          Reliability: {userData.reliability?.attendanceRate || 0}%
        </Text>
      </View>

      {/* Sección de Post y Matches */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userData.reliability?.matchesPlayed || 0}</Text>
          <Text style={styles.statLabel}>Matches Played</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userData.reliability?.matchesAttended || 0}</Text>
          <Text style={styles.statLabel}>Matches Attended</Text>
        </View>
      </View>

      {/* Botones de acción */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Check out games!</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Go to games</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userHandle: {
    fontSize: 16,
    color: '#555',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  statsText: {
    fontSize: 14,
    color: '#555',
    marginHorizontal: 10,
  },
  reliability: {
    fontSize: 14,
    color: '#33883F',
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 16,
    color: '#555',
  },
  actionsContainer: {
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#33883F',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
});

export default UserScreen;