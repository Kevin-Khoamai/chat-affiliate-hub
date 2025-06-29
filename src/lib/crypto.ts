
import CryptoJS from 'crypto-js';

/**
 * Encrypt message content before sending to backend
 * @param message - Plain text message
 * @param key - Encryption key (user-specific or shared)
 * @returns Encrypted message string
 */
export const encryptMessage = (message: string, key: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(message, key).toString();
    console.log('Message encrypted successfully');
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    return message; // Return original message if encryption fails
  }
};

/**
 * Decrypt message content after receiving from backend
 * @param encryptedMessage - Encrypted message string
 * @param key - Decryption key
 * @returns Plain text message
 */
export const decryptMessage = (encryptedMessage: string, key: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error('Failed to decrypt message');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return 'Message could not be decrypted';
  }
};

/**
 * Generate content hash for blockchain verification
 * @param content - Message content
 * @returns SHA-256 hash of content
 */
export const generateContentHash = (content: string): string => {
  try {
    const hash = CryptoJS.SHA256(content).toString();
    console.log('Content hash generated successfully');
    return hash;
  } catch (error) {
    console.error('Hash generation failed:', error);
    return '';
  }
};

/**
 * Encryption key management
 */
export const keyManager = {
  /**
   * Generate user-specific encryption key
   */
  generateUserKey: (userId: string): string => {
    const timestamp = Date.now();
    const randomBytes = CryptoJS.lib.WordArray.random(32);
    const key = CryptoJS.SHA256(`${userId}_${timestamp}_${randomBytes}`).toString();
    return key;
  },
  
  /**
   * Get shared group key for group chats
   */
  getGroupKey: (groupId: string): string => {
    // In a production app, this should be securely shared among group members
    return CryptoJS.SHA256(`group_${groupId}`).toString();
  },
  
  /**
   * Store key securely in localStorage (temporary solution)
   * In production, use secure key storage
   */
  storeKey: (keyId: string, key: string): void => {
    try {
      const encryptedKey = CryptoJS.AES.encrypt(key, keyId).toString();
      localStorage.setItem(`chat_key_${keyId}`, encryptedKey);
    } catch (error) {
      console.error('Key storage failed:', error);
    }
  },
  
  /**
   * Retrieve key from localStorage
   */
  getKey: (keyId: string): string | null => {
    try {
      const storedKey = localStorage.getItem(`chat_key_${keyId}`);
      if (!storedKey) return null;
      
      const bytes = CryptoJS.AES.decrypt(storedKey, keyId);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Key retrieval failed:', error);
      return null;
    }
  }
};
