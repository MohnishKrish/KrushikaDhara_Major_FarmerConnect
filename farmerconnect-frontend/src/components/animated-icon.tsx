import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useMemo, useState } from 'react';
import { useWindowDimensions, StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION = 600;

// Splash screen animation
const splashKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1 }],
    opacity: 1,
  },
  20: {
    opacity: 1,
  },
  70: {
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 0,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const image = (
    <Image
      style={styles.image}
      source={require('@/assets/images/expo-logo.png')}
      contentFit="contain"
    />
  );

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';

        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}
    >
      {image}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}
    >
      {image}
    </View>
  );
}

// Animated icon
export function AnimatedIcon() {
  const { height } = useWindowDimensions();

  // Calculate animation values using client-side dimensions
  const initialScaleFactor = height / 90;

  const keyframe = useMemo(
    () =>
      new Keyframe({
        0: {
          transform: [{ scale: initialScaleFactor }],
        },
        100: {
          transform: [{ scale: 1 }],
          easing: Easing.elastic(0.7),
        },
      }),
    [initialScaleFactor]
  );

  const logoKeyframe = useMemo(
    () =>
      new Keyframe({
        0: {
          transform: [{ scale: 1.3 }],
          opacity: 0,
        },
        40: {
          transform: [{ scale: 1.3 }],
          opacity: 0,
          easing: Easing.elastic(0.7),
        },
        100: {
          opacity: 1,
          transform: [{ scale: 1 }],
          easing: Easing.elastic(0.7),
        },
      }),
    []
  );

  const glowKeyframe = useMemo(
    () =>
      new Keyframe({
        0: {
          transform: [{ rotateZ: '0deg' }],
        },
        100: {
          transform: [{ rotateZ: '7200deg' }],
        },
      }),
    []
  );

  return (
    <View style={styles.iconContainer}>
      <Animated.View
        entering={glowKeyframe.duration(60 * 1000 * 4)}
        style={styles.glow}
      >
        <Image
          style={styles.glow}
          source={require('@/assets/images/logo-glow.png')}
          contentFit="contain"
        />
      </Animated.View>

      <Animated.View
        entering={keyframe.duration(DURATION)}
        style={styles.background}
      />

      <Animated.View
        style={styles.imageContainer}
        entering={logoKeyframe.duration(DURATION)}
      >
        <Image
          style={styles.image}
          source={require('@/assets/images/expo-logo.png')}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#208AEF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },

  iconContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  glow: {
    width: 100,
    height: 100,
    position: 'absolute',
  },

  background: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: '#208AEF',
  },

  imageContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  image: {
    width: 60,
    height: 60,
  },
});