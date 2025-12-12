const crypto = require("crypto");
const prisma = require("../config/database");

// MoMo Configuration
const MOMO_CONFIG = {
  partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO",
  accessKey: process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85",
  secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz",
  endpoint:
    process.env.MOMO_ENDPOINT ||
    "https://test-payment.momo.vn/v2/gateway/api/create",
  returnUrl:
    process.env.MOMO_RETURN_URL ||
    "https://ev-swap-backend-2025-b268b8b1f366.herokuapp.com/api/payment/momo/return",
  notifyUrl:
    process.env.MOMO_NOTIFY_URL ||
    "https://ev-swap-backend-2025-b268b8b1f366.herokuapp.com/api/payment/momo/callback",
};

// Tạo signature cho MoMo request
const createSignature = (data, secretKey) => {
  const rawSignature = Object.keys(data)
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("&");

  return crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");
};

// Tạo payment request với MoMo
const createMoMoPayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const customerId = req.user.id;

    console.log("📱 Create MoMo Payment:", { customerId, amount });

    // Validate amount
    if (!amount || amount < 10000) {
      return res.status(400).json({
        success: false,
        message: "Số tiền nạp tối thiểu là 10,000đ",
      });
    }

    // Tạo orderId unique
    const orderId = `EVSWAP_${Date.now()}_${customerId}`;
    const requestId = orderId;

    // Tạo payment request data
    const requestData = {
      partnerCode: MOMO_CONFIG.partnerCode,
      partnerName: "EV Swap",
      storeId: "EVSwapStore",
      requestId: requestId,
      amount: amount.toString(),
      orderId: orderId,
      orderInfo: `Nap tien vi EV Swap`,
      redirectUrl: MOMO_CONFIG.returnUrl,
      ipnUrl: MOMO_CONFIG.notifyUrl,
      requestType: "captureWallet",
      extraData: "",
      items: [],
      userInfo: {
        name: "EV Swap Customer",
        phoneNumber: "0987654321",
        email: "customer@evswap.vn",
      },
      lang: "vi",
      autoCapture: true,
      orderGroupId: "",
    };

    // Tạo signature
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${requestData.amount}&extraData=${requestData.extraData}&ipnUrl=${requestData.ipnUrl}&orderId=${requestData.orderId}&orderInfo=${requestData.orderInfo}&partnerCode=${requestData.partnerCode}&redirectUrl=${requestData.redirectUrl}&requestId=${requestData.requestId}&requestType=${requestData.requestType}`;

    const signature = crypto
      .createHmac("sha256", MOMO_CONFIG.secretKey)
      .update(rawSignature)
      .digest("hex");

    requestData.signature = signature;

    console.log("📝 MoMo Request Data:", requestData);

    // Gọi MoMo API
    const response = await fetch(MOMO_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    });

    const momoResponse = await response.json();
    console.log("💳 MoMo Response:", momoResponse);

    if (momoResponse.resultCode === 0) {
      // Lưu thông tin payment vào database
      await prisma.payment.create({
        data: {
          customerId,
          orderId,
          requestId,
          amount,
          status: "pending",
          paymentMethod: "momo",
          momoData: JSON.stringify(momoResponse),
        },
      });

      res.json({
        success: true,
        message: "Tạo thanh toán MoMo thành công",
        data: {
          paymentUrl: momoResponse.payUrl,
          orderId: orderId,
          qrCodeUrl: momoResponse.qrCodeUrl,
          deeplink: momoResponse.deeplink,
        },
      });
    } else {
      console.error("❌ MoMo Error:", momoResponse);
      res.status(400).json({
        success: false,
        message: momoResponse.message || "Không thể tạo thanh toán MoMo",
        error: momoResponse,
      });
    }
  } catch (error) {
    console.error("❌ Create MoMo Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo thanh toán MoMo",
      error: error.message,
    });
  }
};

// Xử lý callback từ MoMo (IPN - Instant Payment Notification)
const momoCallback = async (req, res) => {
  try {
    console.log("🔔 MoMo IPN Callback:", req.body);

    const {
      orderId,
      requestId,
      amount,
      resultCode,
      message,
      transId,
      signature,
      extraData,
    } = req.body;

    // Verify signature
    const signatureData = {
      accessKey: MOMO_CONFIG.accessKey,
      amount: amount.toString(),
      extraData: extraData || "",
      message: message,
      orderId: orderId,
      orderInfo: req.body.orderInfo || "",
      orderType: req.body.orderType || "",
      partnerCode: MOMO_CONFIG.partnerCode,
      payType: req.body.payType || "",
      requestId: requestId,
      responseTime: req.body.responseTime || "",
      resultCode: resultCode.toString(),
      transId: transId ? transId.toString() : "",
    };

    const expectedSignature = createSignature(
      signatureData,
      MOMO_CONFIG.secretKey
    );

    // Skip signature validation in development mode for testing
    if (
      process.env.NODE_ENV !== "development" &&
      signature !== expectedSignature
    ) {
      console.error("❌ Invalid signature");
      console.error("Expected:", expectedSignature);
      console.error("Received:", signature);
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    console.log("✅ Signature valid (or skipped in dev mode)");

    // Tìm payment trong database
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      console.error("❌ Payment not found:", orderId);
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Cập nhật status
    if (resultCode === 0) {
      // Thanh toán thành công
      await prisma.payment.update({
        where: { orderId },
        data: {
          status: "completed",
          transactionId: transId.toString(),
          completedAt: new Date(),
        },
      });

      // Cộng tiền vào tài khoản
      await prisma.customer.update({
        where: { id: payment.customerId },
        data: {
          balance: {
            increment: payment.amount,
          },
        },
      });

      console.log("✅ Payment completed:", orderId, "Amount:", amount);
    } else {
      // Thanh toán thất bại
      await prisma.payment.update({
        where: { orderId },
        data: {
          status: "failed",
          errorMessage: message,
        },
      });

      console.log("❌ Payment failed:", orderId, "Message:", message);
    }

    res.status(200).json({
      success: true,
      message: "Callback processed",
    });
  } catch (error) {
    console.error("❌ MoMo Callback Error:", error);
    res.status(500).json({
      success: false,
      message: "Error processing callback",
      error: error.message,
    });
  }
};

// Xử lý return URL từ MoMo
const momoReturn = async (req, res) => {
  try {
    console.log("🔙 MoMo Return:", req.query);

    const { orderId, resultCode, message, amount, transId } = req.query;

    // Nếu thanh toán thành công, tự động complete payment
    if (resultCode === "0" && orderId) {
      try {
        // Tìm payment trong database
        const payment = await prisma.payment.findUnique({
          where: { orderId },
        });

        if (payment && payment.status === "pending") {
          // Cập nhật payment status
          await prisma.payment.update({
            where: { orderId },
            data: {
              status: "completed",
              transactionId: transId || `MOMO_${Date.now()}`,
              completedAt: new Date(),
            },
          });

          // Cộng tiền vào tài khoản
          await prisma.customer.update({
            where: { id: payment.customerId },
            data: {
              balance: {
                increment: payment.amount,
              },
            },
          });

          console.log(
            `✅ Payment auto-completed from return URL: ${orderId}, Amount: ${payment.amount}`
          );
        }
      } catch (error) {
        console.error("❌ Error auto-completing payment:", error);
      }
    }

    // Redirect về app với kết quả
    const resultMessage = resultCode === "0" ? "success" : "failed";

    // Trả về HTML đơn giản để hiển thị kết quả
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Kết quả thanh toán</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .success {
            color: #16A34A;
          }
          .failed {
            color: #DC2626;
          }
          h1 {
            margin-bottom: 20px;
          }
          p {
            color: #666;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="${resultMessage}">${
      resultCode === "0" ? "✓ Thành công!" : "✗ Thất bại"
    }</h1>
          <p>${
            resultCode === "0"
              ? "Nạp tiền thành công!"
              : message || "Thanh toán không thành công"
          }</p>
          <p>Mã đơn hàng: ${orderId}</p>
          <p style="margin-top: 20px;">Vui lòng đóng cửa sổ này và quay lại ứng dụng</p>
        </div>
        <script>
          // Auto close after 3 seconds
          setTimeout(() => {
            window.close();
          }, 3000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("❌ MoMo Return Error:", error);
    res.status(500).send("Error processing payment return");
  }
};

// Manual complete payment for testing (MoMo test env doesn't call IPN)
const manualCompleteMoMo = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.user.id;

    console.log(`🔧 Manual completing payment: ${orderId}`);

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { orderId },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Verify customer owns this payment
    if (payment.customerId !== customerId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Check if already completed
    if (payment.status === "completed") {
      return res.json({
        success: true,
        message: "Payment already completed",
        data: {
          balance: (
            await prisma.customer.findUnique({ where: { id: customerId } })
          ).balance,
        },
      });
    }

    // Update payment status
    await prisma.payment.update({
      where: { orderId },
      data: {
        status: "completed",
        transactionId: `MANUAL_${Date.now()}`,
        completedAt: new Date(),
      },
    });

    // Add balance to customer
    const updatedCustomer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        balance: {
          increment: payment.amount,
        },
      },
    });

    console.log(
      `✅ Manual payment completed: ${orderId}, New balance: ${updatedCustomer.balance}`
    );

    res.json({
      success: true,
      message: "Payment completed successfully",
      data: {
        balance: updatedCustomer.balance,
        amount: payment.amount,
      },
    });
  } catch (error) {
    console.error("❌ Manual Complete Error:", error);
    res.status(500).json({
      success: false,
      message: "Error completing payment",
    });
  }
};

module.exports = {
  createMoMoPayment,
  momoCallback,
  momoReturn,
  manualCompleteMoMo,
};
