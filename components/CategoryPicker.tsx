import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CATEGORIES, CategoryOption } from "../constants/expense";

interface CategoryPickerProps {
  selectedCategory: CategoryOption | null;
  onSelectCategory: (category: CategoryOption) => void;
}

export function CategoryPicker({
  selectedCategory,
  onSelectCategory,
}: CategoryPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View>
      <Text className="text-[13px] font-semibold text-[#111827] mb-2">
        Expense Category
      </Text>

      <Pressable
        className="flex-row items-center h-[48px] rounded-[12px] border border-[#e1e5ea] px-4 gap-3 bg-white"
        onPress={() => setShowPicker((prev) => !prev)}
      >
        {selectedCategory ? (
          <>
            <Text className="text-[18px]">{selectedCategory.emoji}</Text>
            <Text className="flex-1 text-[15px] font-medium text-[#111827]">
              {selectedCategory.label}
            </Text>
          </>
        ) : (
          <Text className="flex-1 text-[14px] font-medium text-[#9ca3af]">
            Select category...
          </Text>
        )}
        <Text className="text-[14px] text-[#8a93a0]">
          {showPicker ? "▴" : "▾"}
        </Text>
      </Pressable>

      {showPicker && (
        <View className="flex-row flex-wrap gap-2 mt-3">
          {CATEGORIES.map((cat) => {
            const active = cat.key === selectedCategory?.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => {
                  onSelectCategory(cat);
                  setShowPicker(false);
                }}
                className={`flex-row items-center gap-1.5 h-[36px] rounded-full px-3 border ${
                  active
                    ? "bg-[#e8f8f0] border-[#00c46a]"
                    : "bg-white border-[#e1e5ea]"
                }`}
              >
                <Text className="text-[14px]">{cat.emoji}</Text>
                <Text
                  className={`text-[13px] font-semibold ${
                    active ? "text-[#00854b]" : "text-[#5d6673]"
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
