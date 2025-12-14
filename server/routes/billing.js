const express = require("express");
const pool = require("../db");
const authenticateToken = require("../middleware/authenticateToken");

const router = express.Router();

// 1. Lấy danh sách gói cước VIP để hiển thị
router.get("/vip-packages", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT GoiID as id, Ten as name, Gia as price, ThoiHan as duration, MoTa as description
      FROM goicuoc
      WHERE QuyenID = 2
      ORDER BY Gia ASC
    `);

    const packages = rows.map((pkg) => ({
      ...pkg,
      formattedPrice: new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(pkg.price),
      features: [
        "Nghe nhạc chất lượng Lossless",
        "Không quảng cáo làm phiền",
        "Tải nhạc không giới hạn",
      ],
      isRecommended: pkg.duration === 180,
    }));

    res.json(packages);
  } catch (error) {
    console.error("Error fetching vip packages:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// 2. Thanh toán & đăng ký gói VIP
router.post("/payment/process", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.userId;
    const { packageId, paymentMethod } = req.body;

    const [packages] = await connection.execute(
      "SELECT * FROM goicuoc WHERE GoiID = ?",
      [packageId]
    );
    if (packages.length === 0) {
      throw new Error("Gói cước không tồn tại");
    }
    const selectedPackage = packages[0];
    const amount = selectedPackage.Gia;
    const durationDays = selectedPackage.ThoiHan;

    // Lấy gói đang active (nếu có)
    const [currentSubs] = await connection.execute(
      `
      SELECT dk.DangKyID, dk.GoiID, dk.NgayHetHan, g.Gia
      FROM dangkygoi dk
      JOIN goicuoc g ON dk.GoiID = g.GoiID
      WHERE dk.NguoiDungID = ?
        AND dk.TrangThai = 'active'
        AND (dk.NgayHetHan IS NULL OR dk.NgayHetHan > NOW())
      ORDER BY dk.NgayHetHan DESC
      LIMIT 1
    `,
      [userId]
    );
    const currentSub = currentSubs.length > 0 ? currentSubs[0] : null;

    if (currentSub) {
      // Không mua lại đúng gói đang dùng
      if (Number(currentSub.GoiID) === Number(selectedPackage.GoiID)) {
        await connection.rollback();
        return res
          .status(400)
          .json({ error: "Bạn đang sử dụng gói này, không thể mua lại." });
      }

      const currentPrice = Number(currentSub.Gia || 0);
      const selectedPrice = Number(selectedPackage.Gia || 0);

      // Hạ gói / bằng giá -> không trả tiền (xử lý ở endpoint /api/subscription/change)
      if (selectedPrice <= currentPrice) {
        await connection.rollback();
        return res.status(400).json({
          error:
            "Gói này thấp hơn hoặc bằng gói hiện tại. Vui lòng dùng chức năng chuyển gói (miễn phí).",
        });
      }
    }

    if (!paymentMethod) {
      await connection.rollback();
      return res.status(400).json({ error: "Thiếu phương thức thanh toán" });
    }

    const [billResult] = await connection.execute(
      "INSERT INTO hoadon (NguoiDungID, TongTien, TrangThai, NgayLap) VALUES (?, ?, ?, NOW())",
      [userId, amount, "paid"]
    );
    const billId = billResult.insertId;

    await connection.execute(
      "INSERT INTO chitiethoadon (HoaDonID, GoiID, SoTien, MoTa) VALUES (?, ?, ?, ?)",
      [
        billId,
        selectedPackage.GoiID,
        amount,
        `Đăng ký ${selectedPackage.Ten} qua ${paymentMethod}`,
      ]
    );

    // Upgrade: trả tiền như mua mới (không cộng dồn thời gian)
    let newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + Number(durationDays || 0));

    // Nếu đang có gói active -> deactivate gói cũ trước khi tạo gói mới
    if (currentSub) {
      await connection.execute(
        "UPDATE dangkygoi SET TrangThai = ? WHERE DangKyID = ?",
        ["inactive", currentSub.DangKyID]
      );
    }

    const formatDateMySQL = (date) =>
      date.toISOString().slice(0, 19).replace("T", " ");

    await connection.execute(
      "INSERT INTO dangkygoi (NguoiDungID, GoiID, NgayDangKy, NgayHetHan, TrangThai) VALUES (?, ?, NOW(), ?, ?)",
      [userId, selectedPackage.GoiID, formatDateMySQL(newEndDate), "active"]
    );

    await connection.commit();
    res.json({
      success: true,
      message: "Thanh toán thành công!",
      action: currentSub ? "upgrade" : "purchase",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Payment Error:", error);
    res.status(500).json({ error: error.message || "Lỗi xử lý thanh toán" });
  } finally {
    connection.release();
  }
});

// 2.1 Chuyển gói (hạ gói / bằng giá) - không thanh toán
router.post("/subscription/change", authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const userId = req.user.userId;
    const { packageId } = req.body || {};
    if (!packageId) {
      await connection.rollback();
      return res.status(400).json({ error: "Thiếu packageId" });
    }

    // Rule: chỉ cho phép hạ gói trong 7 ngày đầu kể từ ngày user đăng ký tài khoản
    const [userRows] = await connection.execute(
      "SELECT NgayThamGia FROM nguoidung WHERE NguoiDungID = ? LIMIT 1",
      [userId]
    );
    const joinDate = userRows?.[0]?.NgayThamGia
      ? new Date(userRows[0].NgayThamGia)
      : null;
    const nowMs = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const isWithin7Days =
      !joinDate || Number.isNaN(joinDate.getTime())
        ? true
        : nowMs - joinDate.getTime() <= SEVEN_DAYS_MS;

    const [selectedRows] = await connection.execute(
      "SELECT * FROM goicuoc WHERE GoiID = ?",
      [packageId]
    );
    if (selectedRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Gói cước không tồn tại" });
    }
    const selectedPackage = selectedRows[0];

    const [currentSubs] = await connection.execute(
      `
      SELECT dk.DangKyID, dk.GoiID, dk.NgayHetHan, g.Gia
      FROM dangkygoi dk
      JOIN goicuoc g ON dk.GoiID = g.GoiID
      WHERE dk.NguoiDungID = ?
        AND dk.TrangThai = 'active'
        AND (dk.NgayHetHan IS NULL OR dk.NgayHetHan > NOW())
      ORDER BY dk.NgayHetHan DESC
      LIMIT 1
    `,
      [userId]
    );
    if (currentSubs.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: "Bạn chưa có gói nào để chuyển." });
    }
    const currentSub = currentSubs[0];

    if (Number(currentSub.GoiID) === Number(selectedPackage.GoiID)) {
      await connection.rollback();
      return res.status(400).json({ error: "Bạn đang sử dụng gói này." });
    }

    const currentPrice = Number(currentSub.Gia || 0);
    const selectedPrice = Number(selectedPackage.Gia || 0);

    // Chỉ cho phép hạ gói hoặc bằng giá, upgrade phải trả tiền
    if (selectedPrice > currentPrice) {
      await connection.rollback();
      return res
        .status(400)
        .json({ error: "Nâng gói cần thanh toán như mua mới." });
    }

    // Không cho phép hạ xuống gói Free
    if (
      Number(selectedPackage.Gia || 0) === 0 ||
      Number(selectedPackage.QuyenID || 0) === 1
    ) {
      await connection.rollback();
      return res.status(400).json({ error: "Không thể hạ gói xuống Free." });
    }

    // Hạ gói/bằng giá nhưng đã quá 7 ngày kể từ ngày đăng ký -> không cho phép
    if (!isWithin7Days) {
      await connection.rollback();
      return res.status(403).json({
        error: "Chỉ được hạ gói trong 7 ngày đầu kể từ ngày đăng ký tài khoản.",
      });
    }

    // Deactivate gói cũ
    await connection.execute(
      "UPDATE dangkygoi SET TrangThai = ? WHERE DangKyID = ?",
      ["inactive", currentSub.DangKyID]
    );

    // Giữ nguyên ngày hết hạn hiện tại (không trả tiền khi hạ gói)
    const newExpiry = currentSub.NgayHetHan;
    await connection.execute(
      "INSERT INTO dangkygoi (NguoiDungID, GoiID, NgayDangKy, NgayHetHan, TrangThai) VALUES (?, ?, NOW(), ?, ?)",
      [userId, selectedPackage.GoiID, newExpiry, "active"]
    );

    await connection.commit();
    res.json({
      success: true,
      message: "Đã chuyển gói (miễn phí).",
      action: "downgrade",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Change subscription error:", error);
    res.status(500).json({ error: error.message || "Lỗi xử lý chuyển gói" });
  } finally {
    connection.release();
  }
});

// 3. Lấy danh sách hóa đơn
router.get("/invoices", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [rows] = await pool.execute(
      `
      SELECT HoaDonID as id, NgayLap as date, TongTien as totalAmount, TrangThai as status
      FROM hoadon
      WHERE NguoiDungID = ?
      ORDER BY NgayLap DESC
    `,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

// 4. Lấy chi tiết hóa đơn
router.get("/invoices/:id", authenticateToken, async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const userId = req.user.userId;

    const [invoiceRows] = await pool.execute(
      `
      SELECT HoaDonID as id, NgayLap as date, TongTien as totalAmount, TrangThai as status
      FROM hoadon
      WHERE HoaDonID = ? AND NguoiDungID = ?
    `,
      [invoiceId, userId]
    );

    if (invoiceRows.length === 0) {
      return res
        .status(404)
        .json({ error: "Hóa đơn không tồn tại hoặc không có quyền truy cập" });
    }
    const invoice = invoiceRows[0];

    const [detailRows] = await pool.execute(
      `
      SELECT c.ChiTietID as id, c.SoTien as amount, c.MoTa as description, 
             g.Ten as packageName
      FROM chitiethoadon c
      LEFT JOIN goicuoc g ON c.GoiID = g.GoiID
      WHERE c.HoaDonID = ?
    `,
      [invoiceId]
    );

    res.json({ ...invoice, items: detailRows });
  } catch (error) {
    console.error("Error fetching invoice detail:", error);
    res.status(500).json({ error: "Lỗi server" });
  }
});

module.exports = router;
