import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Image,
} from 'react-native';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function UserScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = auth.currentUser?.uid;

  const fetchData = async () => {
    if (!userId) return;
    try {
      const userSnap = await getDoc(doc(db, 'users', userId));
      if (userSnap.exists()) setUserData(userSnap.data());
      const postsSnap = await getDocs(
        query(
          collection(db, 'posts'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        )
      );
      setPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [userId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#33883F" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudieron cargar los datos del usuario.</Text>
      </View>
    );
  }

  const jugados = userData.reliability?.matchesPlayed || 0;
  const asistidos = userData.reliability?.matchesAttended || 0;
  const confiabilidad = jugados > 0 ? Math.round((asistidos / jugados) * 100) : 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con engranaje */}
      <View style={styles.header}>
        <View style={styles.spacer} />
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Silueta de perfil */}
      <View style={styles.avatarPlaceholder}>
        <Ionicons name="person-circle-outline" size={80} color="#ccc" />
      </View>

      {/* Nombre y handle juntos */}
      <View style={styles.userInfoContainer}>
        <Text style={styles.name}>{userData.firstName} {userData.lastName}</Text>
        <Text style={styles.handle}>@{userData.username}</Text>
        <Text style={styles.reliability}>Confiabilidad: {confiabilidad}%</Text>
      </View>

      {/* Separador antes de estadísticas */}
      <View style={styles.separator} />

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userData.following?.length || 0}</Text>
          <Text style={styles.statLabel}>Siguiendo</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userData.followers?.length || 0}</Text>
          <Text style={styles.statLabel}>Seguidores</Text>
        </View>
      </View>

      {/* Separador antes de publicaciones */}
      <View style={styles.separator} />

      {/* Lista de publicaciones */}
      <FlatList
        style={styles.postsList}
        data={posts}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Aún no tienes publicaciones</Text>}
        renderItem={({ item }) => (
          <View style={styles.postItem}>
            <Text style={styles.postText}>{item.text}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  spacer: { flex: 1 },
  avatarPlaceholder: {
    alignSelf: 'center',
    marginTop: 10,
  },
  userInfoContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  handle: {
    fontSize: 16,
    color: '#555',
    marginTop: 4,
  },
  reliability: {
    fontSize: 14,
    color: '#33883F',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  postsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  postItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  postText: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#888',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
