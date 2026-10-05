import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { useAuth } from "../context/AuthContext";
import { hasCompletedOnboarding } from "../services/onboardingService";

// Entry route for signed-out users: onboarding the first time, Login afterwards.
// Signed-in users never see this: the route guards in _layout.tsx send them to the app.
export default function Index() {
  const { initializing } = useAuth();
  const [target, setTarget] = useState<"/login" | "/onboarding/welcome" | null>(null);

  useEffect(() => {
    let active = true;
    hasCompletedOnboarding().then((done) => {
      if (active) setTarget(done ? "/login" : "/onboarding/welcome");
    });
    return () => {
      active = false;
    };
  }, []);

  if (initializing || target === null) {
    return <View style={{ flex: 1, backgroundColor: "#ffffff" }} />;
  }
  return <Redirect href={target} />;
}
