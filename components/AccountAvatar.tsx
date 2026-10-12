import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { getDownloadURL, ref } from "firebase/storage";
import { storage } from "../lib/firebase";
import { getInitials } from "../utils/members";

export function AccountAvatar({ name, photoPath, previewUri, size = 78 }: { name: string; photoPath?: string; previewUri?: string; size?: number }) {
  const [photo, setPhoto] = useState<{ path: string; url: string } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (photoPath) getDownloadURL(ref(storage, photoPath)).then(url => { if (active) setPhoto({ path: photoPath, url }); }).catch(() => undefined);
    return () => { active = false; };
  }, [photoPath]);
  const uri = previewUri || (photo?.path === photoPath ? photo?.url : undefined);
  return <View style={[styles.frame, { width: size, height: size, borderRadius: size * 0.32 }]} accessibilityLabel={`${name} profile avatar`}>
    {uri && failed !== uri ? <Image source={{ uri }} style={styles.photo} onError={() => setFailed(uri)} resizeMode="cover" /> : <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{getInitials(name)}</Text>}
  </View>;
}
const styles = StyleSheet.create({ frame: { borderWidth: 1.5, borderColor: "#00ce69", overflow: "hidden", backgroundColor: "#e8f8f2", alignItems: "center", justifyContent: "center" }, photo: { width: "100%", height: "100%" }, initials: { fontWeight: "700", color: "#078653" } });
