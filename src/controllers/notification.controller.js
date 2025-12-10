const db = require("../config/database");

// Lưu token của user
exports.saveToken = async (req, res) => {
  try {
    const { expo_push_token } = req.body;
    const customer_id = req.user.id;

    // Kiểm tra token đã tồn tại chưa
    const [existing] = await db.query(
      "SELECT * FROM push_tokens WHERE customer_id = ? AND expo_push_token = ?",
      [customer_id, expo_push_token]
    );

    if (existing.length === 0) {
      // Thêm token mới
      await db.query(
        "INSERT INTO push_tokens (customer_id, expo_push_token) VALUES (?, ?)",
        [customer_id, expo_push_token]
      );
    } else {
      // Cập nhật thời gian
      await db.query(
        "UPDATE push_tokens SET updated_at = NOW() WHERE customer_id = ? AND expo_push_token = ?",
        [customer_id, expo_push_token]
      );
    }

    res.json({ success: true, message: "Token saved successfully" });
  } catch (error) {
    console.error("Error saving token:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Gửi thông báo đến tất cả users
exports.sendToAll = async (req, res) => {
  try {
    const { title, body, data } = req.body;

    // Lấy tất cả tokens
    const [tokens] = await db.query(
      "SELECT DISTINCT expo_push_token FROM push_tokens WHERE is_active = 1"
    );

    if (tokens.length === 0) {
      return res.json({ success: true, message: "No tokens found", sent: 0 });
    }

    // Gửi thông báo qua Expo Push API
    const messages = tokens.map((token) => ({
      to: token.expo_push_token,
      sound: "default",
      title,
      body,
      data: data || {},
      priority: "high",
      channelId: "default",
    }));

    // Gửi theo batch (100 notifications mỗi lần)
    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    let totalSent = 0;
    for (const chunk of chunks) {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });

      const result = await response.json();
      totalSent += chunk.length;
    }

    // Lưu lịch sử gửi thông báo
    await db.query(
      "INSERT INTO notification_history (title, body, recipient_count, sent_by, data) VALUES (?, ?, ?, ?, ?)",
      [title, body, totalSent, req.user?.id || null, JSON.stringify(data || {})]
    );

    res.json({
      success: true,
      message: "Notifications sent successfully",
      sent: totalSent,
    });
  } catch (error) {
    console.error("Error sending notifications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Gửi thông báo đến một user cụ thể
exports.sendToUser = async (req, res) => {
  try {
    const { customer_id, title, body, data } = req.body;

    // Lấy token của user
    const [tokens] = await db.query(
      "SELECT expo_push_token FROM push_tokens WHERE customer_id = ? AND is_active = 1",
      [customer_id]
    );

    if (tokens.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No tokens found for this user" });
    }

    // Gửi thông báo
    const messages = tokens.map((token) => ({
      to: token.expo_push_token,
      sound: "default",
      title,
      body,
      data: data || {},
      priority: "high",
      channelId: "default",
    }));

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    res.json({
      success: true,
      message: "Notification sent successfully",
      result,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Lấy lịch sử gửi thông báo
exports.getHistory = async (req, res) => {
  try {
    const [history] = await db.query(
      `SELECT nh.*, c.name as sent_by_name 
       FROM notification_history nh
       LEFT JOIN customers c ON nh.sent_by = c.id
       ORDER BY nh.created_at DESC
       LIMIT 50`
    );

    res.json({ success: true, history });
  } catch (error) {
    console.error("Error getting history:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Xóa token (khi user logout)
exports.deleteToken = async (req, res) => {
  try {
    const { expo_push_token } = req.body;
    const customer_id = req.user.id;

    await db.query(
      "UPDATE push_tokens SET is_active = 0 WHERE customer_id = ? AND expo_push_token = ?",
      [customer_id, expo_push_token]
    );

    res.json({ success: true, message: "Token deleted successfully" });
  } catch (error) {
    console.error("Error deleting token:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
