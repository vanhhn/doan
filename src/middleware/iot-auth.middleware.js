const iotAuthMiddleware = (req, res, next) => {
  try {
    // Lấy API key từ header
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "API Key không được cung cấp.",
      });
    }

    // Kiểm tra API key
    if (apiKey !== process.env.IOT_API_KEY) {
      return res.status(403).json({
        success: false,
        message: "API Key không hợp lệ.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi xác thực IoT device.",
    });
  }
};

module.exports = iotAuthMiddleware;
