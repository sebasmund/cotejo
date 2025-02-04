import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import PhoneVerificationScreen from './screens/PhoneVerificationScreen';
import CodeVerificationScreen from './screens/CodeVerificationScreen';
import PasswordResetScreen from './screens/PasswordResetScreen';
import GameDetailScreen from './screens/GameDetailScreen';
import AddGame from './screens/AddGame';
import AppNavigator from './AppNavigator'; 

const Stack = createStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Estado de autenticación

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Si el usuario no está autenticado, muestra las pantallas de bienvenida */}
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen
                  {...props}
                  setIsAuthenticated={setIsAuthenticated} // Pasamos el setter para actualizar el estado
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Phone" component={PhoneVerificationScreen} />
            <Stack.Screen name="Code" component={CodeVerificationScreen} />
            <Stack.Screen name="Password" component={PasswordResetScreen} />
          </>
        ) : (
          // Si está autenticado, muestra el AppNavigator (con las 5 pantallas del tab)
          <Stack.Screen name="Home" component={AppNavigator} />
        )}
        <Stack.Screen name="AddGame" component={AddGame} />
        <Stack.Screen name="Details" component={GameDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}