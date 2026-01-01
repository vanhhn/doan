/**
 * Validation Middleware cho các routes
 */

const {
  validateRegistrationData,
  validateUsername,
  validatePassword,
  validateEmail,
  validatePhone,
  sanitizeRegistrationData,
} = require("../utils/validation");

/**
 * Middleware validate dữ liệu đăng ký
 */
exports.validateRegister = (req, res, next) => {
  const { username, password, fullName, phone, email } = req.body;

  const validationResult = validateRegistrationData({
    username,
    password,
    fullName,
    phone,
    email,
  });

  if (!validationResult.valid) {
    return res.status(400).json({
      success: false,
      message: validationResult.message,
    });
  }

  // Sanitize dữ liệu và lưu vào req.body
  req.body = sanitizeRegistrationData(req.body);

  next();
};

/**
 * Middleware validate dữ liệu đăng nhập
 */
exports.validateLogin = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username và password là bắt buộc.",
    });
  }

  // Validate username format
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return res.status(400).json({
      success: false,
      message: usernameValidation.message,
    });
  }

  next();
};

/**
 * Middleware validate email reset password
 */
exports.validateResetPassword = (req, res, next) => {
  const { phone, newPassword } = req.body;

  if (!phone || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Số điện thoại và mật khẩu mới là bắt buộc.",
    });
  }

  // Validate phone
  const phoneValidation = validatePhone(phone);
  if (!phoneValidation.valid) {
    return res.status(400).json({
      success: false,
      message: phoneValidation.message,
    });
  }

  // Validate password
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return res.status(400).json({
      success: false,
      message: passwordValidation.message,
    });
  }

  next();
};

/**
 * Middleware validate cập nhật profile
 */
exports.validateUpdateProfile = (req, res, next) => {
  const { fullName, email, phone } = req.body;

  // Validate fullName nếu có
  if (fullName !== undefined) {
    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Tên đầy đủ phải có ít nhất 2 ký tự.",
      });
    }

    if (fullName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Tên đầy đủ không được vượt quá 100 ký tự.",
      });
    }
  }

  // Validate email nếu có
  if (email !== undefined && email !== null) {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        success: false,
        message: emailValidation.message,
      });
    }
  }

  // Validate phone nếu có
  if (phone !== undefined && phone !== null) {
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.valid) {
      return res.status(400).json({
        success: false,
        message: phoneValidation.message,
      });
    }
  }

  // Sanitize dữ liệu
  if (fullName) req.body.fullName = fullName.trim();
  if (email) req.body.email = email.trim().toLowerCase();
  if (phone) req.body.phone = phone.trim();

  next();
};

/**
 * Middleware validate transaction/swap request
 */
exports.validateSwapRequest = (req, res, next) => {
  const { stationId } = req.body;

  if (!stationId) {
    return res.status(400).json({
      success: false,
      message: "Station ID là bắt buộc.",
    });
  }

  if (isNaN(stationId) || stationId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Station ID không hợp lệ.",
    });
  }

  next();
};

/**
 * Middleware validate payment request
 */
exports.validatePaymentRequest = (req, res, next) => {
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({
      success: false,
      message: "Số tiền là bắt buộc.",
    });
  }

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Số tiền phải lớn hơn 0.",
    });
  }

  if (amount > 10000000) {
    // Giới hạn 10 triệu
    return res.status(400).json({
      success: false,
      message: "Số tiền không được vượt quá 10,000,000 VNĐ.",
    });
  }

  next();
};

module.exports = exports;
