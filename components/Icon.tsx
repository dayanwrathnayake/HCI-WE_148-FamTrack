import { SvgXml } from "react-native-svg";

import { icons, type IconName } from "../constants/icons";

type IconProps = {
  name: IconName;
  size?: number;
  width?: number;
  height?: number;
};

export function Icon({ name, size = 24, width, height }: IconProps) {
  return <SvgXml xml={icons[name]} width={width ?? size} height={height ?? size} />;
}
