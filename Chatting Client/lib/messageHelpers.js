// lib/messageHelpers.js
export const prepareMessageFormData = ({
  content,
  chatId,
  replyToId,
  files,
}) => {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('chatId', chatId);

  if (replyToId) {
    formData.append('replyToId', replyToId);
  }

  if (files && files.length > 0) {
    files.forEach(file => {
      formData.append('files', file);
    });
  }

  return formData;
};
