import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { MemberInitialsAvatar } from "./MemberInitialsAvatar";
import { getAvatarPalette, getInitials } from "../utils/members";

export type SelectableMember = {
  id?: string;
  key?: string;
  name?: string;
  displayName?: string;
  avatar?: any;
};

type Props<T extends SelectableMember> = {
  label: string;
  selectedMembers: T[];
  allMembers: T[];
  onAdd: (member: T) => void;
  onRemove: (idOrKey: string) => void;
};

export function MemberSelector<T extends SelectableMember>({
  label,
  selectedMembers,
  allMembers,
  onAdd,
  onRemove,
}: Props<T>) {
  const [showPicker, setShowPicker] = useState(false);

  const getMemberId = (m: T) => m.id || m.key || "";
  const getMemberName = (m: T) => m.displayName || m.name || "";

  const available = allMembers.filter(
    (m) => !selectedMembers.some((s) => getMemberId(s) === getMemberId(m)),
  );

  return (
    <View className="mt-4">
      <Text className="text-[13px] font-semibold text-[#111827] mb-2">
        {label}
      </Text>

      <View className="flex-row flex-wrap items-center gap-2">
        {selectedMembers.map((m) => {
          const id = getMemberId(m);
          const name = getMemberName(m);
          const palette = getAvatarPalette(id);
          const initials = getInitials(name);

          return (
            <View
              key={id}
              className="flex-row items-center gap-1.5 h-[34px] rounded-full pl-1.5 pr-2.5 bg-[#e8f8f0] border border-[#9de3c0]"
            >
              {m.avatar ? (
                <Image
                  source={m.avatar}
                  style={{ width: 22, height: 22, borderRadius: 11 }}
                  resizeMode="cover"
                />
              ) : (
                <MemberInitialsAvatar
                  initials={initials}
                  backgroundColor={palette.background}
                  textColor={palette.text}
                  size={22}
                />
              )}
              <Text className="text-[13px] font-semibold text-[#00854b]">
                {name}
              </Text>
              <Pressable onPress={() => onRemove(id)} hitSlop={6}>
                <Text className="text-[11px] font-bold text-[#00854b] ml-0.5">
                  ✕
                </Text>
              </Pressable>
            </View>
          );
        })}

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
          {available.map((m) => {
            const id = getMemberId(m);
            const name = getMemberName(m);
            const palette = getAvatarPalette(id);
            const initials = getInitials(name);

            return (
              <Pressable
                key={id}
                onPress={() => {
                  onAdd(m);
                  setShowPicker(false);
                }}
                className="flex-row items-center gap-1.5 h-[32px] rounded-full pl-1.5 pr-2.5 bg-white border border-gray-300"
              >
                {m.avatar ? (
                  <Image
                    source={m.avatar}
                    style={{ width: 20, height: 20, borderRadius: 10 }}
                    resizeMode="cover"
                  />
                ) : (
                  <MemberInitialsAvatar
                    initials={initials}
                    backgroundColor={palette.background}
                    textColor={palette.text}
                    size={20}
                  />
                )}
                <Text className="text-[12px] font-medium text-gray-700">
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
