import React from 'react';
import { View, StyleSheet } from 'react-native';

const ProgressBar = ({ currentStep, totalSteps = 8 }) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressBarBackground}>
        <View 
          style={[
            styles.progressBarFill, 
            { width: `${progressPercentage}%` }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0, // Match content padding
    paddingVertical: 20,
    marginTop: 50,
    backgroundColor: '#fff',
    borderRadius: 0,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 0,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#020A66',
    borderRadius: 0,
  },
});

export default ProgressBar;