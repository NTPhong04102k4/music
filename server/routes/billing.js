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
      features: ["Nghe nhạc chất lượng Lossless", "Không quảng cáo làm phiền", "Tải nhạc không giới hạn"],
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

    const [packages] = await connection.execute("SELECT * FROM goicuoc WHERE GoiID = ?", [packageId]);
    if (packages.length === 0) {
      throw new Error("Gói cước không tồn tại");
    }
    const selectedPackage = packages[0];
    const amount = selectedPackage.Gia;
    const durationDays = selectedPackage.ThoiHan;

    const [billResult] = await connection.execute(
      "INSERT INTO hoadon (NguoiDungID, TongTien, TrangThai, NgayLap) VALUES (?, ?, ?, NOW())",
      [userId, amount, "paid"]
    );
    const billId = billResult.insertId;

    await connection.execute(
      "INSERT INTO chitiethoadon (HoaDonID, GoiID, SoTien, MoTa) VALUES (?, ?, ?, ?)",
      [billId, selectedPackage.GoiID, amount, `Đăng ký ${selectedPackage.Ten} qua ${paymentMethod}`]
    );

    const [existingSub] = await connection.execute(
      "SELECT * FROM dangkygoi WHERE NguoiDungID = ? AND TrangThai = 'active' AND NgayHetHan > NOW() ORDER BY NgayHetHan DESC LIMIT 1",
      [userId]
    );

    let newEndDate = new Date();
    if (existingSub.length > 0) {
      const currentEndDate = new Date(existingSub[0].NgayHetHan);
      newEndDate = new Date(currentEndDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      console.log(
        `User ${userId} gia hạn thêm ${durationDays} ngày. Hết hạn cũ: ${currentEndDate.toISOString()}, Mới: ${newEndDate.toISOString()}`
      );
    } else {
      newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + durationDays);
      console.log(`User ${userId} đăng ký mới ${durationDays} ngày. Hết hạn: ${newEndDate.toISOString()}`);
    }

    const formatDateMySQL = (date) => date.toISOString().slice(0, 19).replace("T", " ");

    await connection.execute(
      "INSERT INTO dangkygoi (NguoiDungID, GoiID, NgayDangKy, NgayHetHan, TrangThai) VALUES (?, ?, NOW(), ?, ?)",
      [userId, selectedPackage.GoiID, formatDateMySQL(newEndDate), "active"]
    );

    await connection.commit();
    res.json({ success: true, message: "Thanh toán thành công! Bạn đã là thành viên VIP." });
  } catch (error) {
    await connection.rollback();
    console.error("Payment Error:", error);
    res.status(500).json({ error: error.message || "Lỗi xử lý thanh toán" });
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
      return res.status(404).json({ error: "Hóa đơn không tồn tại hoặc không có quyền truy cập" });
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


