import { View, Text, StyleSheet } from 'react-native'

const Login = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#333',
    fontFamily: 'MyFont-Bold',
    marginBottom: 20,
  },
});

export default Login