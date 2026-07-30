import React from 'react';
import { ExpoRoot } from 'expo-router';

const context = require.context('./app');

export default function App() {
  return <ExpoRoot context={context} />;
}
