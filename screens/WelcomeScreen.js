import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const WelcomeScreen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current; // Control de opacidad
  const darkAnim = useRef(new Animated.Value(0)).current; // Fondo oscuro
  const navigation = useNavigation();

  // Lista de imágenes como require
  const images = [
    require('../assets/uno.jpg'),
    require('../assets/dos.jpg'),
    require('../assets/tres.jpg'), 
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (currentSlide + 1) % images.length;

      // Iniciar transición
      Animated.sequence([
        Animated.timing(darkAnim, {
          toValue: 1, // Fondo oscuro
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0, // Imagen desaparece
          duration: 500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Cambiar imagen
        setCurrentSlide(next);

        // Restaurar opacidad
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 1, // Imagen reaparece
            duration: 500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(darkAnim, {
            toValue: 0, // Fondo oscuro desaparece
            duration: 500,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 5000); // Cambiar cada 5 segundos

    return () => clearInterval(interval);
  }, [currentSlide]);

  return (
    <View style={styles.container}>
      {/* Imagen animada */}
      <Animated.View style={[styles.backgroundContainer, { opacity: fadeAnim }]}>
        <Image
          source={images[currentSlide]} // Usar imágenes require
          style={styles.background}
          resizeMode="cover"
        />
        {/* Filtro oscuro permanente */}
        <View style={styles.darkOverlay} />
      </Animated.View>

      {/* Fondo oscuro para transición */}
      <Animated.View style={[styles.transitionOverlay, { opacity: darkAnim }]} />

      {/* Contenido superpuesto */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/logo.png')} // Logo como require
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.overlay}>
        <Text style={styles.title}>Cotejo</Text>
        <Text style={styles.subtitle}>
          Juega fútbol cuando quieras, donde quieras
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Phone')}
        >
          <Text style={styles.buttonText}>Regístrate</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          Al registrarte, aceptas nuestros{' '}
          <Text style={styles.link}>Términos y condiciones</Text> y{' '}
          <Text style={styles.link}>Política de privacidad</Text>{' '}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  background: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Filtro oscuro
  },
  transitionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 10,
    width: '80%',
    borderRadius: 25,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 30,
  },
  link: {
    textDecorationLine: 'underline',
    color: '#fff',
  },
  logoContainer: {
    marginTop: 111, // Ajusta el espacio entre el logo y el título
    alignItems: 'center',
  },
  logo: {
    width: 100, // Ajusta el tamaño del logo
    height: 100,
  },
});

export default WelcomeScreen;


