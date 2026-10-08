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
  initials?: string;
  avatarColor?: string;
  avatarTextColor?: string;
};

type Props<T extends SelectableMember> = {
  label: string;
  selectedMembers: T[];
  allMembers: T[];
  onAdd: (member: T) => void;
  onRemove: (idOrKey: string) => void;
};

function MemberPicture({
  member,
  size,
}: {
  member: SelectableMember;
  size: number;
}) {
  if (member.avatar) {
    return (
      <Image
        source={member.avatar}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
      />
    );
  }

  const id = member.id || member.key || "";
  const name = member.displayName || member.name || "";
  const palette = getAvatarPalette(id);
  const initials = member.initials ?? getInitials(name);

  return (
    <MemberInitialsAvatar
      initials={initials || "?"}
      backgroundColor={member.avatarColor ?? palette.background}
      textColor={member.avatarTextColor ?? palette.text}
      size={size}
    />
  );
}

export function MemberSelector<T extends SelectableMember>({
  label,
  selectedMembers,
  allMembers,
  onAdd,
  onRemove,
}: Props<T>) {
  const [showPicker, setShowPicker] = useState(false);

  const getMemberId = (m: T) => m.key || m.id || "";
  const getMemberName = (m: T) => m.name || m.displayName || "";

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

          return (
            <View
              key={id}
              className="flex-row items-center gap-1.5 h-[34px] rounded-full pl-1.5 pr-2.5 bg-[#e8f8f0] border border-[#9de3c0]"
            >
              <MemberPicture member={m} size={22} />
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

            return (
              <Pressable
                key={id}
                onPress={() => {
                  onAdd(m);
                  setShowPicker(false);
                }}
                className="flex-row items-center gap-1.5 h-[32px] rounded-full pl-1.5 pr-2.5 bg-white border border-gray-300"
              >
                <MemberPicture member={m} size={20} />
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
