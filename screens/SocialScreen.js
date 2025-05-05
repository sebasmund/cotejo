import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { db, auth } from '../firebaseConfig';
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  orderBy,
  where,
  query,
  doc,
  arrayUnion,
} from 'firebase/firestore';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as Animatable from 'react-native-animatable';

export default function SocialScreen() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [newComment, setNewComment] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = async () => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const userCache = {};

    const getUserData = async (userId) => {
      if (!userId) return { username: 'Anónimo' };
      if (userCache[userId]) return userCache[userId];
      const userSnap = await getDoc(doc(db, 'users', userId));
      if (userSnap.exists()) {
        const data = userSnap.data();
        const username = data.username || `${data.firstName} ${data.lastName}`;
        userCache[userId] = { username };
        return { username };
      }
      return { username: 'Desconocido' };
    };

    const postsData = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const post = { id: doc.id, ...doc.data() };
        post.user = await getUserData(post.userId);

        const commentsQuery = query(
          collection(db, 'comments'),
          where('postId', '==', post.id),
          orderBy('createdAt', 'asc')
        );
        const commentsSnapshot = await getDocs(commentsQuery);

        post.comments = await Promise.all(
          commentsSnapshot.docs.map(async (commentDoc) => {
            const comment = { id: commentDoc.id, ...commentDoc.data() };
            comment.user = await getUserData(comment.userId);
            return comment;
          })
        );

        return post;
      })
    );

    setPosts(postsData);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handlePost = async () => {
    if (newPost.trim()) {
      try {
        await addDoc(collection(db, 'posts'), {
          text: newPost,
          createdAt: new Date(),
          likes: 0,
          userId: auth.currentUser?.uid,
        });
        setNewPost('');
        await loadPosts();
      } catch (error) {
        console.error('Error al publicar:', error);
      }
    }
  };

  const handleLike = async (postId, likeAnimationRef) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: arrayUnion(1),
      });
      likeAnimationRef.current?.bounce();
      await loadPosts();
    } catch (error) {
      console.error('Error al dar like:', error);
    }
  };

  const handleComment = async (postId, parentCommentId = null) => {
    if (newComment[postId]?.trim()) {
      try {
        await addDoc(collection(db, 'comments'), {
          text: newComment[postId],
          postId: postId,
          parentCommentId: parentCommentId,
          createdAt: new Date(),
          userId: auth.currentUser?.uid,
        });
        setNewComment({ ...newComment, [postId]: '' });
        setReplyingTo(null);
        await loadPosts();
      } catch (error) {
        console.error('Error al comentar:', error);
      }
    }
  };

  const renderComments = (comments, parentId = null, postId = null) => {
    return comments
      .filter((comment) => comment.parentCommentId === parentId)
      .map((comment) => (
        <View key={comment.id} style={styles.commentContainer}>
          <Text style={styles.commentText}>
            <Text style={{ fontWeight: 'bold' }}>@{comment.user?.username}: </Text>
            {comment.text}
          </Text>
          <TouchableOpacity onPress={() => setReplyingTo(comment.id)}>
            <Text style={styles.replyText}>Responder</Text>
          </TouchableOpacity>
          {renderComments(comments, comment.id, postId)}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const likeAnimationRef = React.createRef();
          return (
            <View style={styles.post}>
              <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
                @{item.user?.username}
              </Text>
              <Text>{item.text}</Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => handleLike(item.id, likeAnimationRef)}
                >
                  <Animatable.View ref={likeAnimationRef}>
                    <Icon name="heart" size={16} color="#FF0000" />
                  </Animatable.View>
                  <Text style={styles.smallButtonText}>{item.likes || 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => setReplyingTo(item.id)}
                >
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
              {item.comments && renderComments(item.comments, null, item.id)}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#33883F', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginBottom: 16 },
  button: {
    backgroundColor: '#33883F',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  post: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: 6,
    borderRadius: 8,
  },
  smallButtonText: { marginLeft: 4, color: '#33883F', fontSize: 14 },
  commentInputContainer: { marginTop: 8 },
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
  commentText: { fontSize: 14 },
  replyText: { color: '#33883F', fontSize: 12, marginTop: 4 },
  replyInputContainer: { marginTop: 8 },
  replyInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
});
