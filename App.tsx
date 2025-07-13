// App.tsx
import React, { useState, useEffect }                  from 'react'
import { NavigationContainer }                         from '@react-navigation/native'
import { createNativeStackNavigator }                  from '@react-navigation/native-stack'
import { createBottomTabNavigator }                    from '@react-navigation/bottom-tabs'
import { onAuthStateChanged, User }                    from 'firebase/auth'
import { doc, onSnapshot }                             from 'firebase/firestore'
import { auth, db }                                    from './firebase'
import usePushToken                                    from './src/hooks/usePushToken'
import { bootstrapUser }                               from './src/utils/firebaseSetup'

import LoginScreen            from './src/screens/LoginScreen'
import SignupScreen           from './src/screens/SignupScreen'
import InterestsScreen        from './src/screens/InterestsScreen'
import HomeScreen             from './src/screens/HomeScreen'
import LoopsScreen            from './src/screens/LoopsScreen'
import CreateLoopScreen       from './src/screens/CreateLoopScreen'   // newly added
import NewPostScreen          from './src/screens/NewPostScreen'
import ChatScreen             from './src/screens/ChatScreen'
import ChatDetailScreen       from './src/screens/ChatDetailScreen'
import PostDetailScreen       from './src/screens/PostDetailScreen'
import MyProfileScreen        from './src/screens/MyProfileScreen'
import EditProfileScreen      from './src/screens/EditProfileScreen'
import UserProfileScreen      from './src/screens/UserProfileScreen'

import {
  AuthStackParamList,
  MainTabParamList,
  MainStackParamList,
} from './src/types/navigation'

// ---------------
// Navigator setup
// ---------------
const AuthStack = createNativeStackNavigator<AuthStackParamList>()
const MainTabs  = createBottomTabNavigator<MainTabParamList>()
const MainStack = createNativeStackNavigator<MainStackParamList>()

function TabsNavigator() {
  return (
    <MainTabs.Navigator
      screenOptions={{ headerShown: false }}
    >
      {/* Home tab with custom header */}
      <MainTabs.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          // show header
          headerShown: true 
        })}
      />

      {/* Other tabs */}
      <MainTabs.Screen 
        name="Loops"   
        component={LoopsScreen} 
        options={({ navigation }) => ({
          headerShown: true,
        })}
      />
      <MainTabs.Screen name="NewPost" component={NewPostScreen} />
      <MainTabs.Screen name="Chat"    component={ChatScreen} />
    </MainTabs.Navigator>
  )
}

function MainApp() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Tabs"       component={TabsNavigator} />

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
      <MainStack.Screen
        name="MyProfile"
        component={MyProfileScreen}
        options={{ headerShown: true, title: 'Profile' }}
      />
      <MainStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: true, title: 'Edit Profile' }}
      />
      <MainStack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ headerShown: true, title: 'User Profile' }}
      />
      <MainStack.Screen
        name="CreateLoop"
        component={CreateLoopScreen}
        options={{
          headerShown: true,
          title: 'New Loop',
          headerBackTitle: 'Back',
        }}
      />
    </MainStack.Navigator>
  )
}

// --------------------
// Root App Component
// --------------------
export default function App() {
  const [user, setUser]                 = useState<User | null>(null)
  const [profile, setProfile]           = useState<any>(null)
  const [initializing, setInitializing] = useState(true)

  // fetch Expo push token once ready
  const expoPushToken = usePushToken()

  // 1) Auth listener + bootstrap user doc + store push token
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u)

      if (u) {
        // create user doc if new & save expo token
        await bootstrapUser(db, u, expoPushToken)
      }

      if (initializing) {
        setInitializing(false)
      }
    })

    return unsubAuth
  }, [expoPushToken, initializing])

  // 2) Real-time listener for the user’s Firestore doc
  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }
    const userRef   = doc(db, 'users', user.uid)
    const unsubSnap = onSnapshot(userRef, (snap) => {
      setProfile(snap.exists() ? (snap.data() as any) : null)
    })
    return unsubSnap
  }, [user])

  // 3) Show nothing (or a splash) while initializing
  if (initializing) return null

  // 4) Branch between Auth flows and MainApp
  return (
    <NavigationContainer>
      {!user ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Signup"    component={SignupScreen}    />
          <AuthStack.Screen name="Login"     component={LoginScreen}     />
          <AuthStack.Screen name="Interests" component={InterestsScreen} />
        </AuthStack.Navigator>
      ) : !profile?.interests?.length ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Interests" component={InterestsScreen} />
        </AuthStack.Navigator>
      ) : (
        <MainApp />
      )}
    </NavigationContainer>
  )
}