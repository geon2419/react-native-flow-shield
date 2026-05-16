# Flow Shield

Expo + React Native WebGPU + React Three Fiber starter for porting the interactive flow shield effect to React Native.

## Stack

- [Expo Router](https://docs.expo.dev/router/introduction/)
- [react-native-wgpu](https://github.com/wcandillon/react-native-webgpu)
- [Three.js](https://threejs.org/)
- [React Three Fiber](https://r3f.docs.pmnd.rs/)

The current app renders a Three.js sphere through React Three Fiber on top of
React Native WebGPU. Three.js owns the geometry, material, and render pass
plumbing so the shield port can stay closer to the original reference example.

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
