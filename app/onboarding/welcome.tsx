import { router } from "expo-router";
import { Image, Pressable, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OnboardingDots } from "../../components/OnboardingDots";
import { colors } from "../../constants/colors";

const houseHeart = require("../../assets/onboarding/house-heart.png");
const familyWelcome = require("../../assets/onboarding/family-welcome.png");

const HORIZONTAL_PADDING = 40; // matches px-10
const ILLUSTRATION_ASPECT_RATIO = 318 / 296; // width / height, from the Figma frame

export default function OnboardingWelcome() {
  const handleSkip = () => router.push("/login");
  const handleNext = () => router.push("/onboarding/track-shared-expenses");

  const { width: screenWidth } = useWindowDimensions();
  const illustrationWidth = screenWidth - HORIZONTAL_PADDING * 2;
  const illustrationHeight = illustrationWidth / ILLUSTRATION_ASPECT_RATIO;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <View className="flex-1 justify-between px-10 pt-6 pb-4">
        <View className="items-center">
          <Image source={houseHeart} style={{ width: 62, height: 55 }} resizeMode="contain" />
          <Text className="mt-3 text-[30px] font-bold" style={{ color: colors.textDark }}>
            FamTrack
          </Text>
          <Text
            className="mt-3 text-center text-[24px] font-bold leading-[29px]"
            style={{ color: colors.textBody }}
          >
            Share expenses. Plan better. Build a stronger tomorrow.
          </Text>

          <Image
            source={familyWelcome}
            style={{ width: illustrationWidth, height: illustrationHeight, marginTop: 24 }}
            resizeMode="contain"
          />

          <Text
            className="mt-8 text-center text-base leading-6"
            style={{ color: colors.textMuted }}
          >
            Manage your family&apos;s money together, effortlessly.
          </Text>

          <View className="mt-7">
            <OnboardingDots total={3} activeIndex={0} />
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <Pressable onPress={handleSkip} hitSlop={8}>
            <Text className="text-[15px] font-semibold" style={{ color: colors.textMuted }}>
              Skip
            </Text>
          </Pressable>
          <Pressable
            onPress={handleNext}
            className="flex-row items-center rounded-[22px] px-5 py-3"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-[15px] font-semibold text-white">Next →</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
