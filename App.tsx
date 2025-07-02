// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps
} from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoopsScreen from './src/screens/LoopsScreen';
import ChatScreen from './src/screens/ChatScreen';
import NewPostScreen from './src/screens/NewPostScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';

// --- Navigator param types ---
type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};
type MainTabParamList = {
  Home: undefined;
  Loops: undefined;
  NewPost: undefined;
  Chat: undefined;
};
type MainStackParamList = {
  Tabs: undefined;
  PostDetail: { loopId: string; postId: string };
};

// --- Create navigators ---
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

// Bottom‐tabs navigator
function TabsNavigator() {
  return (
    <MainTabs.Navigator screenOptions={{ headerShown: false }}>
      <MainTabs.Screen name="Home" component={HomeScreen} />
      <MainTabs.Screen name="Loops" component={LoopsScreen} />
      <MainTabs.Screen name="NewPost" component={NewPostScreen} />
      <MainTabs.Screen name="Chat" component={ChatScreen} />
    </MainTabs.Navigator>
  );
}

// Root stack that wraps tabs + detail screens
function MainApp() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Tabs" component={TabsNavigator} />
      <MainStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ headerShown: true, title: 'Post' }}
      />
    </MainStack.Navigator>
  );
}

// App entrypoint
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      // On first login, auto-create Firestore profile if missing
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            email:       u.email || '',
            username:    '',
            interests:   [],
            joinedLoops: [],
            karma:       0,
            streak:      0,
            createdAt:   serverTimestamp()
          });
        }
      }

      if (initializing) {
        setInitializing(false);
      }
    });
    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    // You could return a splash/loading screen here
    return null;
  }

  return (
    <NavigationContainer>
      {user ? (
        <MainApp />
      ) : (
        <AuthStack.Navigator
          initialRouteName="Login"
          screenOptions={{ headerShown: false }}
        >
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Signup" component={SignupScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
