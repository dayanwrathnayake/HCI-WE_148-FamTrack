import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppInput } from "../components/AppInput";
import { OrDivider } from "../components/OrDivider";
import { PrimaryButton } from "../components/PrimaryButton";
import { SocialButton } from "../components/SocialButton";
import { colors } from "../constants/colors";
import { useAccount } from "../context/AccountContext";

const registerIllustration = require("../assets/auth/register-illustration.png");

const HORIZONTAL_PADDING = 31;
const ILLUSTRATION_SIZE_RATIO = 221 / 402; // illustration width relative to the Figma reference frame

export default function RegisterScreen() {
  const { createAccount } = useAccount();
  const [name, setName] = useState("Kamal Perera");
  const [email, setEmail] = useState("kamalperera@gmail.com");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(true);

  const { width: screenWidth } = useWindowDimensions();
  const illustrationSize = screenWidth * ILLUSTRATION_SIZE_RATIO;

  const handleCreateAccount = () => { createAccount(name.trim(), email.trim()); router.replace("/(tabs)/home"); };
  const handleLogIn = () => router.push("/login");
  const handleGoogleSignUp = () => {};
  const handleAppleSignUp = () => {};

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center">
            <Image
              source={registerIllustration}
              style={{ width: illustrationSize, height: illustrationSize }}
              resizeMode="contain"
            />
          </View>

          <Text className="mt-4 text-center text-[28px] font-bold text-black">
            Create Account
          </Text>
          <Text
            className="mt-3 text-center text-[14px] leading-[21px]"
            style={{ color: "#71717a" }}
          >
            Start tracking shared expenses and reach your family financial goals together.
          </Text>

          <View className="mt-8 gap-4">
            <AppInput icon="user" placeholder="Full Name" value={name} onChangeText={setName} />
            <AppInput icon="mail" placeholder="Email" value={email} onChangeText={setEmail} />
            <AppInput
              icon="lock"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              isPassword
            />
          </View>

          <Pressable
            onPress={() => setAgreed((a) => !a)}
            className="mt-4 flex-row items-center gap-2"
          >
            <View
              className="h-[18px] w-[18px] items-center justify-center rounded-[4px]"
              style={{
                backgroundColor: agreed ? colors.black : "white",
                borderWidth: agreed ? 0 : 1,
                borderColor: colors.textFaint,
              }}
            >
              {agreed ? <Text className="text-[11px] font-bold text-white">✓</Text> : null}
            </View>
            <Text className="text-[12px] text-black">
              I agree to the <Text className="font-semibold">Terms & Privacy Policy</Text>
            </Text>
          </Pressable>

          <View className="mt-6">
            <PrimaryButton label="Create Account" onPress={handleCreateAccount} />
          </View>

          <View className="mt-6">
            <OrDivider />
          </View>

          <View className="mt-6 flex-row gap-4">
            <SocialButton icon="googleLogo" label="Google" onPress={handleGoogleSignUp} />
            <SocialButton icon="appleLogo" label="Apple" onPress={handleAppleSignUp} />
          </View>

          <Text onPress={handleLogIn} className="mb-6 mt-6 text-center text-[12px] text-black">
            Already have an account? <Text className="font-semibold">Log In</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
