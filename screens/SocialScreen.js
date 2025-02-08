import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { db } from '../firebaseConfig'; // Importa la configuración de Firebase
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function SocialScreen() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');

  // Función para cargar las publicaciones desde Firestore
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(postsData);
    });

    return () => unsubscribe(); // Limpia la suscripción al desmontar el componente
  }, []);

  // Función para publicar un nuevo mensaje
  const handlePost = async () => {
    if (newPost.trim()) {
      try {
        await addDoc(collection(db, 'posts'), {
          text: newPost,
          createdAt: new Date(),
        });
        setNewPost('');
      } catch (error) {
        console.error('Error al publicar:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Social</Text>
      <TextInput
        style={styles.input}
        placeholder="¿Qué estás pensando?"
        value={newPost}
        onChangeText={setNewPost}
      />
      <TouchableOpacity style={styles.button} onPress={handlePost}>
        <Text style={styles.buttonText}>Publicar</Text>
      </TouchableOpacity>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.post}>
            <Text>{item.text}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#33883F',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  post: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  button: {
    backgroundColor: '#33883F',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});