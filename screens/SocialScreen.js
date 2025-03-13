import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { db } from '../firebaseConfig'; // Importa la configuración de Firebase
import { collection, addDoc, onSnapshot, query, orderBy, where, updateDoc, doc, arrayUnion, getDocs } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome'; // Para los íconos de like y comentar
import * as Animatable from 'react-native-animatable'; // Para las animaciones

export default function SocialScreen() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [newComment, setNewComment] = useState({}); // Almacena los comentarios por publicación
  const [replyingTo, setReplyingTo] = useState(null); // Almacena el comentario al que se está respondiendo
  const [refreshing, setRefreshing] = useState(false); // Estado para controlar la animación de refresco

  // Función para cargar las publicaciones y sus comentarios desde Firestore
  const loadPosts = async () => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const postsData = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const post = { id: doc.id, ...doc.data() };
        // Cargar comentarios para cada publicación
        const commentsQuery = query(collection(db, 'comments'), where('postId', '==', post.id), orderBy('createdAt', 'asc'));
        const commentsSnapshot = await getDocs(commentsQuery);
        post.comments = commentsSnapshot.docs.map((commentDoc) => ({
          id: commentDoc.id,
          ...commentDoc.data(),
        }));
        return post;
      })
    );
    setPosts(postsData);
  };

  // Cargar las publicaciones al montar el componente
  useEffect(() => {
    loadPosts();
  }, []);

  // Función para manejar el "pull-to-refresh"
  const onRefresh = async () => {
    setRefreshing(true); // Activa la animación de refresco
    await loadPosts(); // Recarga las publicaciones
    setRefreshing(false); // Desactiva la animación de refresco
  };

  // Función para publicar un nuevo mensaje
  const handlePost = async () => {
    if (newPost.trim()) {
      try {
        await addDoc(collection(db, 'posts'), {
          text: newPost,
          createdAt: new Date(),
          likes: 0, // Inicializar likes en 0
        });
        setNewPost('');
        await loadPosts(); // Recargar las publicaciones después de publicar
      } catch (error) {
        console.error('Error al publicar:', error);
      }
    }
  };

  // Función para dar like a una publicación
  const handleLike = async (postId, likeAnimationRef) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: arrayUnion(1), // Incrementar likes en 1
      });
      likeAnimationRef.current.bounce(); // Ejecuta la animación de rebote
      await loadPosts(); // Recargar las publicaciones después de dar like
    } catch (error) {
      console.error('Error al dar like:', error);
    }
  };

  // Función para publicar un nuevo comentario
  const handleComment = async (postId, parentCommentId = null) => {
    if (newComment[postId]?.trim()) {
      try {
        await addDoc(collection(db, 'comments'), {
          text: newComment[postId],
          postId: postId,
          parentCommentId: parentCommentId, // Si es una respuesta a otro comentario
          createdAt: new Date(),
        });
        setNewComment({ ...newComment, [postId]: '' }); // Limpia el campo de comentario
        setReplyingTo(null); // Limpia el estado de respuesta
        await loadPosts(); // Recargar las publicaciones después de comentar
      } catch (error) {
        console.error('Error al comentar:', error);
      }
    }
  };

  // Función para mostrar los comentarios en forma de árbol (respuestas anidadas)
  const renderComments = (comments, parentId = null) => {
    return comments
      .filter((comment) => comment.parentCommentId === parentId)
      .map((comment) => (
        <View key={comment.id} style={styles.commentContainer}>
          <Text style={styles.commentText}>{comment.text}</Text>
          <TouchableOpacity onPress={() => setReplyingTo(comment.id)}>
            <Text style={styles.replyText}>Responder</Text>
          </TouchableOpacity>
          {/* Mostrar respuestas anidadas */}
          {renderComments(comments, comment.id)}
          {replyingTo === comment.id && (
            <View style={styles.replyInputContainer}>
              <TextInput
                style={styles.replyInput}
                placeholder="Escribe tu respuesta..."
                value={newComment[postId] || ''}
                onChangeText={(text) => setNewComment({ ...newComment, [postId]: text })}
              />
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => handleComment(postId, comment.id)}
              >
                <Text style={styles.smallButtonText}>Responder</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ));
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          const likeAnimationRef = React.createRef(); // Referencia para la animación
          return (
            <View style={styles.post}>
              <Text>{item.text}</Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => handleLike(item.id, likeAnimationRef)}
                >
                  <Animatable.View ref={likeAnimationRef}>
                    <Icon name="thumbs-up" size={16} color="#33883F" />
                  </Animatable.View>
                  <Text style={styles.smallButtonText}>{item.likes || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.smallButton} onPress={() => setReplyingTo(item.id)}>
                  <Icon name="comment" size={16} color="#33883F" />
                </TouchableOpacity>
              </View>
              {replyingTo === item.id && (
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Escribe un comentario..."
                    value={newComment[item.id] || ''}
                    onChangeText={(text) => setNewComment({ ...newComment, [item.id]: text })}
                  />
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={() => handleComment(item.id)}
                  >
                    <Text style={styles.smallButtonText}>Comentar</Text>
                  </TouchableOpacity>
                </View>
              )}
              {item.comments && renderComments(item.comments)}
            </View>
          );
        }}
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: 6,
    borderRadius: 8,
  },
  smallButtonText: {
    marginLeft: 4,
    color: '#33883F',
    fontSize: 14,
  },
  commentInputContainer: {
    marginTop: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  commentContainer: {
    marginLeft: 16,
    marginTop: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#ccc',
  },
  commentText: {
    fontSize: 14,
  },
  replyText: {
    color: '#33883F',
    fontSize: 12,
    marginTop: 4,
  },
  replyInputContainer: {
    marginTop: 8,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
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