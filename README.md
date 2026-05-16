# Flow Shield

Expo + React Native WebGPU + TypeGPU starter for porting the interactive flow shield effect to React Native.

## Stack

- [Expo Router](https://docs.expo.dev/router/introduction/)
- [react-native-wgpu](https://github.com/wcandillon/react-native-webgpu)
- [TypeGPU](https://docs.swmansion.com/TypeGPU/)
- Three.js WebGPU renderer

## How to run

This project requires a custom native client for WebGPU.

```sh
npm run ios
```

```sh
npm run android
```

After the native app is installed, use the development-client server instead of
Expo Go:

```sh
npm run start:dev-client
```

```sh
npm run web
```
