import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { WelcomeCarouselScreenProps } from '../types/navigation';

const slides = [
  {
    title: 'Welcome to Loop!',
    desc:  'A private, real-time campus feed. Post, reply, and connect with your university community.',
  },
  {
    title: 'Post Anonymously',
    desc:  'Your identity stays private. Share thoughts, confessions, and questions without the pressure.',
  },
  {
    title: 'Join Your Loops',
    desc:  'Every loop is a campus community or topic. Join, post, and find your people.',
  },
  {
    title: 'Stay Respectful',
    desc:  'Be kind, respect others, and help keep Loop safe and fun for everyone!',
  },
];

const { width } = Dimensions.get('window');

export default function WelcomeCarouselScreen({ navigation }: WelcomeCarouselScreenProps) {
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    if (index === slides.length - 1) {
      navigation.navigate('ProfileSetup');
    } else {
      setIndex(index + 1);
    }
  };

  const handleBack = () => {
    if (index > 0) setIndex(index - 1);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepText}>{`Step ${index + 1} of ${slides.length + 2}`}</Text>
      <Text style={styles.title}>{slides[index].title}</Text>
      <Text style={styles.desc}>{slides[index].desc}</Text>

      <View style={styles.dotsContainer}>
        {slides.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.activeDot]} />
        ))}
      </View>

      <View style={styles.buttonRow}>
        {index > 0 ? (
          <TouchableOpacity style={styles.secondaryButton} onPress={handleBack}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        ) : <View style={{width:80}} />}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>{index === slides.length - 1 ? 'Continue' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:30, backgroundColor:'#fff' },
  stepText: { color:'#a3a3a3', fontSize:14, marginBottom:14 },
  title: { fontSize:28, fontWeight:'bold', textAlign:'center', marginBottom:12, color:'#3e206a' },
  desc: { fontSize:17, color:'#555', textAlign:'center', marginBottom:30 },
  dotsContainer: { flexDirection:'row', gap:10, marginBottom:32, marginTop:8 },
  dot: { width:11, height:11, borderRadius:5.5, backgroundColor:'#e3daf7', marginHorizontal:4 },
  activeDot: { backgroundColor:'#6a3cff' },
  buttonRow: { flexDirection:'row', alignItems:'center', gap:12 },
  button: { backgroundColor:'#6a3cff', borderRadius:8, paddingVertical:13, paddingHorizontal:38, alignItems:'center' },
  buttonText: { color:'#fff', fontWeight:'bold', fontSize:16 },
  secondaryButton: { backgroundColor:'#ede9fe', borderRadius:8, paddingVertical:13, paddingHorizontal:38, alignItems:'center' },
  secondaryButtonText: { color:'#6a3cff', fontWeight:'bold', fontSize:16 },
});