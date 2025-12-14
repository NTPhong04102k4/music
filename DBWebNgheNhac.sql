-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: nhacsodb_chuanhoa
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `album`
--

DROP TABLE IF EXISTS `album`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `album` (
  `AlbumID` int NOT NULL AUTO_INCREMENT,
  `TieuDe` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NgayPhatHanh` date DEFAULT NULL,
  `AnhBia` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`AlbumID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `album`
--

LOCK TABLES `album` WRITE;
/*!40000 ALTER TABLE `album` DISABLE KEYS */;
INSERT INTO `album` VALUES (1,'Chúng Ta','2025-01-01',NULL),(2,'Singles 2024','2024-12-31',NULL),(3,'Singles 2025','2025-12-31',NULL),(4,'Ballads Việt','2025-02-14',NULL);
/*!40000 ALTER TABLE `album` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `album_nghesi`
--

DROP TABLE IF EXISTS `album_nghesi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `album_nghesi` (
  `AlbumID` int NOT NULL,
  `NgheSiID` int NOT NULL,
  PRIMARY KEY (`AlbumID`,`NgheSiID`),
  KEY `NgheSiID` (`NgheSiID`),
  CONSTRAINT `album_nghesi_ibfk_1` FOREIGN KEY (`AlbumID`) REFERENCES `album` (`AlbumID`) ON DELETE CASCADE,
  CONSTRAINT `album_nghesi_ibfk_2` FOREIGN KEY (`NgheSiID`) REFERENCES `nghesi` (`NgheSiID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `album_nghesi`
--

LOCK TABLES `album_nghesi` WRITE;
/*!40000 ALTER TABLE `album_nghesi` DISABLE KEYS */;
INSERT INTO `album_nghesi` VALUES (1,1);
/*!40000 ALTER TABLE `album_nghesi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `baihat`
--

DROP TABLE IF EXISTS `baihat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `baihat` (
  `BaiHatID` int NOT NULL AUTO_INCREMENT,
  `TieuDe` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `LuotPhat` int DEFAULT '0',
  `DuongDanAudio` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `AnhBiaBaiHat` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NgayPhatHanh` date DEFAULT NULL,
  `AlbumID` int DEFAULT NULL,
  `LuotThich` int DEFAULT '0',
  PRIMARY KEY (`BaiHatID`),
  KEY `AlbumID` (`AlbumID`),
  CONSTRAINT `baihat_ibfk_1` FOREIGN KEY (`AlbumID`) REFERENCES `album` (`AlbumID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=52 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `baihat`
--

LOCK TABLES `baihat` WRITE;
/*!40000 ALTER TABLE `baihat` DISABLE KEYS */;
INSERT INTO `baihat` VALUES (1,'Chúng Ta Của Tương Lai',4405,'chung-ta-cua-tuong-lai','chung-ta-cua-tuong-lai','2024-03-08',1,2),(2,'Cắt Đôi Nỗi Sầu',1231,'cat-doi-noi-sau','cat-doi-noi-sau','2023-10-02',2,1),(3,'Người Đầu Tiên',9948,'nguoi-dau-tien','nguoi-dau-tien','2024-02-29',2,2),(4,'In Love',9044,'in-love','in-love','2025-10-21',2,1),(5,'Thương',5376,'thuong','thuong','2025-10-23',2,1),(6,'Dù Cho Tận Thế',7747,'du-cho-tan-the','du-cho-tan-the','2025-02-06',4,1),(7,'Ai Là Người Thương Em',3603,'ai-la-nguoi-thuong-em','ai-la-nguoi-thuong-em','2019-05-09',4,1),(8,'Ngày Đầu Tiên',2777,'ngay-dau-tien','ngay-dau-tien','2022-02-11',4,0),(9,'Chưa Quên Người Yêu Cũ',2078,'chua-quen-nguoi-yeu-cu','chua-quen-nguoi-yeu-cu','2022-08-10',4,0),(10,'Nếu Mai Này Xa Nhau',1060,'neu-mai-nay-xa-nhau','neu-mai-nay-xa-nhau','2020-12-21',4,1),(11,'Em',7068,'em','em','2021-03-26',2,1),(12,'Tâu Na Bòn Ơi',4155,'tau-na-bon-oi','tau-na-bon-oi','2022-01-16',3,0),(13,'Kịch Bản',7574,'kich-ban','kich-ban','2025-10-23',3,0),(14,'Ta Lại Say',6404,'ta-lai-say','ta-lai-say','2025-10-24',4,0),(15,'Khó Vẽ Nụ Cười',8296,'kho-ve-nu-cuoi','kho-ve-nu-cuoi','2019-09-17',4,0),(16,'Thương Em Là Điều Anh Không Thể Ngờ',3269,'thuong-em-la-dieu','thuong-em-la-dieu','2018-12-18',4,0),(17,'Xin Lỗi Vì Đã Xuất Hiện',8460,'xin-loi-vi-da-xuat-hien','xin-loi-vi-da-xuat-hien','2025-10-27',4,0),(18,'Mình Còn Lại Gì Nữa Em Ơi',4488,'minh-con-lai-gi','minh-con-lai-gi','2025-10-24',4,0),(19,'Canh Bạc Hôn Nhân',5062,'canh-bac-hon-nhan','canh-bac-hon-nhan','2025-11-14',3,0),(20,'Duyên Do Trời Phận Tại Ta',1848,'duyen-do-troi','duyen-do-troi','2023-11-11',3,0),(21,'Từng Quen',2056,'tung-quen','tung-quen','2023-10-25',3,1),(22,'vaicaunoicokhiennguoithaydoi',3728,'vai-cau-noi','vai-cau-noi','2022-06-20',3,0),(23,'nếu lúc đó',2477,'neu-luc-do','neu-luc-do','2023-03-02',3,0),(24,'ngủ một mình',9203,'ngu-mot-minh','ngu-mot-minh','2022-11-17',3,2),(25,'Bạn Đời',1567,'ban-doi','ban-doi','2023-10-04',3,0),(26,'Lạ Lùng',6242,'la-lung','la-lung','2019-03-07',3,1),(27,'2 Phút Hơn (KAIZ Remix)',7498,'2-phut-hon','2-phut-hon','2020-11-28',3,0),(28,'Em Hát Ai Nghe',8770,'em-hat-ai-nghe','em-hat-ai-nghe','2021-08-18',3,0),(29,'Bigcityboi',2355,'bigcityboi','bigcityboi','2020-07-05',2,2),(30,'Gieo Quẻ',2462,'gieo-que','gieo-que','2022-01-01',2,0),(31,'Cruel Summer',1,'/audio/cruel-summer.mp3',NULL,NULL,NULL,1),(32,'Blinding Lights',1,'/audio/blinding-lights.mp3',NULL,NULL,NULL,1),(33,'Flowers',0,'/audio/flowers.mp3',NULL,NULL,NULL,0),(34,'Uptown Funk',0,'/audio/uptown-funk.mp3',NULL,NULL,NULL,0),(35,'Easy On Me',1,'/audio/easy-on-me.mp3',NULL,NULL,NULL,1),(36,'Shape of You',0,'/audio/shape-of-you.mp3',NULL,NULL,NULL,0),(37,'Circles',0,'/audio/circles.mp3',NULL,NULL,NULL,0),(38,'How You Like That',1,'/audio/how-you-like-that.mp3',NULL,NULL,NULL,1),(39,'Dynamite',0,'/audio/dynamite.mp3',NULL,NULL,NULL,0),(40,'Viva La Vida',0,'/audio/viva-la-vida.mp3',NULL,NULL,NULL,1),(41,'Believer',0,'/audio/believer.mp3',NULL,NULL,NULL,0),(42,'Lose Yourself',0,'/audio/lose-yourself.mp3',NULL,NULL,NULL,1),(43,'bad guy',0,'/audio/bad-guy.mp3',NULL,NULL,NULL,0),(44,'Levitating',0,'/audio/levitating.mp3',NULL,NULL,NULL,0),(45,'STAY',0,'/audio/stay.mp3',NULL,NULL,NULL,0),(46,'Attention',0,'/audio/attention.mp3',NULL,NULL,NULL,0),(47,'Moves Like Jagger',0,'/audio/moves-like-jagger.mp3',NULL,NULL,NULL,0),(48,'As It Was',1,'/audio/as-it-was.mp3',NULL,NULL,NULL,0),(49,'Something Just Like This',0,'/audio/something-just-like-this.mp3',NULL,NULL,NULL,0),(50,'7 rings',1,'/audio/7-rings.mp3',NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `baihat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `baihat_nghesi`
--

DROP TABLE IF EXISTS `baihat_nghesi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `baihat_nghesi` (
  `BaiHatID` int NOT NULL,
  `NgheSiID` int NOT NULL,
  `VaiTro` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'artist',
  PRIMARY KEY (`BaiHatID`,`NgheSiID`),
  KEY `NgheSiID` (`NgheSiID`),
  CONSTRAINT `baihat_nghesi_ibfk_1` FOREIGN KEY (`BaiHatID`) REFERENCES `baihat` (`BaiHatID`) ON DELETE CASCADE,
  CONSTRAINT `baihat_nghesi_ibfk_2` FOREIGN KEY (`NgheSiID`) REFERENCES `nghesi` (`NgheSiID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `baihat_nghesi`
--

LOCK TABLES `baihat_nghesi` WRITE;
/*!40000 ALTER TABLE `baihat_nghesi` DISABLE KEYS */;
INSERT INTO `baihat_nghesi` VALUES (1,1,'artist'),(2,2,'artist'),(2,3,'feat'),(3,4,'artist'),(3,5,'feat'),(4,6,'artist'),(4,7,'feat'),(5,8,'artist'),(6,9,'artist'),(7,10,'artist'),(8,11,'artist'),(9,12,'artist'),(10,13,'artist'),(11,14,'artist'),(12,15,'artist'),(13,16,'artist'),(13,17,'feat'),(14,18,'artist'),(15,19,'artist'),(15,20,'feat'),(16,21,'artist'),(17,22,'artist'),(18,23,'artist'),(19,24,'artist'),(20,25,'artist'),(21,43,'artist'),(22,44,'artist'),(23,45,'artist'),(24,46,'artist'),(25,47,'artist'),(26,48,'artist'),(27,49,'artist'),(28,50,'artist'),(29,14,'artist'),(30,51,'artist'),(31,26,'artist'),(32,27,'artist'),(33,28,'artist'),(34,29,'feat'),(34,55,'artist'),(35,30,'artist'),(36,31,'artist'),(37,32,'artist'),(38,33,'artist'),(39,34,'artist'),(40,35,'artist'),(41,36,'artist'),(42,37,'artist'),(43,38,'artist'),(44,39,'artist'),(45,40,'feat'),(45,56,'artist'),(46,41,'artist'),(47,42,'artist'),(48,52,'artist'),(49,35,'feat'),(49,53,'artist'),(50,54,'artist');
/*!40000 ALTER TABLE `baihat_nghesi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `baihat_theloai`
--

DROP TABLE IF EXISTS `baihat_theloai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `baihat_theloai` (
  `BaiHatID` int NOT NULL,
  `TheLoaiID` int NOT NULL,
  PRIMARY KEY (`BaiHatID`,`TheLoaiID`),
  KEY `TheLoaiID` (`TheLoaiID`),
  CONSTRAINT `baihat_theloai_ibfk_1` FOREIGN KEY (`BaiHatID`) REFERENCES `baihat` (`BaiHatID`) ON DELETE CASCADE,
  CONSTRAINT `baihat_theloai_ibfk_2` FOREIGN KEY (`TheLoaiID`) REFERENCES `theloai` (`TheLoaiID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `baihat_theloai`
--

LOCK TABLES `baihat_theloai` WRITE;
/*!40000 ALTER TABLE `baihat_theloai` DISABLE KEYS */;
INSERT INTO `baihat_theloai` VALUES (1,1),(2,1),(5,1),(12,1),(16,1),(21,1),(22,1),(23,1),(24,1),(25,1),(26,1),(27,1),(28,1),(29,1),(30,1),(3,2),(6,2),(7,2),(8,2),(9,2),(10,2),(14,2),(15,2),(17,2),(18,2),(19,2),(20,2),(22,2),(28,2),(35,2),(1,3),(4,3),(21,3),(23,3),(37,3),(46,3),(4,4),(11,4),(13,4),(24,4),(25,4),(29,4),(38,4),(42,4),(50,4),(2,5),(27,5),(30,5),(49,5),(31,6),(32,6),(33,6),(36,6),(39,6),(43,6),(44,6),(45,6),(47,6),(48,6),(38,7),(39,7),(40,8),(41,8),(26,9),(34,10),(31,11),(32,11),(33,11),(34,11),(35,11),(36,11),(37,11),(42,11),(43,11),(44,11),(45,11),(46,11),(47,11),(48,11),(49,11),(50,11);
/*!40000 ALTER TABLE `baihat_theloai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `baihatyeuthich`
--

DROP TABLE IF EXISTS `baihatyeuthich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `baihatyeuthich` (
  `NguoiDungID` int NOT NULL,
  `BaiHatID` int NOT NULL,
  `NgayThem` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`NguoiDungID`,`BaiHatID`),
  KEY `BaiHatID` (`BaiHatID`),
  CONSTRAINT `baihatyeuthich_ibfk_1` FOREIGN KEY (`NguoiDungID`) REFERENCES `nguoidung` (`NguoiDungID`) ON DELETE CASCADE,
  CONSTRAINT `baihatyeuthich_ibfk_2` FOREIGN KEY (`BaiHatID`) REFERENCES `baihat` (`BaiHatID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `baihatyeuthich`
--

LOCK TABLES `baihatyeuthich` WRITE;
/*!40000 ALTER TABLE `baihatyeuthich` DISABLE KEYS */;
INSERT INTO `baihatyeuthich` VALUES (1,1,'2025-11-19 12:43:06'),(1,2,'2025-11-19 12:43:06'),(1,3,'2025-11-21 00:00:28'),(1,4,'2025-11-20 23:07:37'),(1,5,'2025-11-19 12:43:06'),(1,21,'2025-11-20 21:41:42'),(1,31,'2025-11-19 12:43:06'),(2,3,'2025-11-19 12:43:06'),(2,6,'2025-11-19 12:43:06'),(2,11,'2025-11-19 12:43:06'),(2,35,'2025-11-19 12:43:06'),(3,24,'2025-11-19 12:43:06'),(3,26,'2025-11-19 12:43:06'),(3,29,'2025-11-19 12:43:06'),(3,42,'2025-11-19 12:43:06'),(4,1,'2025-11-20 01:08:02'),(4,7,'2025-11-19 23:50:03'),(4,24,'2025-11-20 01:02:07'),(4,32,'2025-11-19 12:43:06'),(4,38,'2025-11-19 12:43:06'),(4,40,'2025-11-19 12:43:06'),(6,10,'2025-11-23 23:56:48'),(6,29,'2025-11-23 23:56:36');
/*!40000 ALTER TABLE `baihatyeuthich` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `baihatluotthich`
-- (Like theo tài khoản - dùng cho LuotThich / icon Like)
--

DROP TABLE IF EXISTS `baihatluotthich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `baihatluotthich` (
  `NguoiDungID` int NOT NULL,
  `BaiHatID` int NOT NULL,
  `NgayThich` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`NguoiDungID`,`BaiHatID`),
  KEY `BaiHatID` (`BaiHatID`),
  CONSTRAINT `baihatluotthich_ibfk_1` FOREIGN KEY (`NguoiDungID`) REFERENCES `nguoidung` (`NguoiDungID`) ON DELETE CASCADE,
  CONSTRAINT `baihatluotthich_ibfk_2` FOREIGN KEY (`BaiHatID`) REFERENCES `baihat` (`BaiHatID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `baihatluotthich` (optional)
--

LOCK TABLES `baihatluotthich` WRITE;
/*!40000 ALTER TABLE `baihatluotthich` DISABLE KEYS */;
/*!40000 ALTER TABLE `baihatluotthich` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `binhluan`
--

DROP TABLE IF EXISTS `binhluan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `binhluan` (
  `BinhLuanID` int NOT NULL AUTO_INCREMENT,
  `NguoiDungID` int DEFAULT NULL,
  `BaiHatID` int NOT NULL,
  `NoiDung` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ThoiGian` datetime DEFAULT CURRENT_TIMESTAMP,
  `LuotThich` int DEFAULT '0',
  `BinhLuanChaID` int DEFAULT NULL,
  PRIMARY KEY (`BinhLuanID`),
  KEY `NguoiDungID` (`NguoiDungID`),
  KEY `BinhLuanChaID` (`BinhLuanChaID`),
  KEY `BaiHatID` (`BaiHatID`),
  CONSTRAINT `binhluan_ibfk_1` FOREIGN KEY (`NguoiDungID`) REFERENCES `nguoidung` (`NguoiDungID`) ON DELETE SET NULL,
  CONSTRAINT `binhluan_ibfk_2` FOREIGN KEY (`BinhLuanChaID`) REFERENCES `binhluan` (`BinhLuanID`) ON DELETE CASCADE,
  CONSTRAINT `binhluan_ibfk_3` FOREIGN KEY (`BaiHatID`) REFERENCES `baihat` (`BaiHatID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `binhluan`
--

LOCK TABLES `binhluan` WRITE;
/*!40000 ALTER TABLE `binhluan` DISABLE KEYS */;
INSERT INTO `binhluan` VALUES (1,1,1,'MV đẹp quá Sếp ơi! Visual đỉnh!','2025-11-03 21:52:45',0,NULL),(2,2,2,'Nhạc Tăng Duy Tân dính thật sự, nghe 1 lần là lặp lại cả ngày.','2025-11-03 21:52:45',0,NULL),(3,3,7,'Quân A.P hát ballad bài nào cũng lụi tim.','2025-11-03 21:52:45',0,NULL),(4,1,8,'Bài này đám cưới mở là hết ý. Nhạc Đức Phúc lúc nào cũng tích cực.','2025-11-03 21:52:45',0,NULL),(5,3,2,'Beat hay quá, không biết ai sản xuất nhỉ?','2025-11-03 21:52:45',0,NULL),(6,1,2,'Công nhận, beat cuốn dã man.','2025-11-03 21:52:45',0,2),(7,2,2,'Drum7 đó bạn, có ghi ở tên bài hát kìa.','2025-11-03 21:52:45',0,5),(9,4,31,'Cruel Summer on top! Taylor Swift never misses.','2025-11-14 13:32:37',0,NULL),(10,4,32,'The Weeknd = GOAT. This song is a masterpiece.','2025-11-14 13:32:37',0,NULL),(11,1,23,'Bài này của tlinh hay thật sự, flow đỉnh.','2025-11-14 13:32:37',0,NULL),(12,2,26,'Vũ. hát lúc nào cũng làm mình thấy bình yên.','2025-11-14 13:32:37',0,NULL),(13,3,29,'Chất lừ anh Binz ơi!','2025-11-14 13:32:37',0,NULL),(14,4,38,'BLACKPINK IN YOUR AREA!','2025-11-14 13:32:37',0,NULL),(15,1,31,'Đồng ý với bạn, nghe mãi không chán.','2025-11-14 13:32:37',0,9);
/*!40000 ALTER TABLE `binhluan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chitiethoadon`
--

DROP TABLE IF EXISTS `chitiethoadon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chitiethoadon` (
  `ChiTietID` int NOT NULL AUTO_INCREMENT,
  `HoaDonID` int DEFAULT NULL,
  `GoiID` int DEFAULT NULL,
  `SoTien` decimal(10,2) NOT NULL,
  `MoTa` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ChiTietID`),
  KEY `HoaDonID` (`HoaDonID`),
  KEY `GoiID` (`GoiID`),
  CONSTRAINT `chitiethoadon_ibfk_1` FOREIGN KEY (`HoaDonID`) REFERENCES `hoadon` (`HoaDonID`) ON DELETE CASCADE,
  CONSTRAINT `chitiethoadon_ibfk_2` FOREIGN KEY (`GoiID`) REFERENCES `goicuoc` (`GoiID`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chitiethoadon`
--

LOCK TABLES `chitiethoadon` WRITE;
/*!40000 ALTER TABLE `chitiethoadon` DISABLE KEYS */;
INSERT INTO `chitiethoadon` VALUES (1,1,2,59000.00,'Thanh toán Gói Premium 1 Tháng'),(2,2,3,590000.00,'Thanh toán Gói Premium 1 Năm'),(3,3,2,59000.00,'Gia hạn Gói Premium 1 Tháng'),(4,4,3,249000.00,'Đăng ký Gói 6 Tháng qua credit_card'),(11,11,2,49000.00,'Đăng ký Gói 1 Tháng qua shopeepay'),(12,12,3,249000.00,'Đăng ký Gói 6 Tháng qua qrcode');
/*!40000 ALTER TABLE `chitiethoadon` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dangkygoi`
--

DROP TABLE IF EXISTS `dangkygoi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dangkygoi` (
  `DangKyID` int NOT NULL AUTO_INCREMENT,
  `NguoiDungID` int DEFAULT NULL,
  `GoiID` int DEFAULT NULL,
  `NgayDangKy` datetime DEFAULT CURRENT_TIMESTAMP,
  `NgayHetHan` datetime DEFAULT NULL,
  `TrangThai` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  PRIMARY KEY (`DangKyID`),
  KEY `NguoiDungID` (`NguoiDungID`),
  KEY `GoiID` (`GoiID`),
  CONSTRAINT `dangkygoi_ibfk_1` FOREIGN KEY (`NguoiDungID`) REFERENCES `nguoidung` (`NguoiDungID`),
  CONSTRAINT `dangkygoi_ibfk_2` FOREIGN KEY (`GoiID`) REFERENCES `goicuoc` (`GoiID`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dangkygoi`
--

LOCK TABLES `dangkygoi` WRITE;
/*!40000 ALTER TABLE `dangkygoi` DISABLE KEYS */;
INSERT INTO `dangkygoi` VALUES (1,1,2,'2025-11-01 08:00:00','2025-12-01 08:00:00','active'),(2,2,3,'2025-01-15 10:30:00','2026-01-15 10:30:00','active'),(3,3,2,'2025-10-01 09:00:00','2025-10-30 09:00:00','expired'),(4,3,1,'2025-10-30 09:01:00',NULL,'active'),(5,4,1,'2025-11-20 14:00:00',NULL,'active'),(6,1,3,'2025-11-21 23:05:47','2026-05-30 08:00:00','active'),(7,4,2,'2025-11-21 23:59:52','2025-12-21 16:59:52','active'),(8,4,3,'2025-11-23 23:22:27','2026-06-19 09:59:52','active');
/*!40000 ALTER TABLE `dangkygoi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `danhsach_baihat`
--

DROP TABLE IF EXISTS `danhsach_baihat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danhsach_baihat` (
  `DanhSachID` int NOT NULL,
  `BaiHatID` int NOT NULL,
  `ThuTu` int DEFAULT NULL,
  PRIMARY KEY (`DanhSachID`,`BaiHatID`),
  KEY `BaiHatID` (`BaiHatID`),
  CONSTRAINT `danhsach_baihat_ibfk_1` FOREIGN KEY (`DanhSachID`) REFERENCES `danhsachphat` (`DanhSachID`) ON DELETE CASCADE,
  CONSTRAINT `danhsach_baihat_ibfk_2` FOREIGN KEY (`BaiHatID`) REFERENCES `baihat` (`BaiHatID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `danhsach_baihat`
--

LOCK TABLES `danhsach_baihat` WRITE;
/*!40000 ALTER TABLE `danhsach_baihat` DISABLE KEYS */;
INSERT INTO `danhsach_baihat` VALUES (1,5,4),(1,21,3),(1,23,2),(1,26,1),(1,28,5),(2,1,1),(2,2,2),(3,3,1),(3,6,2),(3,9,3),(3,11,4),(3,16,5),(3,35,6),(4,14,4),(4,24,2),(4,25,3),(4,27,5),(4,29,1),(5,31,1),(5,32,3),(5,33,2),(5,36,4),(5,48,5),(6,34,3),(6,38,4),(6,39,5),(6,41,2),(6,42,1),(6,44,6),(7,8,1),(7,29,2);
/*!40000 ALTER TABLE `danhsach_baihat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `danhsachphat`
--

DROP TABLE IF EXISTS `danhsachphat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danhsachphat` (
  `DanhSachID` int NOT NULL AUTO_INCREMENT,
  `Ten` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MoTa` text COLLATE utf8mb4_unicode_ci,
  `NgayTao` datetime DEFAULT CURRENT_TIMESTAMP,
  `NguoiDungID` int DEFAULT NULL,
  PRIMARY KEY (`DanhSachID`),
  KEY `NguoiDungID` (`NguoiDungID`),
  CONSTRAINT `danhsachphat_ibfk_1` FOREIGN KEY (`NguoiDungID`) REFERENCES `nguoidung` (`NguoiDungID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `danhsachphat`
--

LOCK TABLES `danhsachphat` WRITE;
/*!40000 ALTER TABLE `danhsachphat` DISABLE KEYS */;
INSERT INTO `danhsachphat` VALUES (1,'Nhạc Chill Cuối Tuần','Tổng hợp nhạc V-Pop nhẹ nhàng thư giãn cho ngày chủ nhật','2025-11-20 20:28:16',1),(2,'Sơn Tùng M-TP Collection','Những bài hit đỉnh nhất của Sếp','2025-11-20 20:28:16',1),(3,'Ballad Buồn Thấu Tim','Nghe và khóc... dành cho những người thất tình','2025-11-20 20:28:16',2),(4,'Rap Việt Underground','Flow cực cháy, bass cực căng','2025-11-20 20:28:16',3),(5,'US-UK Top Hits 2024','Best of Pop & R&B','2025-11-20 20:28:16',4),(6,'Workout Motivation','Nhạc tập gym năng động, bùng nổ năng lượng','2025-11-20 20:28:16',4),(7,'aaa','aaa','2025-11-20 21:43:38',1);
/*!40000 ALTER TABLE `danhsachphat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `goicuoc`
--

DROP TABLE IF EXISTS `goicuoc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `goicuoc` (
  `GoiID` int NOT NULL AUTO_INCREMENT,
  `Ten` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Gia` decimal(10,2) NOT NULL,
  `ThoiHan` int DEFAULT NULL,
  `MoTa` text COLLATE utf8mb4_unicode_ci,
  `QuyenID` int DEFAULT NULL,
  PRIMARY KEY (`GoiID`),
  KEY `QuyenID` (`QuyenID`),
  CONSTRAINT `goicuoc_ibfk_1` FOREIGN KEY (`QuyenID`) REFERENCES `quyentruycap` (`QuyenID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `goicuoc`
--

LOCK TABLES `goicuoc` WRITE;
/*!40000 ALTER TABLE `goicuoc` DISABLE KEYS */;
INSERT INTO `goicuoc` VALUES (1,'Gói Free',0.00,NULL,'Nghe nhạc miễn phí, có quảng cáo',1),(2,'Gói 1 Tháng',49000.00,30,'Nghe nhạc Lossless, không quảng cáo',2),(3,'Gói 6 Tháng',249000.00,180,'Tiết kiệm 15%',2),(4,'Gói 1 Năm',499000.00,365,'Tiết kiệm 25%',2);
/*!40000 ALTER TABLE `goicuoc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hoadon`
--

DROP TABLE IF EXISTS `hoadon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hoadon` (
  `HoaDonID` int NOT NULL AUTO_INCREMENT,
  `NguoiDungID` int DEFAULT NULL,
  `NgayLap` datetime DEFAULT CURRENT_TIMESTAMP,
  `TongTien` decimal(10,2) NOT NULL,
  `TrangThai` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  PRIMARY KEY (`HoaDonID`),
  KEY `NguoiDungID` (`NguoiDungID`),
  CONSTRAINT `hoadon_ibfk_1` FOREIGN KEY (`NguoiDungID`) REFERENCES `nguoidung` (`NguoiDungID`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hoadon`
--

LOCK TABLES `hoadon` WRITE;
/*!40000 ALTER TABLE `hoadon` DISABLE KEYS */;
INSERT INTO `hoadon` VALUES (1,1,'2025-11-03 21:52:45',59000.00,'paid'),(2,2,'2025-11-03 21:52:45',590000.00,'paid'),(3,1,'2025-11-03 21:52:45',59000.00,'paid'),(4,1,'2025-11-21 23:05:47',249000.00,'paid'),(11,4,'2025-11-21 23:59:52',49000.00,'paid'),(12,4,'2025-11-23 23:22:27',249000.00,'paid');
/*!40000 ALTER TABLE `hoadon` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lichsunghe`
--

DROP TABLE IF EXISTS `lichsunghe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lichsunghe` (
  `LichSuID` int NOT NULL AUTO_INCREMENT,
  `NguoiDungID` int DEFAULT NULL,
  `BaiHatID` int DEFAULT NULL,
  `ThoiGianNghe` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`LichSuID`),
  KEY `NguoiDungID` (`NguoiDungID`),
  KEY `BaiHatID` (`BaiHatID`),
  CONSTRAINT `lichsunghe_ibfk_1` FOREIGN KEY (`NguoiDungID`) REFERENCES `nguoidung` (`NguoiDungID`) ON DELETE CASCADE,
  CONSTRAINT `lichsunghe_ibfk_2` FOREIGN KEY (`BaiHatID`) REFERENCES `baihat` (`BaiHatID`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lichsunghe`
--

LOCK TABLES `lichsunghe` WRITE;
/*!40000 ALTER TABLE `lichsunghe` DISABLE KEYS */;
INSERT INTO `lichsunghe` VALUES (1,1,1,'2025-11-18 12:43:37'),(2,1,2,'2025-11-18 13:43:37'),(3,2,35,'2025-11-18 12:43:37'),(4,4,32,'2025-11-18 12:43:37'),(5,3,29,'2025-11-19 07:43:37'),(6,3,24,'2025-11-19 08:43:37'),(7,1,31,'2025-11-19 08:43:37'),(8,4,38,'2025-11-19 09:43:37'),(9,1,1,'2025-11-19 12:43:37'),(10,2,6,'2025-11-19 12:43:37'),(11,4,50,'2025-11-19 12:43:37'),(12,4,48,'2025-11-19 12:43:37'),(13,4,1,'2025-11-20 16:59:08'),(14,4,21,'2025-11-20 20:49:00'),(15,4,30,'2025-11-20 20:59:00'),(16,1,21,'2025-11-20 21:39:29'),(17,1,5,'2025-11-20 21:42:23'),(18,4,24,'2025-11-21 02:22:04'),(19,6,24,'2025-11-23 23:55:49'),(20,4,26,'2025-11-24 01:46:01'),(21,4,26,'2025-11-24 01:46:10');
/*!40000 ALTER TABLE `lichsunghe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nghesi`
--

DROP TABLE IF EXISTS `nghesi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nghesi` (
  `NgheSiID` int NOT NULL AUTO_INCREMENT,
  `TenNgheSi` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TieuSu` text COLLATE utf8mb4_unicode_ci,
  `AnhDaiDien` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`NgheSiID`),
  UNIQUE KEY `TenNgheSi` (`TenNgheSi`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nghesi`
--

LOCK TABLES `nghesi` WRITE;
/*!40000 ALTER TABLE `nghesi` DISABLE KEYS */;
INSERT INTO `nghesi` VALUES (1,'Sơn Tùng M-TP',NULL,NULL),(2,'Tăng Duy Tân',NULL,NULL),(3,'Drum7',NULL,NULL),(4,'Juky San',NULL,NULL),(5,'buitruonglinh',NULL,NULL),(6,'Low G',NULL,NULL),(7,'JustaTee',NULL,NULL),(8,'Bích Phương',NULL,NULL),(9,'ERIK',NULL,NULL),(10,'Quân A.P',NULL,NULL),(11,'Đức Phúc',NULL,NULL),(12,'Hà Nhi',NULL,NULL),(13,'Hòa Minzy',NULL,NULL),(14,'Binz',NULL,NULL),(15,'Long Nón Lá',NULL,NULL),(16,'Táo',NULL,NULL),(17,'Hoàng Yến Chibi',NULL,NULL),(18,'Trịnh Đình Quang',NULL,NULL),(19,'Đạt G',NULL,NULL),(20,'Du Uyên',NULL,NULL),(21,'Noo Phước Thịnh',NULL,NULL),(22,'Thanh Hưng',NULL,NULL),(23,'Hoài Lâm',NULL,NULL),(24,'LaLa Trần',NULL,NULL),(25,'Anh Tú (Voi Bản Đôn)',NULL,NULL),(26,'Taylor Swift',NULL,NULL),(27,'The Weeknd',NULL,NULL),(28,'Miley Cyrus',NULL,NULL),(29,'Bruno Mars',NULL,NULL),(30,'Adele',NULL,NULL),(31,'Ed Sheeran',NULL,NULL),(32,'Post Malone',NULL,NULL),(33,'BLACKPINK',NULL,NULL),(34,'BTS',NULL,NULL),(35,'Coldplay',NULL,NULL),(36,'Imagine Dragons',NULL,NULL),(37,'Eminem',NULL,NULL),(38,'Billie Eilish',NULL,NULL),(39,'Dua Lipa',NULL,NULL),(40,'Justin Bieber',NULL,NULL),(41,'Charlie Puth',NULL,NULL),(42,'Maroon 5',NULL,NULL),(43,'Wren Evans',NULL,NULL),(44,'GREY D',NULL,NULL),(45,'tlinh',NULL,NULL),(46,'HIEUTHUHAI',NULL,NULL),(47,'Karik',NULL,NULL),(48,'Vũ.',NULL,NULL),(49,'Pháo',NULL,NULL),(50,'Orange',NULL,NULL),(51,'Hoàng Thùy Linh',NULL,NULL),(52,'Harry Styles',NULL,NULL),(53,'The Chainsmokers',NULL,NULL),(54,'Ariana Grande',NULL,NULL),(55,'Mark Ronson',NULL,NULL),(56,'The Kid LAROI',NULL,NULL);
/*!40000 ALTER TABLE `nghesi` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nguoidung`
--

DROP TABLE IF EXISTS `nguoidung`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nguoidung` (
  `NguoiDungID` int NOT NULL AUTO_INCREMENT,
  `TenDangNhap` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `MatKhau` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `VaiTro` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `TenHienThi` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `AnhDaiDien` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TrangThai` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `NgayThamGia` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`NguoiDungID`),
  UNIQUE KEY `TenDangNhap` (`TenDangNhap`),
  UNIQUE KEY `Email` (`Email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nguoidung`
--

LOCK TABLES `nguoidung` WRITE;
/*!40000 ALTER TABLE `nguoidung` DISABLE KEYS */;
INSERT INTO `nguoidung` VALUES (1,'an_nguyen','an.nguyen@example.com','hashed_password_1','user','An Nguyễn',NULL,'active','2025-11-03 21:52:45'),(2,'binh_le','binh.le@example.com','hashed_password_2','user','Bình Lê',NULL,'active','2025-11-03 21:52:45'),(3,'chi_pham','chi.pham@example.com','hashed_password_3','user','Chi Phạm',NULL,'active','2025-11-03 21:52:45'),(4,'me','dave.usuk@example.com','123','user','Me',NULL,'active','2025-11-14 13:32:37'),(5,'admin','admin@nhacso.com','123','admin','Quản Trị Viên',NULL,'active','2025-11-22 22:26:30'),(6,'toi','toi@gmail.com','$2b$10$n4HjMoUKh9vaqJ8pYm7LVuHpUw1mP1oTEf8gvjkzWBaLG4cg5BjlW','user','toi',NULL,'active','2025-11-23 23:54:50');
/*!40000 ALTER TABLE `nguoidung` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quangcao`
--

DROP TABLE IF EXISTS `quangcao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quangcao` (
  `QuangCaoID` int NOT NULL AUTO_INCREMENT,
  `TenSanPham` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TenShop` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `LinkShopee` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `HienThi` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`QuangCaoID`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quangcao`
--

LOCK TABLES `quangcao` WRITE;
/*!40000 ALTER TABLE `quangcao` DISABLE KEYS */;
INSERT INTO `quangcao` VALUES (1,'Áo thun nam','Coolmate - Official','https://shopee.vn/%C3%81o-thun-nam-TShirt-Basic-Cotton-100-220gsm-d%C3%A0y-d%E1%BA%B7n-m%E1%BB%81m-m%E1%BA%A1i-Coolmate-i.24710134.18483274744?extraParams=%7B%22display_model_id%22%3A88887822373%2C%22model_selection_logic%22%3A3%7D',1);
/*!40000 ALTER TABLE `quangcao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quyentruycap`
--

DROP TABLE IF EXISTS `quyentruycap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quyentruycap` (
  `QuyenID` int NOT NULL AUTO_INCREMENT,
  `Ten` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `DuocTaiXuong` tinyint(1) DEFAULT '0',
  `DuocPhatTrucTuyen` tinyint(1) DEFAULT '1',
  `KhongQuangCao` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`QuyenID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quyentruycap`
--

LOCK TABLES `quyentruycap` WRITE;
/*!40000 ALTER TABLE `quyentruycap` DISABLE KEYS */;
INSERT INTO `quyentruycap` VALUES (1,'Free',0,1,0),(2,'Premium',1,1,1);
/*!40000 ALTER TABLE `quyentruycap` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `theloai`
--

DROP TABLE IF EXISTS `theloai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `theloai` (
  `TheLoaiID` int NOT NULL AUTO_INCREMENT,
  `TenTheLoai` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `MoTa` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`TheLoaiID`),
  UNIQUE KEY `TenTheLoai` (`TenTheLoai`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theloai`
--

LOCK TABLES `theloai` WRITE;
/*!40000 ALTER TABLE `theloai` DISABLE KEYS */;
INSERT INTO `theloai` VALUES (1,'V-Pop',NULL),(2,'Ballad',NULL),(3,'R&B',NULL),(4,'Rap/Hip-hop',NULL),(5,'EDM',NULL),(6,'Pop',NULL),(7,'K-Pop',NULL),(8,'Alternative/Rock',NULL),(9,'Indie',NULL),(10,'Funk',NULL),(11,'US-UK',NULL);
/*!40000 ALTER TABLE `theloai` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-24  2:01:57
