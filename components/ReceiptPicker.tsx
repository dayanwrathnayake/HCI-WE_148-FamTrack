import * as ImagePicker from "expo-image-picker";
import { Alert, Image, Pressable, Text, View } from "react-native";

type Props = {
  receiptUri: string | null;
  onSelectReceipt: (uri: string) => void;
  onRemoveReceipt: () => void;
};

export function ReceiptPicker({
  receiptUri,
  onSelectReceipt,
  onRemoveReceipt,
}: Props) {
  const handlePickReceipt = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to attach receipts.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      onSelectReceipt(result.assets[0].uri);
    }
  };

  if (receiptUri) {
    return (
      <View className="flex-row items-center justify-between h-[54px] rounded-[16px] px-3.5 bg-[#f0fdf4] border border-[#86efac]">
        <View className="flex-row items-center gap-3">
          <Image
            source={{ uri: receiptUri }}
            className="w-[36px] h-[36px] rounded-[8px]"
            resizeMode="cover"
          />
          <View>
            <Text className="text-[13px] font-semibold text-[#166534]">
              Receipt Attached
            </Text>
            <Text className="text-[11px] text-[#15803d]">
              Not saved yet
            </Text>
          </View>
        </View>

        <Pressable
          onPress={onRemoveReceipt}
          className="h-[28px] w-[28px] rounded-full bg-[#dcfce7] items-center justify-center"
          hitSlop={8}
        >
          <Text className="text-[#166534] text-[12px] font-bold">✕</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePickReceipt}
      className="flex-row items-center justify-center gap-2 h-[50px] rounded-full bg-white border border-[#d1d5db]"
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <Text className="text-[16px]">📎</Text>
      <Text className="text-[15px] font-semibold text-[#374151]">
        Add Receipt
      </Text>
    </Pressable>
  );
}
