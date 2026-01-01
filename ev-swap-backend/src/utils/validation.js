/**
 * Validation utilities cho các trường dữ liệu
 */

const validationRules = {
  username: {
    regex: /^[a-zA-Z0-9_]{3,50}$/,
    message:
      "Username phải từ 3-50 ký tự, chỉ chứa chữ cái, số và dấu gạch dưới.",
  },
  phone: {
    regex: /^[0-9]{10}$/,
    message: "Số điện thoại phải là 10 chữ số.",
  },
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Email không hợp lệ.",
  },
  password: {
    minLength: 6,
    maxLength: 100,
    message: "Mật khẩu phải có từ 6-100 ký tự.",
  },
  fullName: {
    minLength: 2,
    maxLength: 100,
    message: "Tên đầy đủ phải có từ 2-100 ký tự.",
  },
};

/**
 * Validate username
 */
function validateUsername(username) {
  if (!username) {
    return { valid: false, message: "Username là bắt buộc." };
  }

  if (!validationRules.username.regex.test(username)) {
    return { valid: false, message: validationRules.username.message };
  }

  return { valid: true };
}

/**
 * Validate password
 */
function validatePassword(password) {
  if (!password) {
    return { valid: false, message: "Mật khẩu là bắt buộc." };
  }

  if (password.length < validationRules.password.minLength) {
    return {
      valid: false,
      message: `Mật khẩu phải có ít nhất ${validationRules.password.minLength} ký tự.`,
    };
  }

  if (password.length > validationRules.password.maxLength) {
    return {
      valid: false,
      message: `Mật khẩu không được vượt quá ${validationRules.password.maxLength} ký tự.`,
    };
  }

  return { valid: true };
}

/**
 * Validate full name
 */
function validateFullName(fullName) {
  if (!fullName) {
    return { valid: false, message: "Tên đầy đủ là bắt buộc." };
  }

  const trimmedName = fullName.trim();

  if (trimmedName.length < validationRules.fullName.minLength) {
    return {
      valid: false,
      message: `Tên đầy đủ phải có ít nhất ${validationRules.fullName.minLength} ký tự.`,
    };
  }

  if (trimmedName.length > validationRules.fullName.maxLength) {
    return {
      valid: false,
      message: `Tên đầy đủ không được vượt quá ${validationRules.fullName.maxLength} ký tự.`,
    };
  }

  return { valid: true };
}

/**
 * Validate phone (optional)
 */
function validatePhone(phone) {
  if (!phone) {
    return { valid: true }; // Phone là optional
  }

  if (!validationRules.phone.regex.test(phone)) {
    return { valid: false, message: validationRules.phone.message };
  }

  return { valid: true };
}

/**
 * Validate email (optional)
 */
function validateEmail(email) {
  if (!email) {
    return { valid: true }; // Email là optional
  }

  if (!validationRules.email.regex.test(email)) {
    return { valid: false, message: validationRules.email.message };
  }

  if (email.length > 100) {
    return { valid: false, message: "Email không được vượt quá 100 ký tự." };
  }

  return { valid: true };
}

/**
 * Validate registration data
 */
function validateRegistrationData(data) {
  const { username, password, fullName, phone, email } = data;

  // Validate username
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return usernameValidation;
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return passwordValidation;
  }

  // Validate full name
  const fullNameValidation = validateFullName(fullName);
  if (!fullNameValidation.valid) {
    return fullNameValidation;
  }

  // Validate phone (optional)
  const phoneValidation = validatePhone(phone);
  if (!phoneValidation.valid) {
    return phoneValidation;
  }

  // Validate email (optional)
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return emailValidation;
  }

  return { valid: true };
}

/**
 * Sanitize input data (trim và lowercase email)
 */
function sanitizeRegistrationData(data) {
  return {
    username: data.username ? data.username.trim() : null,
    password: data.password, // Không trim password để giữ nguyên spaces nếu user cố tình thêm
    fullName: data.fullName ? data.fullName.trim() : null,
    phone: data.phone ? data.phone.trim() : null,
    email: data.email ? data.email.trim().toLowerCase() : null,
  };
}

module.exports = {
  validateUsername,
  validatePassword,
  validateFullName,
  validatePhone,
  validateEmail,
  validateRegistrationData,
  sanitizeRegistrationData,
  validationRules,
};
