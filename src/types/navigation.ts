// src/navigation/navigation.ts

// 1) Base imports for typing React Navigation props
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps }  from '@react-navigation/bottom-tabs'
import type { CompositeScreenProps }   from '@react-navigation/native'

/** 
 * AuthStackParamList
 * — screens in your authentication flow 
 */
export type AuthStackParamList = {
  Login:     undefined
  Signup:    undefined
  Interests: undefined
}

/**
 * OnboardingStackParamList
 * — screens in your onboarding flow
 */
export type OnboardingStackParamList = {
  Signup: undefined;
  CodeInput: {email: string}; // email passed from OnboardingSignupScreen
  WelcomeCarousel: undefined;
  ProfileSetup: undefined;
  LoopSelect: undefined;
}

/**
 * MainTabParamList
 * — bottom tabs once the user is signed in
 */
export type MainTabParamList = {
  Home:    undefined
  Loops:   undefined
  NewPost: undefined
  Chat:    undefined
}

/**
 * MainStackParamList
 * — wraps your tabs and any full-screen modals (e.g. PostDetail)
 */
export type MainStackParamList = {
  Tabs:       undefined                               // entrypoint to MainTabParamList
  PostDetail: { loopId: string; postId: string }      // thread view
  ChatDetail: { chatId: string; otherUserId: string } // chat view
  MyProfile:    undefined                               // profile view
  EditProfile: undefined                               // edit profile view    
  UserProfile: { userId: string }                     // view another user's profile   
  CreateLoop:  undefined                               // create a new loop
}

/**
 * Screen‐props / navigation prop types
 * — use these in each screen’s props signature
 */

// Auth screens
export type LoginScreenProps     = NativeStackScreenProps<AuthStackParamList, 'Login'>
export type SignupScreenProps    = NativeStackScreenProps<AuthStackParamList, 'Signup'>
export type InterestsScreenProps = NativeStackScreenProps<AuthStackParamList, 'Interests'>

// Onboarding screens
export type OnboardingSignupScreenProps         = NativeStackScreenProps<OnboardingStackParamList, 'Signup'>;
export type CodeInputScreenProps      = NativeStackScreenProps<OnboardingStackParamList, 'CodeInput'>;
export type WelcomeCarouselScreenProps= NativeStackScreenProps<OnboardingStackParamList, 'WelcomeCarousel'>;
export type ProfileSetupScreenProps   = NativeStackScreenProps<OnboardingStackParamList, 'ProfileSetup'>;
export type LoopSelectScreenProps     = NativeStackScreenProps<OnboardingStackParamList, 'LoopSelect'>;

// Bottom‐tab screens
export type HomeScreenProps    = BottomTabScreenProps<MainTabParamList, 'Home'>
export type LoopsScreenProps   = BottomTabScreenProps<MainTabParamList, 'Loops'>
export type NewPostScreenProps = BottomTabScreenProps<MainTabParamList, 'NewPost'>
export type ChatScreenProps    = BottomTabScreenProps<MainTabParamList, 'Chat'>

// PostDetail is presented via MainStack, but may need tab props too
export type PostDetailScreenProps = CompositeScreenProps<
  NativeStackScreenProps<MainStackParamList, 'PostDetail'>,
  BottomTabScreenProps<MainTabParamList>
>
