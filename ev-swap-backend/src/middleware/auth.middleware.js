const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy token. Vui lòng đăng nhập.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lưu thông tin user vào request
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token không hợp lệ.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token đã hết hạn. Vui lòng đăng nhập lại.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Lỗi xác thực người dùng.",
    });
  }
};

// Export cả authMiddleware và authenticateToken (alias)
module.exports = authMiddleware;
module.exports.authenticateToken = authMiddleware;
