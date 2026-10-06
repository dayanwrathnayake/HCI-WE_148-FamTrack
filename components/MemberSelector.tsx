import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Member } from "../constants/expense";

type Props = {
  label: string;
  selectedMembers: Member[];
  allMembers: Member[];
  onAdd: (member: Member) => void;
  onRemove: (key: string) => void;
};

export function MemberSelector({
  label,
  selectedMembers,
  allMembers,
  onAdd,
  onRemove,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const available = allMembers.filter(
    (m) => !selectedMembers.some((s) => s.key === m.key),
  );

  return (
    <View className="mt-4">
      <Text className="text-[13px] font-semibold text-[#111827] mb-2">
        {label}
      </Text>

      <View className="flex-row flex-wrap items-center gap-2">
        {selectedMembers.map((m) => (
          <View
            key={m.key}
            className="flex-row items-center gap-1.5 h-[34px] rounded-full px-2.5 bg-[#e8f8f0] border border-[#9de3c0]"
          >
            <Image
              source={m.avatar}
              style={{ width: 22, height: 22, borderRadius: 11 }}
              resizeMode="cover"
            />
            <Text className="text-[13px] font-semibold text-[#00854b]">
              {m.name}
            </Text>
            <Pressable onPress={() => onRemove(m.key)} hitSlop={6}>
              <Text className="text-[11px] font-bold text-[#00854b] ml-0.5">
                ✕
              </Text>
            </Pressable>
          </View>
        ))}

        {available.length > 0 && (
          <Pressable
            onPress={() => setShowPicker((v) => !v)}
            className="h-[34px] w-[34px] rounded-full items-center justify-center bg-[#f4f6f8] border border-[#e1e5ea]"
          >
            <Text className="text-[13px] text-[#5d6673]">
              {showPicker ? "✕" : "▾"}
            </Text>
          </Pressable>
        )}
      </View>

      {showPicker && available.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-2.5 p-2 rounded-xl bg-gray-50 border border-gray-200">
          {available.map((m) => (
            <Pressable
              key={m.key}
              onPress={() => {
                onAdd(m);
                setShowPicker(false);
              }}
              className="flex-row items-center gap-1.5 h-[32px] rounded-full px-2.5 bg-white border border-gray-300"
            >
              <Image
                source={m.avatar}
                style={{ width: 20, height: 20, borderRadius: 10 }}
                resizeMode="cover"
              />
              <Text className="text-[12px] font-medium text-gray-700">
                {m.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
