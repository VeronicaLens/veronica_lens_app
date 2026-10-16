import { useEffect, useState } from 'react';
import { Animated, Easing, Image, ImageBackground, Text, View } from 'react-native';

const backgroundImage = require('../../../../assets/loading-background.jpeg') as number;
const logoImage = require('../../../../assets/logo.png') as number;

const TRACK_WIDTH = 168;
const BAR_WIDTH = 64;
const LOGO_WIDTH = 220;
const LOGO_ASPECT_RATIO = 1600 / 533;

export function LoadingScreen() {
  const [translateX] = useState(() => new Animated.Value(-BAR_WIDTH));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: TRACK_WIDTH,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [translateX]);

  return (
    <ImageBackground className="flex-1 bg-canvas" resizeMode="cover" source={backgroundImage}>
      <View className="flex-1 bg-canvas/40 px-8" pointerEvents="none">
        <View style={{ flex: 0.4 }} />
        <View className="items-center gap-3">
          <Image
            resizeMode="contain"
            source={logoImage}
            style={{ width: LOGO_WIDTH, height: LOGO_WIDTH / LOGO_ASPECT_RATIO }}
          />
          <Text className="text-center font-body text-sm leading-5 text-muted">
            Descubra o céu.{'\n'}Registre sua jornada.
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <View className="items-center pb-16">
          <View
            className="overflow-hidden rounded-pill bg-surface-2"
            style={{ width: TRACK_WIDTH, height: 4 }}
          >
            <Animated.View
              className="h-full rounded-pill bg-accent"
              style={{ width: BAR_WIDTH, transform: [{ translateX }] }}
            />
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}
