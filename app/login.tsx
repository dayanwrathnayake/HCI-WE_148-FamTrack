import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
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
import {
  getLoginErrorMessage,
  loginUser,
  PASSWORD_RESET_NOTICE,
  requestPasswordReset,
} from "../services/loginService";
import { validateEmail, validateLoginPassword } from "../utils/validation";

const loginIllustration = require("../assets/auth/login-illustration.png");

const HORIZONTAL_PADDING = 33;
const ILLUSTRATION_ASPECT_RATIO = 257 / 247;

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; tone: "error" | "notice" } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const { width: screenWidth } = useWindowDimensions();
  const illustrationWidth = Math.min(257, screenWidth - HORIZONTAL_PADDING * 2 - 40);
  const illustrationHeight = illustrationWidth / ILLUSTRATION_ASPECT_RATIO;

  const handleLogin = async () => {
    if (submitting || resetting) return;

    const validationError = validateEmail(email) ?? validateLoginPassword(password);
    if (validationError) {
      setMessage({ text: validationError, tone: "error" });
      return;
    }

    setMessage(null);
    setSubmitting(true);
    try {
      await loginUser(email, password);
      // Only reached when sign-in AND the profile check both succeeded.
      router.replace("/(tabs)/home");
    } catch (e) {
      setMessage({ text: getLoginErrorMessage(e), tone: "error" });
      setSubmitting(false);
    }
  };

  const handleSignUp = () => router.push("/register");

  const handleForgotPassword = async () => {
    if (submitting || resetting) return;

    if (email.trim().length === 0) {
      setMessage({ text: "Enter your email address above first.", tone: "error" });
      return;
    }
    const emailError = validateEmail(email);
    if (emailError) {
      setMessage({ text: emailError, tone: "error" });
      return;
    }

    setMessage(null);
    setResetting(true);
    try {
      await requestPasswordReset(email);
      setMessage({ text: PASSWORD_RESET_NOTICE, tone: "notice" });
    } catch (e) {
      setMessage({ text: getLoginErrorMessage(e), tone: "error" });
    } finally {
      setResetting(false);
    }
  };
  const handleGoogleLogin = () => {};
  const handleAppleLogin = () => {};

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
              source={loginIllustration}
              style={{ width: illustrationWidth, height: illustrationHeight }}
              resizeMode="contain"
            />
          </View>

          <Text className="mt-6 text-[28px] font-bold text-black">Welcome Back 👋</Text>
          <Text
            className="mt-3 text-center text-[15px] leading-[22px]"
            style={{ color: "#71717a" }}
          >
            Pick up right where you left off and keep your home&apos;s financial goals on track.
          </Text>

          <View className="mt-8 gap-4">
            <AppInput icon="mail" placeholder="Email" value={email} onChangeText={setEmail} />
            <View>
              <AppInput
                icon="lock"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                isPassword
              />
              <Text
                onPress={handleForgotPassword}
                className="mt-2 self-end text-[12px]"
                style={{ color: colors.textMuted }}
              >
                Forgot your password ?
              </Text>
            </View>
          </View>

          {message ? (
            <Text
              className="mt-4 text-[12px]"
              style={{ color: message.tone === "error" ? colors.error : colors.primary }}
            >
              {message.text}
            </Text>
          ) : null}

          <View className="mt-6">
            <PrimaryButton label="Log In" onPress={handleLogin} loading={submitting} />
          </View>

          <View className="mt-6">
            <OrDivider />
          </View>

          <View className="mt-6 flex-row gap-4">
            <SocialButton icon="googleLogo" label="Google" onPress={handleGoogleLogin} />
            <SocialButton icon="appleLogo" label="Apple" onPress={handleAppleLogin} />
          </View>

          <Text
            onPress={handleSignUp}
            className="mb-6 mt-6 text-center text-[12px] text-black"
          >
            Don&apos;t have an account?{" "}
            <Text className="font-semibold">Sign up free.</Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
