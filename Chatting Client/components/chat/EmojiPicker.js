// components/chat/EmojiPicker.js
import EmojiPickerReact from 'emoji-picker-react';

export const EmojiPicker = ({ onEmojiSelect, theme = 'light' }) => {
  return (
    <div className="emoji-picker-container">
      <EmojiPickerReact
        onEmojiClick={emojiData => {
          onEmojiSelect(emojiData.emoji);
        }}
        theme={theme}
        lazyLoadEmojis={true}
      />
    </div>
  );
};
