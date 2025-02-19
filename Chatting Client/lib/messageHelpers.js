// lib/messageHelpers.js
export const prepareMessageFormData = messageData => {
  console.log('[MessageHelpers] Preparing FormData for message:', messageData);
  const formData = new FormData();

  // Add text content if present
  if (messageData.content?.trim()) {
    formData.append('content', messageData.content.trim());
  }

  // Add chat ID
  if (messageData.chatId) {
    formData.append('chatId', messageData.chatId);
  }

  // Add reply reference if present
  if (messageData.replyToId) {
    formData.append('replyToId', messageData.replyToId);
  }

  // Handle file attachments
  if (messageData.files?.length > 0) {
    console.log('[MessageHelpers] Processing files:', messageData.files.length);

    messageData.files.forEach(fileObj => {
      const { file, type } = fileObj;
      const fieldName =
        type === 'image'
          ? 'images'
          : type === 'audio'
          ? 'media'
          : type === 'video'
          ? 'media'
          : 'doc';

      console.log('[MessageHelpers] Adding file:', {
        name: file.name,
        type: type,
        fieldName: fieldName,
      });

      formData.append(fieldName, file);
    });
  }

  return formData;
};

export const validateMessageContent = (content, files) => {
  if (!content?.trim() && (!files || files.length === 0)) {
    return false;
  }
  return true;
};
