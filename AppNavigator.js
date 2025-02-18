import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'; // Importa SafeAreaProvider y SafeAreaView
import HomeScreen from './screens/HomeScreen';
import UserScreen from './screens/UserScreen';
import MessageScreen from './screens/MessageScreen';
import MapScreen from './screens/MapScreen';
import NotificationScreen from './screens/NotificationScreen';
import SocialScreen from './screens/SocialScreen'; // Asegúrate de que la ruta sea correcta

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Inicio') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              } else if (route.name === 'Mapa') {
                iconName = focused ? 'map' : 'map-outline';
              } else if (route.name === 'Reservar') {
                iconName = focused ? 'map' : 'map-outline';
              } else if (route.name === 'Social') {
                iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              } else if (route.name === 'Perfil') {
                iconName = focused ? 'person' : 'person-outline';
              }
              
              return <Icon name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#33883F',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#fff',
              height: 70,
              paddingVertical: 10,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 5,
            },
          })}
        >
          <Tab.Screen name="Inicio" component={HomeScreen} />
          <Tab.Screen name="Mapa" component={MapScreen} />
          <Tab.Screen name="Social" component={SocialScreen} />
          <Tab.Screen name="Perfil" component={UserScreen} />
        </Tab.Navigator>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
