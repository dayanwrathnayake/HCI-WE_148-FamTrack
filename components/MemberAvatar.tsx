import { Image, type ImageSourcePropType } from "react-native";

type MemberAvatarProps = {
  source: ImageSourcePropType;
  size?: number;
  overlap?: boolean;
};

export function MemberAvatar({ source, size = 20, overlap }: MemberAvatarProps) {
  return (
    <Image
      source={source}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: "white",
        marginLeft: overlap ? -6 : 0,
      }}
    />
  );
}
