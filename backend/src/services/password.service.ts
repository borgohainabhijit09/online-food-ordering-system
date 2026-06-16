import bcrypt from 'bcryptjs';

export class PasswordService {
  /**
   * Generates a temporary password meeting the following criteria:
   * - Minimum 8 characters
   * - 1 Uppercase
   * - 1 Lowercase
   * - 1 Number
   * - 1 Special Character
   */
  static generateTempPassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const specials = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specials[Math.floor(Math.random() * specials.length)];
    
    const allChars = uppercase + lowercase + numbers + specials;
    // Add 4 more random characters to reach min length 8
    for (let i = 0; i < 4; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the characters to avoid predictable patterns
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  /**
   * Validates if a password meets the strength requirements.
   * - Minimum 8 characters
   * - At least 1 Uppercase
   * - At least 1 Lowercase
   * - At least 1 Number
   * - At least 1 Special Character
   */
  static validatePassword(password: string): { isValid: boolean; message?: string } {
    if (!password || password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number.' };
    }
    if (!/[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character.' };
    }
    
    return { isValid: true };
  }

  /**
   * Hashes a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares a plain text password with a hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
