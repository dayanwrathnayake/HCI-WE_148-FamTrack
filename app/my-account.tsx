import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { AccountAvatar } from "../components/AccountAvatar";
import { Icon } from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { useFamily } from "../context/FamilyContext";
import { accountErrorMessage, changeAccountEmail, saveAccountDetails } from "../services/accountService";
import type { UserProfile, WithId } from "../types/models";

export default function MyAccountScreen() {
  const { profile, profileStatus, retryProfile } = useAuth();
  const { currentMember, status: familyStatus } = useFamily();
  if (profileStatus !== "ready" || !profile) return <SafeAreaView style={styles.screen}><View style={styles.unavailable}><Text style={styles.title}>My Account</Text>{profileStatus === "loading" || profileStatus === "idle" ? <ActivityIndicator color="#05bf78" /> : <><Text style={styles.message}>Could not load your account.</Text><Pressable accessibilityRole="button" onPress={retryProfile} style={styles.save}><Text>Retry</Text></Pressable></>}<Pressable accessibilityRole="button" onPress={() => router.replace("/(tabs)/settings")} style={styles.secondary}><Text>Back to Profile</Text></Pressable></View></SafeAreaView>;
  return <AccountForm key={profile.id} profile={profile} memberId={currentMember?.id ?? null} familyReady={!profile.familyId || familyStatus === "ready"} />;
}

function AccountForm({ profile, memberId, familyReady }: { profile: WithId<UserProfile>; memberId: string | null; familyReady: boolean }) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [photo, setPhoto] = useState<{ uri: string; mime?: string } | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});
  const [message, setMessage] = useState("");

  const pickPhoto = async () => {
    setMessage("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (!result.canceled && result.assets[0]) setPhoto({ uri: result.assets[0].uri, mime: result.assets[0].mimeType });
    } catch {
      setMessage("Could not open your photos. Please try again.");
    }
  };

  const save = async () => {
    if (busy) return;
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "Enter your name.";
    if (!/^[^\s@]+@gmail\.com$/.test(email.trim().toLowerCase())) nextErrors.email = "Enter an email ending in @gmail.com.";
    if (phone.trim() && !/^\+?\d{7,15}$/.test(phone.replace(/[\s()-]/g, ""))) nextErrors.phone = "Enter a valid phone number.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { setMessage(""); return; }
    if (!familyReady || (profile.familyId && !memberId)) { setMessage("Wait for your family membership to load before saving."); return; }
    const emailChanged = email.trim().toLowerCase() !== profile.email.toLowerCase();
    if (emailChanged && !password) { setMessage("Enter your current password to change your email."); return; }
    setBusy(true);
    setMessage("");
    let emailSaved = false;
    try {
      if (emailChanged) { await changeAccountEmail(email, password); emailSaved = true; setPassword(""); }
      await saveAccountDetails(profile, memberId, { name, phone, photoUri: photo?.uri, photoMime: photo?.mime });
      router.replace({ pathname: "/(tabs)/settings", params: { accountUpdated: String(Date.now()) } });
    } catch (error) { setMessage((emailSaved ? "Email changed, but other details could not be saved. " : "") + accountErrorMessage(error)); }
    finally { setBusy(false); }
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to Profile" disabled={busy} hitSlop={10} style={styles.back} onPress={() => router.replace("/(tabs)/settings")}><Icon name="arrowLeft" size={19} /></Pressable>
          <Text style={styles.title}>My Account</Text>
        </View>
        <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.card}>
              <Pressable accessibilityRole="button" accessibilityLabel="Change profile photo" disabled={busy} style={styles.photoButton} onPress={pickPhoto}>
                <AccountAvatar name={name} photoPath={profile.photoPath} previewUri={photo?.uri} size={100} />
                <View style={styles.cameraBadge}><SvgXml width={19} height={19} xml={'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 5h8l2 3h3v13H3V8h3z" fill="#050505"/><circle cx="12" cy="14" r="4" fill="white"/><circle cx="12" cy="14" r="2.5" fill="#050505"/></svg>'} /></View>
              </Pressable>
              <View style={styles.fields}>
                <View style={[styles.field, !!errors.name && styles.invalid]}><Text style={styles.label}>Name</Text><TextInput editable={!busy} accessibilityLabel="Name" value={name} onChangeText={value => { setName(value); setMessage(""); }} style={styles.input} autoCapitalize="words" autoComplete="name" maxLength={100} /></View>
                {errors.name && <Text style={styles.error}>{errors.name}</Text>}
                <View style={[styles.field, !!errors.email && styles.invalid]}><Text style={styles.label}>Email</Text><TextInput editable={!busy} accessibilityLabel="Email" value={email} onChangeText={value => { setEmail(value); setMessage(""); }} style={styles.input} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" maxLength={254} /></View>
                {errors.email && <Text style={styles.error}>{errors.email}</Text>}
                {email.trim().toLowerCase() !== profile.email.toLowerCase() && <><View style={styles.field}><Text style={styles.label}>Current password</Text><TextInput editable={!busy} accessibilityLabel="Current password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} style={styles.input} /></View></>}
                <View style={[styles.field, !!errors.phone && styles.invalid]}><Text style={styles.label}>Phone Number (optional)</Text><TextInput editable={!busy} accessibilityLabel="Phone Number" value={phone} onChangeText={value => { setPhone(value); setMessage(""); }} style={styles.input} keyboardType="phone-pad" autoComplete="tel" maxLength={25} /></View>
                {errors.phone && <Text style={styles.error}>{errors.phone}</Text>}
              </View>
              <Pressable accessibilityRole="button" disabled={busy} accessibilityState={{ disabled: busy, busy }} onPress={save} style={styles.saveButton}>
                {({ pressed }) => <View style={[styles.save, (pressed || busy) && styles.pressed]}>{busy ? <ActivityIndicator color="#062a1e" /> : <Text style={styles.saveText}>Save</Text>}</View>}
              </Pressable>
              {!!message && <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      
    </View>
  );
}

const styles = StyleSheet.create({
  unavailable: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 15 }, secondary: { minHeight: 44, alignItems: "center", justifyContent: "center" }, secondaryText: { color: "#078653", fontSize: 13, fontWeight: "600" },
  screen: { flex: 1, backgroundColor: "#ffffff" },
  header: { height: 58, justifyContent: "center", alignItems: "center", paddingHorizontal: 22 },
  back: { position: "absolute", left: 22, height: 30, width: 30, borderRadius: 15, backgroundColor: "#10182a", justifyContent: "center", alignItems: "center" },
  title: { fontSize: 23, fontWeight: "700", color: "#242424" },
  content: { width: "100%", maxWidth: 600, alignSelf: "center", paddingHorizontal: 18, paddingBottom: 32 },
  card: { backgroundColor: "#f7f7f7", borderWidth: 1, borderColor: "#e3e6ed", borderRadius: 23, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 25 },
  photoButton: { alignSelf: "center", width: 106, height: 103, marginBottom: 40 },
  photoFrame: { width: 100, height: 100, borderRadius: 30, borderWidth: 1.5, borderColor: "#00cf69", overflow: "hidden", backgroundColor: "white" },
  photo: { width: "100%", height: "100%" },
  cameraBadge: { position: "absolute", right: -5, bottom: -4, width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: "#00cf69", backgroundColor: "white", alignItems: "center", justifyContent: "center" },
  fields: { gap: 14 },
  field: { minHeight: 65, borderWidth: 1, borderColor: "#bcbcbc", borderRadius: 23, backgroundColor: "#ffffff", paddingHorizontal: 20, paddingVertical: 12 },
  label: { color: "#7f88a0", fontSize: 12, marginBottom: 3 },
  input: { padding: 0, fontSize: 14, color: "#11182d", minHeight: 22 },
  saveButton: { alignSelf: "center", marginTop: 24, width: 128, maxWidth: "100%", borderRadius: 25, overflow: "hidden" },
  save: { alignSelf: "center", minHeight: 49, width: 128, maxWidth: "100%", paddingVertical: 12, borderRadius: 25, backgroundColor: "#1acba3", alignItems: "center", justifyContent: "center" },
  saveText: { fontSize: 16, fontWeight: "700", color: "#000000" },
  invalid: { borderColor: "#dc2626" },
  error: { color: "#b91c1c", fontSize: 12, marginHorizontal: 8 },
  message: { fontSize: 12, color: "#306352", textAlign: "center", marginTop: 14 },
  pressed: { opacity: 0.7 },
});
