import crypto from 'crypto';

export const encryptCardNumber = (cardNumber: string): string => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.CARD_ENCRYPTION_KEY || '', 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(cardNumber, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

export const decryptCardNumber = (encryptedData: string): string => {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.CARD_ENCRYPTION_KEY || '', 'hex');
  const [ivHex, encryptedHex] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

export const getLastFourDigits = (cardNumber: string): string => {
  return cardNumber.slice(-4);
};

export const validateCardNumber = (
  cardNumber: string,
  cardType: string
): boolean => {
  const cardPatterns = {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$/,
    paypal: /^[0-9]{16}$/,
  };

  return (
    cardPatterns[cardType as keyof typeof cardPatterns]?.test(cardNumber) ||
    false
  );
};

export const isExpiryDateValid = (expiryDate: string): boolean => {
  const [month, year] = expiryDate.split('/');
  const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
  const today = new Date();
  return expiry > today;
};
