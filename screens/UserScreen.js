import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function UserScreen({ navigation }) {
  const [uid, setUid] = useState(null);
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Espera a que Auth esté listo y obtén el uid
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user ? user.uid : null);
    });
    return unsub;
  }, []);

  const fetchData = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (!uid) {
        setUserData(null);
        setPosts([]);
        return;
      }

      // 1) Cargar datos del usuario
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setError('Tu perfil aún no está creado. Completa el registro o inténtalo de nuevo.');
        setUserData(null);
      } else {
        setUserData(userSnap.data());
      }

      // 2) Cargar posts
      const q = query(
        collection(db, 'posts'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const postsSnap = await getDocs(q);
      const list = postsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(list);
    } catch (e) {
      console.error('Error al cargar datos:', e);
      if (e && e.code === 'permission-denied') {
        setError('No tienes permisos para leer tus datos. Revisa las reglas de Firestore.');
      } else if (e && String(e.message || '').includes('index')) {
        setError('Esta consulta requiere un índice en Firestore. Usa el enlace del error para crearlo.');
      } else {
        setError('Ocurrió un error al cargar los datos.');
      }
      setUserData(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  // Vuelve a cargar cuando cambie el uid
  useEffect(() => {
    // uid puede ser null (sin sesión) o string (logueado)
    if (uid !== undefined) fetchData();
  }, [uid, fetchData]);

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
        <Text style={styles.errorText}>
          {error || 'No se pudieron cargar los datos del usuario.'}
        </Text>
        <TouchableOpacity onPress={onRefresh} style={{ marginTop: 12 }}>
          <Text style={{ color: '#33883F', fontWeight: '600' }}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const jugados = (userData.reliability && userData.reliability.matchesPlayed) || 0;
  const asistidos = (userData.reliability && userData.reliability.matchesAttended) || 0;
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

      {/* Nombre y handle */}
      <View style={styles.userInfoContainer}>
        <Text style={styles.name}>{userData.firstName} {userData.lastName}</Text>
        <Text style={styles.handle}>@{userData.username}</Text>
        <Text style={styles.reliability}>Confiabilidad: {confiabilidad}%</Text>
      </View>

      {/* Separador */}
      <View style={styles.separator} />

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{(userData.following && userData.following.length) || 0}</Text>
          <Text style={styles.statLabel}>Siguiendo</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{(userData.followers && userData.followers.length) || 0}</Text>
          <Text style={styles.statLabel}>Seguidores</Text>
        </View>
      </View>

      {/* Separador */}
      <View style={styles.separator} />

      {/* Lista de publicaciones */}
      <FlatList
        style={styles.postsList}
        data={posts}
        keyExtractor={(item) => String(item.id)}
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
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  spacer: { flex: 1 },
  avatarPlaceholder: { alignSelf: 'center', marginTop: 10 },
  userInfoContainer: { alignItems: 'center', marginTop: 8 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  handle: { fontSize: 16, color: '#555', marginTop: 4 },
  reliability: { fontSize: 14, color: '#33883F', marginTop: 4 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 14, color: '#555' },
  separator: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  postsList: { flex: 1, paddingHorizontal: 16 },
  postItem: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#eee' },
  postText: { fontSize: 16, color: '#333' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#888' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  errorText: { color: '#FF3B30', fontSize: 16, textAlign: 'center' },
});

