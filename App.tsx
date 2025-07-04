// App.tsx
import React, { useState, useEffect } from 'react';
import { NavigationContainer }         from '@react-navigation/native';
import { createNativeStackNavigator }  from '@react-navigation/native-stack';
import { createBottomTabNavigator }    from '@react-navigation/bottom-tabs';
import { onAuthStateChanged, User }    from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db }                    from './firebase';

import LoginScreen      from './src/screens/LoginScreen';
import SignupScreen     from './src/screens/SignupScreen';
import InterestsScreen  from './src/screens/InterestsScreen';
import HomeScreen       from './src/screens/HomeScreen';
import LoopsScreen      from './src/screens/LoopsScreen';
import NewPostScreen    from './src/screens/NewPostScreen';
import ChatScreen       from './src/screens/ChatScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import ChatDetailScreen from './src/screens/ChatDetailScreen'

import {
  AuthStackParamList,
  MainTabParamList,
  MainStackParamList
} from './src/types/navigation';

// 1) Navigator instances
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTabs  = createBottomTabNavigator<MainTabParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

// 2) Bottom‐tabs definition
function TabsNavigator() {
  return (
    <MainTabs.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <MainTabs.Screen name="Home"    component={HomeScreen}/>
      <MainTabs.Screen name="Loops"   component={LoopsScreen}/>
      <MainTabs.Screen name="NewPost" component={NewPostScreen}/>
      <MainTabs.Screen name="Chat"    component={ChatScreen}/>
    </MainTabs.Navigator>
  );
}

// 3) Root stack wrapping the tabs + PostDetail modal
function MainApp() {
  return (
    <MainStack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Tabs"      component={TabsNavigator}/>
      <MainStack.Screen 
        name="PostDetail" 
        component={PostDetailScreen} 
        options={{ headerShown: true, title: 'Post' }} 
      />

      <MainStack.Screen
        name="ChatDetail"
        component={ChatDetailScreen}
        options={{ headerShown: true, title: 'Messages' }}
      />
    </MainStack.Navigator>
  );
}

export default function App() {
  // signed-in user
  const [user, setUser]         = useState<User | null>(null);
  // user profile from Firestore
  const [profile, setProfile]   = useState<{ interests?: string[] } | null>(null);
  // still initializing auth & profile
  const [initializing, setInitializing] = useState(true);

  // A) Listen for auth changes & auto-create user doc if needed
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u) {
        const userRef = doc(db, 'users', u.uid);
        const snap    = await getDoc(userRef);
        if (!snap.exists()) {
          // first sign-up: initialize profile
          await setDoc(userRef, {
            email:       u.email || '',
            username:    '',
            interests:   [],     // empty → will drive the Interests screen
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
    return unsubAuth;
  }, [initializing]);

  // B) Listen in real-time to the Firestore user doc
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    const userRef     = doc(db, 'users', user.uid);
    const unsubSnap   = onSnapshot(userRef, (snap) => {
      setProfile(snap.exists() ? (snap.data() as any) : null);
    });
    return unsubSnap;
  }, [user]);

  // C) While we’re booting up…
  if (initializing) {
    return null; // or a splash/loading indicator
  }

  // D) Determine which navigator to show
  return (
    <NavigationContainer>
      {/*
         1) Not signed in → Signup / Login / Interests flow
      */}
      {!user ? (
        <AuthStack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Signup"    component={SignupScreen}/>
          <AuthStack.Screen name="Login"     component={LoginScreen}/>
          <AuthStack.Screen name="Interests" component={InterestsScreen}/>
        </AuthStack.Navigator>

      ) : /**  2) Signed in but no interests yet → force Interests screen only */
      !profile?.interests?.length ? (
        <AuthStack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Interests" component={InterestsScreen}/>
        </AuthStack.Navigator>

      ) : /**  3) User is onboarded → MainApp (Tabs + PostDetail) */
      (
        <MainApp/>
      )}
    </NavigationContainer>
  );
}
