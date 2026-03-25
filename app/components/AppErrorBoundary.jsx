import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Something went wrong.',
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AppErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      errorMessage: '',
    });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.iconWrap}>
            <Ionicons name="warning-outline" size={48} color="#DC2626" />
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app hit an unexpected issue, but it stayed responsive. You can try again safely.
          </Text>
          <Text style={styles.detail}>{this.state.errorMessage}</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={this.handleRetry}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'MyFont-Bold',
    color: '#111827',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontFamily: 'MyFont-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  detail: {
    fontSize: 14,
    fontFamily: 'MyFont-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: '#020A66',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'MyFont-Bold',
    color: '#FFFFFF',
  },
});

export default AppErrorBoundary;
