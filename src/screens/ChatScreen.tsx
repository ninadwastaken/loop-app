import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { commonStyles, typography, colors } from '../screens/styles.js'; // Adjust path if needed

export default function ChatScreen() {
  return (
    <View style={commonStyles.container}>
      <Text style={styles.chatText}>💌 Chat</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chatText: {
    color: colors.textPrimary,
    fontSize: typography.xxl,
    fontWeight: '700', // typography.bold is a string but TS expects direct value
  },
});
