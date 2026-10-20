-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: edupath
-- ------------------------------------------------------
-- Server version	8.0.46

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
-- Table structure for table `academic_programs`
--

DROP TABLE IF EXISTS `academic_programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_programs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `academic_programs_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_programs`
--

LOCK TABLES `academic_programs` WRITE;
/*!40000 ALTER TABLE `academic_programs` DISABLE KEYS */;
INSERT INTO `academic_programs` VALUES (6,'Bachelor of Science in Information Technology','BSIT','A program focused on information technology, computing, software development, networking, and related technologies..',1,NULL,'2026-10-15 03:45:11'),(7,'Bachelor of Science in Office Administration','BSOA','A program focused on office administration, business operations, records management, and administrative services.',1,NULL,NULL),(8,'Bachelor of Elementary Education','BEED','A teacher education program preparing students for professional teaching in elementary education.',1,NULL,'2026-10-20 05:32:18'),(9,'Bachelor of Secondary Education - English','BSED-English','A teacher education program specializing in English education for secondary-level teaching.',1,NULL,NULL),(10,'Bachelor of Arts in Political Science','BA-Political-Science','A program focused on government, politics, public administration, political theory, and related social sciences.',1,NULL,'2026-10-20 05:32:23'),(11,'Bachelor of Arts in Communication','BA-Communication','A program focused on communication theory, media, journalism, broadcasting, and related communication practices.',1,NULL,'2026-10-20 05:32:31'),(12,'Bachelor of Science in Criminology','BSCrim','A program focused on criminology, criminal justice, law enforcement, and related areas of public safety.',1,NULL,'2026-10-20 05:32:27');
/*!40000 ALTER TABLE `academic_programs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admission_application_histories`
--

DROP TABLE IF EXISTS `admission_application_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admission_application_histories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admission_application_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `admission_application_histories_admission_application_id_foreign` (`admission_application_id`),
  KEY `admission_application_histories_user_id_foreign` (`user_id`),
  CONSTRAINT `admission_application_histories_admission_application_id_foreign` FOREIGN KEY (`admission_application_id`) REFERENCES `admission_applications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `admission_application_histories_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admission_application_histories`
--

LOCK TABLES `admission_application_histories` WRITE;
/*!40000 ALTER TABLE `admission_application_histories` DISABLE KEYS */;
INSERT INTO `admission_application_histories` VALUES (4,6,5,'submitted',NULL,'pending','nothing haha','2026-09-30 21:25:14','2026-09-30 21:25:14'),(5,6,1,'status_updated','pending','approved',NULL,'2026-09-30 21:32:15','2026-09-30 21:32:15'),(6,7,13,'submitted',NULL,'pending','nono','2026-10-12 19:42:26','2026-10-12 19:42:26'),(7,7,1,'status_updated','pending','approved',NULL,'2026-10-12 19:45:52','2026-10-12 19:45:52'),(8,8,14,'submitted',NULL,'pending','svsgsbshsh','2026-10-12 19:58:40','2026-10-12 19:58:40'),(9,8,1,'status_updated','pending','approved',NULL,'2026-10-12 19:59:07','2026-10-12 19:59:07'),(10,9,5,'submitted',NULL,'pending','baba','2026-10-14 08:27:49','2026-10-14 08:27:49'),(11,10,15,'submitted',NULL,'pending','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift\nRemarks: papasra ko ha','2026-10-14 15:15:48','2026-10-14 15:15:48'),(12,10,1,'status_updated','pending','approved',NULL,'2026-10-14 15:17:01','2026-10-14 15:17:01'),(13,11,16,'submitted',NULL,'pending','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift\nRemarks: ayaw kalimot pautog','2026-10-14 23:04:06','2026-10-14 23:04:06'),(14,11,1,'status_updated','pending','approved',NULL,'2026-10-14 23:05:28','2026-10-14 23:05:28'),(15,9,1,'status_updated','pending','rejected',NULL,'2026-10-15 05:56:40','2026-10-15 05:56:40'),(17,13,18,'submitted',NULL,'pending','workflow check','2026-10-15 18:22:01','2026-10-15 18:22:01'),(18,14,18,'submitted',NULL,'pending','workflow check','2026-10-15 18:23:24','2026-10-15 18:23:24'),(19,15,19,'submitted',NULL,'pending','wqwq','2026-10-16 11:24:00','2026-10-16 11:24:00'),(20,15,1,'status_updated','pending','approved',NULL,'2026-10-16 11:25:57','2026-10-16 11:25:57'),(21,16,5,'submitted',NULL,'pending','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift','2026-10-17 05:22:54','2026-10-17 05:22:54'),(22,16,1,'status_updated','pending','approved',NULL,'2026-10-17 05:25:38','2026-10-17 05:25:38'),(23,17,5,'submitted',NULL,'pending','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift','2026-10-17 06:26:09','2026-10-17 06:26:09'),(24,17,5,'withdrawn','pending','withdrawn','Withdrawn by applicant.','2026-10-17 06:26:15','2026-10-17 06:26:15'),(25,9,5,'withdrawn','rejected','withdrawn','Withdrawn by applicant.','2026-10-17 06:32:31','2026-10-17 06:32:31'),(26,18,22,'submitted',NULL,'pending','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift','2026-10-17 14:43:30','2026-10-17 14:43:30'),(27,19,5,'submitted',NULL,'pending','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift','2026-10-19 01:16:02','2026-10-19 01:16:02'),(28,19,1,'status_updated','pending','approved',NULL,'2026-10-19 01:32:48','2026-10-19 01:32:48'),(29,13,1,'withdrawn','pending','withdrawn','Withdrawn by an administrator; record and documents retained.','2026-10-19 02:40:19','2026-10-19 02:40:19'),(30,14,1,'withdrawn','pending','withdrawn','Withdrawn by an administrator; record and documents retained.','2026-10-19 02:40:24','2026-10-19 02:40:24'),(31,18,1,'withdrawn','pending','withdrawn','Withdrawn by an administrator; record and documents retained.','2026-10-19 02:40:37','2026-10-19 02:40:37'),(32,20,23,'submitted',NULL,'pending','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift\nRemarks: pautog nasd','2026-10-19 22:17:19','2026-10-19 22:17:19'),(33,20,1,'status_updated','pending','approved',NULL,'2026-10-19 22:21:07','2026-10-19 22:21:07'),(34,21,23,'submitted',NULL,'pending','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift\nRemarks: utog nasd','2026-10-19 22:52:30','2026-10-19 22:52:30'),(35,21,23,'withdrawn','pending','withdrawn','Withdrawn by applicant.','2026-10-19 22:57:14','2026-10-19 22:57:14'),(36,22,23,'submitted',NULL,'pending','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift','2026-10-19 23:00:45','2026-10-19 23:00:45'),(37,22,23,'withdrawn','pending','withdrawn','Withdrawn by applicant.','2026-10-19 23:07:51','2026-10-19 23:07:51'),(38,23,28,'submitted',NULL,'pending','Preferred Study Mode: Part-time\nPreferred Shift: Evening Shift\nRemarks: ako ni cedrick','2026-10-20 00:58:34','2026-10-20 00:58:34'),(39,23,1,'status_updated','pending','approved',NULL,'2026-10-20 00:59:34','2026-10-20 00:59:34'),(40,24,29,'submitted',NULL,'pending','Preferred Study Mode: Full-time\nPreferred Shift: Evening Shift\nRemarks: para asa ni','2026-10-20 05:40:06','2026-10-20 05:40:06'),(41,24,1,'status_updated','pending','approved',NULL,'2026-10-20 05:41:13','2026-10-20 05:41:13');
/*!40000 ALTER TABLE `admission_application_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admission_applications`
--

DROP TABLE IF EXISTS `admission_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admission_applications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `applicant_id` bigint unsigned NOT NULL,
  `academic_program_id` bigint unsigned NOT NULL,
  `admission_period_id` bigint unsigned DEFAULT NULL,
  `status` enum('pending','under_review','approved','rejected','withdrawn') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `admission_applications_applicant_id_foreign` (`applicant_id`),
  KEY `admission_applications_academic_program_id_foreign` (`academic_program_id`),
  KEY `admission_applications_admission_period_id_foreign` (`admission_period_id`),
  CONSTRAINT `admission_applications_academic_program_id_foreign` FOREIGN KEY (`academic_program_id`) REFERENCES `academic_programs` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `admission_applications_admission_period_id_foreign` FOREIGN KEY (`admission_period_id`) REFERENCES `admission_periods` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `admission_applications_applicant_id_foreign` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admission_applications`
--

LOCK TABLES `admission_applications` WRITE;
/*!40000 ALTER TABLE `admission_applications` DISABLE KEYS */;
INSERT INTO `admission_applications` VALUES (6,2,6,1,'approved','nothing haha','2026-09-30 21:25:14','2026-09-30 21:25:14','2026-09-30 21:32:15'),(7,8,6,1,'approved','nono','2026-10-12 19:42:26','2026-10-12 19:42:26','2026-10-12 19:45:52'),(8,9,6,1,'approved','svsgsbshsh','2026-10-12 19:58:40','2026-10-12 19:58:40','2026-10-12 19:59:07'),(9,2,12,1,'withdrawn',NULL,'2026-10-14 08:27:49','2026-10-14 08:27:49','2026-10-17 06:32:31'),(10,10,8,1,'approved','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift\nRemarks: papasra ko ha','2026-10-14 15:15:48','2026-10-14 15:15:48','2026-10-14 15:17:01'),(11,11,6,1,'approved','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift\nRemarks: ayaw kalimot pautog','2026-10-14 23:04:06','2026-10-14 23:04:06','2026-10-14 23:05:28'),(13,13,6,1,'withdrawn','workflow check','2026-10-15 18:22:01','2026-10-15 18:22:01','2026-10-19 02:40:19'),(14,13,6,1,'withdrawn','workflow check','2026-10-15 18:23:24','2026-10-15 18:23:24','2026-10-19 02:40:24'),(15,14,6,1,'approved','wqwq','2026-10-16 11:24:00','2026-10-16 11:24:00','2026-10-16 11:25:57'),(16,2,6,1,'approved','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift','2026-10-17 05:22:54','2026-10-17 05:22:54','2026-10-17 05:25:38'),(17,2,6,1,'withdrawn','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift','2026-10-17 06:26:09','2026-10-17 06:26:09','2026-10-17 06:26:15'),(18,15,6,1,'withdrawn','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift','2026-10-17 14:43:30','2026-10-17 14:43:30','2026-10-19 02:40:37'),(19,2,6,1,'approved','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift','2026-10-19 01:16:02','2026-10-19 01:16:02','2026-10-19 01:32:48'),(20,16,6,1,'approved','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift\nRemarks: pautog nasd','2026-10-19 22:17:19','2026-10-19 22:17:19','2026-10-19 22:21:07'),(21,16,6,1,'withdrawn','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift\nRemarks: utog nasd','2026-10-19 22:52:30','2026-10-19 22:52:30','2026-10-19 22:57:14'),(22,16,6,1,'withdrawn','Preferred Study Mode: Full-time\nPreferred Shift: Day Shift','2026-10-19 23:00:45','2026-10-19 23:00:45','2026-10-19 23:07:51'),(23,18,7,1,'approved','Preferred Study Mode: Part-time\nPreferred Shift: Evening Shift\nRemarks: ako ni cedrick','2026-10-20 00:58:34','2026-10-20 00:58:34','2026-10-20 00:59:34'),(24,19,12,1,'approved','Preferred Study Mode: Full-time\nPreferred Shift: Evening Shift\nRemarks: para asa ni','2026-10-20 05:40:06','2026-10-20 05:40:06','2026-10-20 05:41:13');
/*!40000 ALTER TABLE `admission_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admission_periods`
--

DROP TABLE IF EXISTS `admission_periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admission_periods` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year` varchar(9) COLLATE utf8mb4_unicode_ci NOT NULL,
  `admission_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Incoming Freshman',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('open','closed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'closed',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admission_periods`
--

LOCK TABLES `admission_periods` WRITE;
/*!40000 ALTER TABLE `admission_periods` DISABLE KEYS */;
INSERT INTO `admission_periods` VALUES (1,'TMC Incoming Freshman Admission','2026-2027','Incoming Freshman','2026-09-23','2026-10-31','open','2026-09-23 03:19:20','2026-09-23 03:19:20');
/*!40000 ALTER TABLE `admission_periods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admission_requirement_program`
--

DROP TABLE IF EXISTS `admission_requirement_program`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admission_requirement_program` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admission_requirement_id` bigint unsigned NOT NULL,
  `academic_program_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `req_program_unique` (`admission_requirement_id`,`academic_program_id`),
  KEY `admission_requirement_program_academic_program_id_foreign` (`academic_program_id`),
  CONSTRAINT `admission_requirement_program_academic_program_id_foreign` FOREIGN KEY (`academic_program_id`) REFERENCES `academic_programs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `admission_requirement_program_admission_requirement_id_foreign` FOREIGN KEY (`admission_requirement_id`) REFERENCES `admission_requirements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admission_requirement_program`
--

LOCK TABLES `admission_requirement_program` WRITE;
/*!40000 ALTER TABLE `admission_requirement_program` DISABLE KEYS */;
INSERT INTO `admission_requirement_program` VALUES (8,3,11,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(9,3,10,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(10,3,8,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(11,3,12,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(12,3,9,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(13,3,6,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(14,3,7,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(15,4,11,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(16,4,10,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(17,4,8,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(18,4,12,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(19,4,9,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(20,4,6,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(21,4,7,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(22,5,11,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(23,5,10,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(24,5,8,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(25,5,12,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(26,5,9,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(27,5,6,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(28,5,7,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(29,6,11,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(30,6,10,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(31,6,8,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(32,6,12,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(33,6,9,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(34,6,6,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(35,6,7,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(36,7,11,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(37,7,10,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(38,7,8,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(39,7,12,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(40,7,9,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(41,7,6,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(42,7,7,'2026-09-28 10:25:20','2026-09-28 10:25:20'),(43,8,11,'2026-09-28 10:25:20','2026-09-28 10:25:20'),(44,8,10,'2026-09-28 10:25:20','2026-09-28 10:25:20'),(45,8,8,'2026-09-28 10:25:20','2026-09-28 10:25:20'),(46,8,12,'2026-09-28 10:25:20','2026-09-28 10:25:20'),(47,8,9,'2026-09-28 10:25:20','2026-09-28 10:25:20'),(48,8,6,'2026-09-28 10:25:20','2026-09-28 10:25:20'),(49,8,7,'2026-09-28 10:25:20','2026-09-28 10:25:20');
/*!40000 ALTER TABLE `admission_requirement_program` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admission_requirements`
--

DROP TABLE IF EXISTS `admission_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admission_requirements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admission_requirements`
--

LOCK TABLES `admission_requirements` WRITE;
/*!40000 ALTER TABLE `admission_requirements` DISABLE KEYS */;
INSERT INTO `admission_requirements` VALUES (3,'PSA Birth Certificate','A clear copy of the applicant\'s PSA-issued birth certificate.',NULL,1,1,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(4,'Senior High School Report Card','A clear copy of the applicant\'s Senior High School report card or Form 138.',NULL,0,1,'2026-09-28 10:25:19','2026-09-30 21:20:22'),(5,'Certificate of Good Moral Character','A certificate of good moral character issued by the applicant\'s previous school.',NULL,1,1,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(6,'2x2 ID Picture','Recent 2x2 ID picture with appropriate attire and clear facial visibility.',NULL,1,1,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(7,'Valid Government-Issued ID','A clear copy of a valid government-issued identification card, if applicable.',NULL,0,1,'2026-09-28 10:25:19','2026-09-28 10:25:19'),(8,'Certificate of Residency','Certificate or proof of residency, when required for admission or scholarship evaluation.',NULL,0,1,'2026-09-28 10:25:20','2026-09-28 10:25:20');
/*!40000 ALTER TABLE `admission_requirements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcement_dismissals`
--

DROP TABLE IF EXISTS `announcement_dismissals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcement_dismissals` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `announcement_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `announcement_dismissals_user_id_announcement_id_unique` (`user_id`,`announcement_id`),
  KEY `announcement_dismissals_announcement_id_foreign` (`announcement_id`),
  CONSTRAINT `announcement_dismissals_announcement_id_foreign` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `announcement_dismissals_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcement_dismissals`
--

LOCK TABLES `announcement_dismissals` WRITE;
/*!40000 ALTER TABLE `announcement_dismissals` DISABLE KEYS */;
INSERT INTO `announcement_dismissals` VALUES (8,5,7,'2026-10-17 22:50:03','2026-10-17 22:50:03'),(9,5,6,'2026-10-17 22:50:04','2026-10-17 22:50:04');
/*!40000 ALTER TABLE `announcement_dismissals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('draft','published') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `dispatch_pending` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
INSERT INTO `announcements` VALUES (3,'TES Scholarship Applications Available','Qualified applicants may now apply for the Tertiary Education Subsidy (TES). Please review the scholarship eligibility requirements and submit the required supporting documents through the applicant portal.','published','2026-09-28 10:38:41','2026-09-28 10:38:41','2026-09-28 10:38:41',0),(4,'Complete Your Admission Requirements','Applicants are reminded to upload clear and readable copies of all required admission documents. Please check the Documents section of the applicant portal to monitor missing, pending, and verified requirements.','published','2026-09-28 10:38:48','2026-09-28 10:38:48','2026-09-28 10:38:48',0),(5,'Important Reminder for Applicants','Please regularly check your EduPath applicant portal for admission updates, scholarship information, examination schedules, and official announcements from Trinidad Municipal College.','published','2026-09-28 10:39:23','2026-09-28 10:39:23','2026-09-28 10:39:23',0),(6,'2026-2027 Admission Applications Now Open','Trinidad Municipal College is now accepting admission applications for Academic Year 2026-2027. Applicants are encouraged to complete their application and submit all required documents before the admission deadline.','published','2026-09-28 10:39:47','2026-09-28 10:39:47','2026-09-28 10:39:47',0),(7,'Entrance Examination Schedule Released','The TMC Entrance Examination for incoming applicants is scheduled on October 10, 2026 from 8:00 AM to 10:00 AM at the Trinidad Municipal College Examination Hall. Applicants should check their portal for examination details.','published','2026-09-28 10:40:32','2026-09-28 10:40:32','2026-09-28 10:40:32',0);
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `applicants`
--

DROP TABLE IF EXISTS `applicants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applicants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `middle_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `gender` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `profile_photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `primary_school` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primary_school_year` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `junior_high_school` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `senior_high_school` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shs_strand` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lrn` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `previous_college_university` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `applicants_user_id_unique` (`user_id`),
  CONSTRAINT `applicants_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `applicants`
--

LOCK TABLES `applicants` WRITE;
/*!40000 ALTER TABLE `applicants` DISABLE KEYS */;
INSERT INTO `applicants` VALUES (1,4,'jhayde','d','lufdy','2004-09-05','Male','0985508855','ANDA',NULL,1,'2026-09-21 02:35:38','2026-10-11 08:11:23',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,5,'Archie','D.','Corre','2006-09-05','Male','0985568686','Alicia','profile_photos/2QFtkjvHDewbFssV3yLIPcHilpzsP66pqelWxFXC.jpg',0,'2026-09-21 02:47:43','2026-10-17 12:52:22','PES','2018','ATVHS','ATVHS','TVL','101010101011','N/A'),(3,6,'da','adad','adad','2002-12-02','Male','66565656','daadadad',NULL,1,'2026-09-21 03:02:21','2026-10-11 08:11:37',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,9,'oseasa','qq','morant','2002-02-21','Male','989898','dfee',NULL,1,'2026-09-21 16:08:51','2026-10-11 08:11:52',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,10,'ced','jaa','cdrdrd','2006-09-05','Male','12121243141141','progrew','profile_photos/yK17Q8ZIk0KUIbfEZaQ5ePz5vj5BKhrm2PsIS6EH.png',1,'2026-09-23 08:18:07','2026-10-11 08:11:48',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,11,'Mark','D','Pits','2009-09-25','Male','0985656523','Mabini',NULL,1,'2026-09-25 02:12:07','2026-10-11 08:11:43',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,12,'rhae','Dssj','Jsjsj','2008-10-13','Other','0955656565','Sjdjdjdneenen',NULL,0,'2026-10-12 19:23:34','2026-10-12 19:23:34',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(8,13,'alviz','Fjdjd','Bhdhd','2008-10-13','Female','09856446468','Ushehdhddhh','profile_photos/LSxQGeUrVm7Zx1JHoIKbSJutKNnNHaK33UqFL8pw.jpg',0,'2026-10-12 19:41:48','2026-10-12 19:43:32',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(9,14,'Seyat','Vshsehh','Hehehehe','2008-10-13','Female','946446','Hahshs',NULL,1,'2026-10-12 19:58:01','2026-10-17 10:32:50',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(10,15,'David',NULL,'Caballero','2008-10-02','Male','09123947893','Bangwalog',NULL,0,'2026-10-14 15:14:05','2026-10-14 15:14:05',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(11,16,'Oseas','V','Jamora','2005-10-15','Male','09954101080','Purok 5 Bangwalog Duero','profile_photos/bAmxaPrMc1xQXo1BYqlbNbS0WCvK8ZDlC96C9Fjx.jpg',0,'2026-10-14 23:01:16','2026-10-14 23:11:05',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(13,18,'Workflow',NULL,'Check','2001-02-03','Other','09180000000','QA St',NULL,1,'2026-10-15 18:20:42','2026-10-17 10:32:41',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(14,19,'sabbabba','sss','sswsw','2001-12-12','Male','122121212','2asasasas',NULL,1,'2026-10-16 11:23:06','2026-10-17 10:32:36',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(15,22,'Haha','Haha','Uwuw','2008-10-18','Female','906865565656','Akaksk','profile_photos/fqRWbzs5tvPy2GMSmKmLo5yct4swP1tyDWKBHIfs.jpg',0,'2026-10-17 14:42:00','2026-10-17 14:43:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(16,23,'Oseas','V','Jamora','2005-10-20','Male','09954101080','Purok 5 Bangwalog Duero Bohol','profile_photos/O4Su0UXCV0gF55yTELuc4p0Uo0T7aSZCwgUHR0tK.jpg',0,'2026-10-19 22:12:49','2026-10-19 22:24:27',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(18,28,'Mark Anthony','Wahing','Pepito','2004-11-17',NULL,'09123456789','Marcelo, Mabini, Bohol','profile_photos/wwuJOFQtXPB9TAGpRJ97BMdi8ZsffZS7qed3lfuA.jpg',0,'2026-10-20 00:40:52','2026-10-20 02:00:38',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(19,29,'Devid',NULL,'Caballero','2008-10-20','Male','091519509785','Bangwalog duero bohol','profile_photos/BAjfzGF0zHGzP0zv2s7nmUrX2WZSKtjEJJlQWD8m.jpg',0,'2026-10-20 05:19:54','2026-10-20 06:44:40',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `applicants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `application_document_histories`
--

DROP TABLE IF EXISTS `application_document_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_document_histories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `application_document_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `application_document_histories_user_id_foreign` (`user_id`),
  KEY `application_document_histories_application_document_id_foreign` (`application_document_id`),
  CONSTRAINT `application_document_histories_application_document_id_foreign` FOREIGN KEY (`application_document_id`) REFERENCES `application_documents` (`id`) ON DELETE SET NULL,
  CONSTRAINT `application_document_histories_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_document_histories`
--

LOCK TABLES `application_document_histories` WRITE;
/*!40000 ALTER TABLE `application_document_histories` DISABLE KEYS */;
INSERT INTO `application_document_histories` VALUES (1,NULL,5,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-09-23 06:52:47','2026-09-23 06:52:47'),(2,NULL,3,'status_updated','verified','under_review',NULL,'2026-09-23 06:58:41','2026-09-23 06:58:41'),(3,NULL,3,'status_updated','pending','under_review',NULL,'2026-09-23 07:01:44','2026-09-23 07:01:44'),(4,NULL,1,'status_updated','under_review','verified',NULL,'2026-09-23 07:07:12','2026-09-23 07:07:12'),(5,NULL,5,'uploaded',NULL,'pending','Temporary document for deletion history test.','2026-09-23 07:17:17','2026-09-23 07:17:17'),(6,NULL,1,'deleted','pending',NULL,'Document deleted by administrator.','2026-09-23 07:18:46','2026-09-23 07:18:46'),(7,6,5,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-09-30 21:26:07','2026-09-30 21:26:07'),(8,7,5,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-09-30 21:26:38','2026-09-30 21:26:38'),(9,8,5,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-09-30 21:27:00','2026-09-30 21:27:00'),(10,9,5,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-09-30 21:28:07','2026-09-30 21:28:07'),(11,9,3,'status_updated','pending','under_review',NULL,'2026-09-30 22:43:09','2026-09-30 22:43:09'),(12,8,3,'status_updated','pending','verified',NULL,'2026-09-30 22:43:23','2026-09-30 22:43:23'),(13,7,3,'status_updated','pending','under_review',NULL,'2026-09-30 22:43:33','2026-09-30 22:43:33'),(14,6,3,'status_updated','pending','under_review',NULL,'2026-09-30 22:43:42','2026-09-30 22:43:42'),(15,10,5,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-01 01:17:08','2026-10-01 01:17:08'),(16,10,3,'status_updated','pending','under_review',NULL,'2026-10-01 01:18:16','2026-10-01 01:18:16'),(17,10,1,'status_updated','under_review','verified',NULL,'2026-10-01 01:19:37','2026-10-01 01:19:37'),(18,NULL,5,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-01 02:19:36','2026-10-01 02:19:36'),(19,12,14,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-12 20:03:49','2026-10-12 20:03:49'),(20,NULL,5,'deleted','pending',NULL,'Document deleted by applicant.','2026-10-14 08:28:38','2026-10-14 08:28:38'),(21,13,15,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-14 15:15:52','2026-10-14 15:15:52'),(22,14,15,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-14 15:15:53','2026-10-14 15:15:53'),(23,15,15,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-14 15:15:55','2026-10-14 15:15:55'),(24,16,15,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-14 15:15:56','2026-10-14 15:15:56'),(25,16,1,'status_updated','pending','under_review',NULL,'2026-10-14 22:31:00','2026-10-14 22:31:00'),(26,17,16,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-14 23:04:18','2026-10-14 23:04:18'),(27,18,16,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-14 23:04:28','2026-10-14 23:04:28'),(28,19,16,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-14 23:04:40','2026-10-14 23:04:40'),(29,20,16,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-14 23:04:46','2026-10-14 23:04:46'),(30,NULL,18,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-15 18:26:33','2026-10-15 18:26:33'),(31,NULL,18,'deleted','pending',NULL,'Document deleted by applicant.','2026-10-15 18:26:35','2026-10-15 18:26:35'),(32,9,1,'status_updated','under_review','verified',NULL,'2026-10-16 05:28:56','2026-10-16 05:28:56'),(33,7,1,'status_updated','under_review','verified',NULL,'2026-10-16 05:29:04','2026-10-16 05:29:04'),(34,6,1,'status_updated','under_review','verified',NULL,'2026-10-16 05:29:11','2026-10-16 05:29:11'),(35,22,19,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-16 11:24:55','2026-10-16 11:24:55'),(36,23,5,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-17 11:51:15','2026-10-17 11:51:15'),(37,24,23,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-19 22:17:21','2026-10-19 22:17:21'),(38,25,23,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-19 22:17:22','2026-10-19 22:17:22'),(39,26,23,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-19 22:17:24','2026-10-19 22:17:24'),(40,27,23,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-19 22:17:25','2026-10-19 22:17:25'),(41,28,23,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-19 22:52:31','2026-10-19 22:52:31'),(42,29,23,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-19 22:52:32','2026-10-19 22:52:32'),(43,30,23,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-19 22:52:33','2026-10-19 22:52:33'),(44,31,23,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-19 22:52:34','2026-10-19 22:52:34'),(45,32,28,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-20 00:58:37','2026-10-20 00:58:37'),(46,33,28,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-20 00:58:42','2026-10-20 00:58:42'),(47,34,28,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-20 00:58:46','2026-10-20 00:58:46'),(48,35,28,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-20 00:58:50','2026-10-20 00:58:50'),(49,36,28,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-20 01:03:40','2026-10-20 01:03:40'),(50,37,28,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-20 01:21:18','2026-10-20 01:21:18'),(51,38,29,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-20 05:40:11','2026-10-20 05:40:11'),(52,39,29,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-20 05:40:12','2026-10-20 05:40:12'),(53,40,29,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-20 05:40:28','2026-10-20 05:40:28'),(54,41,29,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-20 06:05:21','2026-10-20 06:05:21'),(55,42,29,'uploaded',NULL,'pending','Document uploaded by applicant.','2026-10-20 06:34:24','2026-10-20 06:34:24');
/*!40000 ALTER TABLE `application_document_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `application_documents`
--

DROP TABLE IF EXISTS `application_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `application_documents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admission_application_id` bigint unsigned NOT NULL,
  `document_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','under_review','verified','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `application_documents_admission_application_id_foreign` (`admission_application_id`),
  CONSTRAINT `application_documents_admission_application_id_foreign` FOREIGN KEY (`admission_application_id`) REFERENCES `admission_applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `application_documents`
--

LOCK TABLES `application_documents` WRITE;
/*!40000 ALTER TABLE `application_documents` DISABLE KEYS */;
INSERT INTO `application_documents` VALUES (6,6,'2x2 ID Picture','documents/X6jHKE2tXLjULvWUD2HfiJNpEo06KCRYsuyOH0Fo.jpg','image/jpeg','verified',NULL,'2026-09-30 21:26:07','2026-10-16 05:29:11'),(7,6,'Certificate of Good Moral Character','documents/CLGq7gKnQr2uUVaTpL7xbA1YbpH9M8HPeViTEeg5.jpg','image/jpeg','verified',NULL,'2026-09-30 21:26:38','2026-10-16 05:29:04'),(8,6,'PSA Birth Certificate','documents/64iIfmoPth0qAVkX7WeZyBoT3PdIViatO6JPJvoW.jpg','image/jpeg','verified',NULL,'2026-09-30 21:27:00','2026-09-30 22:43:23'),(9,6,'Certificate of Residency','documents/fyjp8xAHXLlNhbRoVW3thP5W32aRmfsfmkjKPjqk.jpg','image/jpeg','verified',NULL,'2026-09-30 21:28:07','2026-10-16 05:28:56'),(10,6,'Senior High School Report Card','documents/PBWT569kOMCmkUZsA5h3Ltu6TfcUe3kGzDiJhxWT.jpg','image/jpeg','verified',NULL,'2026-10-01 01:17:08','2026-10-01 01:19:37'),(12,8,'vh','documents/N5onFkka14GivCTx85CeAD18viseTSd0xnkPvilE.jpg','image/jpeg','pending',NULL,'2026-10-12 20:03:49','2026-10-12 20:03:49'),(13,10,'Form 138 / High School Report Card','documents/NQ1EI9c0Lehk2wBo4rDnWFWjDuZK6vQjZTI2vlXh.jpg','image/jpeg','pending',NULL,'2026-10-14 15:15:52','2026-10-14 15:15:52'),(14,10,'Certificate of Good Moral Character','documents/MDxPS9qZkvQnJFmqtZ3pPJcLs63IEl9sGkdrZS1r.jpg','image/jpeg','pending',NULL,'2026-10-14 15:15:53','2026-10-14 15:15:53'),(15,10,'PSA Birth Certificate','documents/FGQI0rXgDu0S8rmH5NsVxXK9iIssclJpA9CRO5lK.jpg','image/jpeg','pending',NULL,'2026-10-14 15:15:55','2026-10-14 15:15:55'),(16,10,'2x2 Recent ID Photo','documents/eHP2zHc2GcZ3OI6QcquItENlbCmSYJUfZ6QHLVGk.jpg','image/jpeg','under_review',NULL,'2026-10-14 15:15:56','2026-10-14 22:30:59'),(17,11,'Form 138 / High School Report Card','documents/pOqyisZ86INWDGrreKkQANX1PnBtEdZgLYmsY2Z7.jpg','image/jpeg','pending',NULL,'2026-10-14 23:04:18','2026-10-14 23:04:18'),(18,11,'Certificate of Good Moral Character','documents/Nv31Jb6tTrrhXhz90qPn5XnJWCQCUhfF4knFqvwD.jpg','image/jpeg','pending',NULL,'2026-10-14 23:04:28','2026-10-14 23:04:28'),(19,11,'PSA Birth Certificate','documents/vTjMjl9HrOVIbimWz9w2rKZPKTWkcelhBnL08Yi0.jpg','image/jpeg','pending',NULL,'2026-10-14 23:04:40','2026-10-14 23:04:40'),(20,11,'2x2 Recent ID Photo','documents/f5zD1znNit2PhDXeDdZG0R7uMtofcp1mX48rZobO.jpg','image/jpeg','pending',NULL,'2026-10-14 23:04:46','2026-10-14 23:04:46'),(22,15,'2x2 ID Picture','documents/k7PI1kFWtffWyOOvwAlOuKM0SQVyBDBZCzkVEKdi.jpg','image/jpeg','pending',NULL,'2026-10-16 11:24:55','2026-10-16 11:24:55'),(23,16,'Scholarship Document - Free Higher Education (FHE)','documents/mPKYK7uTFL0NHryNVeVhfKMKhufzmcOSxzPI1YgO.png','image/png','pending',NULL,'2026-10-17 11:51:15','2026-10-17 11:51:15'),(24,20,'Form 138 / High School Report Card','documents/C5PYeKDOHI8TlFO7oNdc9mTqaicQ5MHb8cJExjWC.png','image/png','pending',NULL,'2026-10-19 22:17:21','2026-10-19 22:17:21'),(25,20,'Certificate of Good Moral Character','documents/6k2lm8KGGYuOIpw3TX8CxVViJ761gcymmhQV1inC.png','image/png','pending',NULL,'2026-10-19 22:17:22','2026-10-19 22:17:22'),(26,20,'PSA Birth Certificate','documents/0PPKeG5buPILnyPcOeJDtccsMPcFmOSqX8eXJBOX.jpg','image/jpeg','pending',NULL,'2026-10-19 22:17:24','2026-10-19 22:17:24'),(27,20,'2x2 Recent ID Photo','documents/uzmJSdZO1Snm027r9iJny14kzWD79buJMjfpjLXB.jpg','image/jpeg','pending',NULL,'2026-10-19 22:17:25','2026-10-19 22:17:25'),(28,21,'Form 138 / High School Report Card','documents/9lCrz4w1BBorpqerCSCRyuUsPqLuFKTRBnwtCRCw.jpg','image/jpeg','pending',NULL,'2026-10-19 22:52:31','2026-10-19 22:52:31'),(29,21,'Certificate of Good Moral Character','documents/RVs6Z9csl7OOQMaGcpEFwkT8GsBf3FNDpXGtqNxF.jpg','image/jpeg','pending',NULL,'2026-10-19 22:52:32','2026-10-19 22:52:32'),(30,21,'PSA Birth Certificate','documents/MlmR5XVNbPipJ5XgqLkzBmTQb8LYSgLlvnnUH8pX.jpg','image/jpeg','pending',NULL,'2026-10-19 22:52:33','2026-10-19 22:52:33'),(31,21,'2x2 Recent ID Photo','documents/BcqX903016xuGPKxwHpR4DilfPl00XkoE4RVPxoZ.jpg','image/jpeg','pending',NULL,'2026-10-19 22:52:34','2026-10-19 22:52:34'),(32,23,'Form 138 / High School Report Card','documents/QNnfTZvRz1qqHiDYLt0YOx4tzLP61AIu0ZaD0p0O.jpg','image/jpeg','pending',NULL,'2026-10-20 00:58:37','2026-10-20 00:58:37'),(33,23,'Certificate of Good Moral Character','documents/RQ5976CK7oerxwoiExFlwMrotw1kyCDUnnZSYUFs.jpg','image/jpeg','pending',NULL,'2026-10-20 00:58:42','2026-10-20 00:58:42'),(34,23,'PSA Birth Certificate','documents/PlBaqxhorW4rS0kLj3unS3u4r9HNrn52kYTRJAj0.jpg','image/jpeg','pending',NULL,'2026-10-20 00:58:46','2026-10-20 00:58:46'),(35,23,'2x2 Recent ID Photo','documents/Bhqidqn8GVqFGiMoJkuVsmUoXQqGS8erMTNqYziu.jpg','image/jpeg','pending',NULL,'2026-10-20 00:58:50','2026-10-20 00:58:50'),(36,23,'Scholarship Document - Tulong Dunong Program (TDP)','documents/9tL0H4MCcLuFvb9GQKPhbBfg6i99hWVW5EhIL2x9.jpg','image/jpeg','pending',NULL,'2026-10-20 01:03:40','2026-10-20 01:03:40'),(37,23,'Scholarship Document - Free Higher Education (FHE)','documents/slASg60gNrV84kCi5dmAkX264tU0dbnf9ldKLyte.jpg','image/jpeg','pending',NULL,'2026-10-20 01:21:18','2026-10-20 01:21:18'),(38,24,'Form 138 / High School Report Card','documents/GoZFWFCziqiJ6NME5xFw1srrntDZId0WPvgUOEiw.png','image/png','pending',NULL,'2026-10-20 05:40:11','2026-10-20 05:40:11'),(39,24,'Certificate of Good Moral Character','documents/YLKYXxj895ZMrws7gKr3wmZoNwhqTeVAefXTyi1w.jpg','image/jpeg','pending',NULL,'2026-10-20 05:40:12','2026-10-20 05:40:12'),(40,24,'2x2 Recent ID Photo','documents/SKaMzYIn1NIqqKLQjESGtzGHw5tRfgIaVyyfxIXF.jpg','image/jpeg','pending',NULL,'2026-10-20 05:40:28','2026-10-20 05:40:28'),(41,24,'Scholarship Document - Free Higher Education (FHE)','documents/GPY0h3iGq9zsINhvkFbsWzGW2fFEo38MZyB6BSV6.jpg','image/jpeg','pending',NULL,'2026-10-20 06:05:21','2026-10-20 06:05:21'),(42,24,'Scholarship Document - LIBRE TAGAY','documents/5dgkbvjgj2Rp690rry6CbRKFvy2ED346XZ8Ugs7y.png','image/png','pending',NULL,'2026-10-20 06:34:24','2026-10-20 06:34:24');
/*!40000 ALTER TABLE `application_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
INSERT INTO `cache` VALUES ('laravel_cache_27a3c6e66b93f638fc4f24049ca5ec56','i:1;',1792475247),('laravel_cache_27a3c6e66b93f638fc4f24049ca5ec56:timer','i:1792475247;',1792475247),('laravel_cache_3bf45ef21730dcb00a74fb630061d1d7','i:1;',1792502866),('laravel_cache_3bf45ef21730dcb00a74fb630061d1d7:timer','i:1792502866;',1792502866),('laravel_cache_3c8a1b95a5e0f59bfe35737933a8625a','i:1;',1792485778),('laravel_cache_3c8a1b95a5e0f59bfe35737933a8625a:timer','i:1792485778;',1792485778),('laravel_cache_40742de4d13913c30f0b05b6900e3aa0','i:1;',1792476828),('laravel_cache_40742de4d13913c30f0b05b6900e3aa0:timer','i:1792476827;',1792476828),('laravel_cache_61c12f9a398c09c085688b2ae0bb8d1a','i:1;',1792476840),('laravel_cache_61c12f9a398c09c085688b2ae0bb8d1a:timer','i:1792476840;',1792476840),('laravel_cache_63774ce53ac64c9a6077a0c9d551e262','i:1;',1792502454),('laravel_cache_63774ce53ac64c9a6077a0c9d551e262:timer','i:1792502454;',1792502454),('laravel_cache_68c3217ff4db61f1d06faba20586e407','i:1;',1792516716),('laravel_cache_68c3217ff4db61f1d06faba20586e407:timer','i:1792516715;',1792516715),('laravel_cache_69ef559a09cb7e5464ce83d90ffa94a4','i:1;',1792502222),('laravel_cache_69ef559a09cb7e5464ce83d90ffa94a4:timer','i:1792502222;',1792502222),('laravel_cache_6b709b4d4eade97317d4a154f836d008','i:2;',1792408544),('laravel_cache_6b709b4d4eade97317d4a154f836d008:timer','i:1792408544;',1792408544),('laravel_cache_7dd33bad4299b9c01027b92995df2d6d','i:1;',1792408487),('laravel_cache_7dd33bad4299b9c01027b92995df2d6d:timer','i:1792408487;',1792408487),('laravel_cache_80b9c71a679be9d0a5f3f1b08aa85498','i:1;',1792485778),('laravel_cache_80b9c71a679be9d0a5f3f1b08aa85498:timer','i:1792485778;',1792485778),('laravel_cache_87ee04c9b4a536bdb914e34a8d7c9ce1','i:1;',1792326715),('laravel_cache_87ee04c9b4a536bdb914e34a8d7c9ce1:timer','i:1792326715;',1792326715),('laravel_cache_92fb0efab17cee79f4b794b0a2886fb9','i:1;',1792503772),('laravel_cache_92fb0efab17cee79f4b794b0a2886fb9:timer','i:1792503772;',1792503772),('laravel_cache_95fc84e60f316c2429e8a12bfc268078','i:2;',1792502223),('laravel_cache_95fc84e60f316c2429e8a12bfc268078:timer','i:1792502223;',1792502223),('laravel_cache_9ca0d856b3fd4e5fdbd1a471ee3ec7ae','i:1;',1792502454),('laravel_cache_9ca0d856b3fd4e5fdbd1a471ee3ec7ae:timer','i:1792502454;',1792502454),('laravel_cache_a7c4643663599ec56c710da074298201','i:2;',1792503810),('laravel_cache_a7c4643663599ec56c710da074298201:timer','i:1792503810;',1792503810),('laravel_cache_aa2de1852574ec1658ae60d89617c05b','i:1;',1792476828),('laravel_cache_aa2de1852574ec1658ae60d89617c05b:timer','i:1792476828;',1792476828),('laravel_cache_acad91ed3a2fcaa72cfb0b0f14709968','i:1;',1792408585),('laravel_cache_acad91ed3a2fcaa72cfb0b0f14709968:timer','i:1792408585;',1792408585),('laravel_cache_affd608a4f44b372eee8bf3406773904','i:1;',1792516716),('laravel_cache_affd608a4f44b372eee8bf3406773904:timer','i:1792516716;',1792516716),('laravel_cache_cd4eb1f2bb8ce73a90ad83c9bcc5b854','i:1;',1792503863),('laravel_cache_cd4eb1f2bb8ce73a90ad83c9bcc5b854:timer','i:1792503863;',1792503863),('laravel_cache_dfe51c1c9f1f831e85c895f9a3cbb5e2','i:1;',1792485711),('laravel_cache_dfe51c1c9f1f831e85c895f9a3cbb5e2:timer','i:1792485711;',1792485711),('laravel_cache_e98fe976b77283df06dcb4cb6197cff6','i:1;',1792485711),('laravel_cache_e98fe976b77283df06dcb4cb6197cff6:timer','i:1792485711;',1792485711),('laravel_cache_eea96bc305365640819c740d5c293a38','i:1;',1792459212),('laravel_cache_eea96bc305365640819c740d5c293a38:timer','i:1792459212;',1792459212),('laravel_cache_fcm_google_access_token','s:1024:\"ya29.c.c0AZ4bNpbMw5EzpAUG8xFC10hN2eIkZYmQdk1cv_Ytr6EitnKGLxHKTA7EHAHAnK1b8daz9GELyPU4BucYv315gncnIqeaw8B0MIw3u1PLlXSOj4MXS78UvPnOgjCTj-7ra31GGvGBp2NSvz_ffM-pIxsmQ9XAoTMlTP-gT6_lv67N1KcgJHirHqOHOt6RR0KPP1gQKM9XIqrWKbLancIYLZErv1IsFi0yPhx68Bx881JctEvVWICpcAkrVnlAxMFgk2XnMaJjvblUedlcT0ocg6Fe0lzI8iphDD4Z-kft-3SDiawWirL4rL7OeAs0fEjNOobhAXh4PZCGD5nou1YuV_qvYJ3f8qIUy3yBTweIeQZzSNRGxUnlzrA8E385D3iS7p_Qoup31oaSBcwU0qlzvMUIrUrSFho7p6lOUdx9S-gMYjkx5lOBov1dw2Yx6j22Yh3Qx8JZxzV02cibcmmeXQ2dM2VFdjmwvoihq_zoxdbh_4ZhxIydV5R9pQtkd0eOho5IcbXztwaiO3Fy0Brk1M7m6BBmI2r_Okr1j-5YVw4sk2ukh16tuWszB01Q-VVu-jyXBu1hwb8rJWWQxubSeBmjzt-vFcrUydIba3Z0ROWeIVVMuMn-4UXQr0-elwyW2oj3bRr4otJzX0MrmB-mXwZM4uz3WRiygrO9moIfRjQzkZnUrbbfVX0rn0Z4t7rx31R2wIsWk6lJk0Rckenmk1zbf1ohzXUk_lYlIQ2ow5zne42SQkgJIBitqaj5c6Rowv3ajWxva6Wbc6XB2gFQrRBkZ-1vBoW9FjXw7b_xejy8h80Vvcvq1z9oubxsXvvZBqriOdI_0j03FucOxYOslyrOvrRczSYQf6cciYIJxbI8m8ZcWO6eQuf4eSr8tl_a1cdw4xiYV7hj6tYIZR9OIX-W040IboOlworJOFgpx3vnBhQVRoz7eeQZyu0jIY2cSutMWM7V_FV4gbfXJRksfUBdBgn9whWklwh44ehV24SOncr9zpp3noU\";',1792519029);
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entrance_exams`
--

DROP TABLE IF EXISTS `entrance_exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entrance_exams` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `exam_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `venue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` int DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `results_released_at` timestamp NULL DEFAULT NULL,
  `roster_pdf_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entrance_exams`
--

LOCK TABLES `entrance_exams` WRITE;
/*!40000 ALTER TABLE `entrance_exams` DISABLE KEYS */;
INSERT INTO `entrance_exams` VALUES (5,'TMC Entrance Examination - Batch 1','Sample entrance examination schedule for incoming Trinidad Municipal College applicants. Please arrive 30 minutes early.','2026-10-20','08:00:00','10:00:00','Trinidad Municipal College - Room IT101',30,0,'2026-10-17 12:14:24','2026-10-20 06:13:52','2026-10-20 00:54:04',NULL),(6,'BAtch 2','xam namo','2026-10-21','08:00:00','10:00:00','Trinidad Municipal College - Room IT 102',30,1,'2026-10-20 01:15:58','2026-10-20 01:18:44','2026-10-20 01:18:44','entrance-exam-rosters/6/f8kPaUOuJW9H5ZRWdEWUDygsgecnZcWN4WB3uyY3.pdf'),(7,'batch 3','hhahhaahahah','2026-10-20','08:00:00','10:00:00','Trinidad Municipal College - Room IT 103',19,1,'2026-10-20 06:13:21','2026-10-20 06:18:34','2026-10-20 06:18:34','entrance-exam-rosters/7/m0wgsn3zkm5T9oIbB1q9V3XIU3i3CAlJwojl5IGr.pdf');
/*!40000 ALTER TABLE `entrance_exams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exam_assignments`
--

DROP TABLE IF EXISTS `exam_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exam_assignments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `entrance_exam_id` bigint unsigned NOT NULL,
  `applicant_id` bigint unsigned NOT NULL,
  `status` enum('scheduled','completed','absent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `score` decimal(5,2) DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_assignments_entrance_exam_id_applicant_id_unique` (`entrance_exam_id`,`applicant_id`),
  KEY `exam_assignments_applicant_id_foreign` (`applicant_id`),
  CONSTRAINT `exam_assignments_applicant_id_foreign` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exam_assignments_entrance_exam_id_foreign` FOREIGN KEY (`entrance_exam_id`) REFERENCES `entrance_exams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exam_assignments`
--

LOCK TABLES `exam_assignments` WRITE;
/*!40000 ALTER TABLE `exam_assignments` DISABLE KEYS */;
INSERT INTO `exam_assignments` VALUES (8,5,2,'completed',50.00,NULL,'2026-10-17 12:28:45','2026-10-20 00:53:47'),(9,5,7,'absent',0.00,'bobo','2026-10-19 22:44:24','2026-10-20 00:53:49'),(10,5,8,'absent',0.00,'8080','2026-10-19 22:44:24','2026-10-20 00:53:53'),(11,5,10,'completed',39.00,'nice try bobo','2026-10-19 22:44:24','2026-10-20 00:53:54'),(12,5,11,'completed',99.00,'ggs','2026-10-19 22:44:24','2026-10-20 00:54:01'),(13,6,2,'completed',56.00,'gg\'s','2026-10-20 01:16:35','2026-10-20 01:18:33'),(14,6,18,'completed',57.00,'gg\'s','2026-10-20 01:16:35','2026-10-20 01:18:34'),(15,7,2,'completed',40.00,'nice one','2026-10-20 06:17:25','2026-10-20 06:18:29'),(16,7,19,'completed',99.00,'grabika','2026-10-20 06:17:25','2026-10-20 06:18:23');
/*!40000 ALTER TABLE `exam_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_08_25_091343_create_applicants_table',1),(5,'2026_08_25_091344_create_academic_programs_table',1),(6,'2026_08_25_091345_create_admission_applications_table',1),(7,'2026_08_25_091346_create_admission_requirements_table',1),(8,'2026_08_25_091346_create_application_documents_table',1),(9,'2026_08_25_091347_create_scholarships_table',1),(10,'2026_08_25_091348_create_scholarship_applications_table',1),(11,'2026_08_25_091349_create_entrance_exams_table',1),(12,'2026_08_25_091349_create_exam_assignments_table',1),(13,'2026_08_25_091350_create_announcements_table',1),(14,'2026_08_25_091351_create_notifications_table',1),(15,'2026_08_25_154002_create_personal_access_tokens_table',1),(16,'2026_08_25_185141_make_applicant_names_nullable',1),(17,'2026_09_01_051539_update_application_documents_status_enum',1),(18,'2026_09_10_021256_add_profile_photo_to_applicants_table',1),(19,'2026_09_10_053253_add_file_path_to_admission_requirements_table',1),(20,'2026_09_12_093340_create_admission_periods_table',1),(21,'2026_09_12_103738_add_is_archived_to_applicants_table',1),(22,'2026_09_17_084524_add_staff_role_to_users_table',1),(23,'2026_09_17_084737_create_staff_table',1),(24,'2026_09_17_085336_create_staff_programs_table',1),(25,'2026_09_17_103417_create_staff_permissions_table',1),(26,'2026_09_21_081658_create_password_reset_otps_table',1),(27,'2026_09_23_074751_add_enhanced_fields_to_scholarships_table',2),(28,'2026_09_23_100301_fix_application_documents_status_enum',3),(29,'2026_09_23_100850_add_under_review_to_application_documents_status_enum',4),(30,'2026_09_23_111251_add_academic_year_and_admission_type_to_admission_periods_table',5),(31,'2026_09_23_111550_add_admission_period_id_to_admission_applications_table',6),(32,'2026_09_23_120414_create_admission_requirement_program_table',7),(33,'2026_09_23_144227_create_application_document_histories_table',8),(34,'2026_09_23_144234_create_admission_application_histories_table',8),(35,'2026_09_23_150827_make_application_document_history_document_nullable',9),(36,'2026_09_28_165400_add_staff_role_to_staff_table',10),(37,'2026_09_28_175112_remove_department_from_staff_table',11),(38,'2026_10_13_000001_add_announcement_fields_to_notifications_table',12),(39,'2026_10_14_000001_add_fcm_token_to_users_table',13),(40,'2026_10_15_115952_add_results_released_at_to_entrance_exams_table',14),(41,'2026_10_16_000001_create_online_exam_tables',15),(42,'2026_10_16_000002_add_scholarship_rules_and_fixed_exam_questions',16),(43,'2026_10_17_000001_align_scholarship_awards_and_staff_recommendations',17),(44,'2026_10_17_000002_add_withdrawn_admission_status',18),(45,'2026_10_17_000003_add_profile_photo_to_users_table',19),(46,'2026_10_18_000001_add_educational_background_to_applicants_table',20),(47,'2026_10_18_000002_create_user_onboarding_states_table',21),(48,'2026_10_18_000003_create_announcement_dismissals_table',22),(49,'2026_10_18_000004_secure_password_reset_credentials',23),(50,'2026_10_18_000005_add_workflow_accountability',24),(51,'2026_10_18_000006_queue_existing_future_announcements',25),(52,'2026_10_19_000001_create_online_exam_settings_table',26),(53,'2026_10_20_000001_add_private_roster_to_entrance_exams',27),(54,'2026_10_20_000002_add_online_exam_staff_review',28),(55,'2026_10_20_000003_add_online_exam_review_permission',28),(56,'2026_10_20_000004_create_online_exam_availability_notices',29),(57,'2026_10_20_000005_add_online_exam_navigation',30);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_deliveries`
--

DROP TABLE IF EXISTS `notification_deliveries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_deliveries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `notification_id` bigint unsigned NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `attempts` int unsigned NOT NULL DEFAULT '0',
  `available_at` timestamp NULL DEFAULT NULL,
  `locked_until` timestamp NULL DEFAULT NULL,
  `last_error` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `notification_deliveries_notification_id_unique` (`notification_id`),
  KEY `notification_deliveries_status_index` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_deliveries`
--

LOCK TABLES `notification_deliveries` WRITE;
/*!40000 ALTER TABLE `notification_deliveries` DISABLE KEYS */;
INSERT INTO `notification_deliveries` VALUES (1,97,'skipped',1,'2026-10-20 09:07:04',NULL,NULL,'2026-10-19 01:13:05','2026-10-20 09:02:04'),(2,98,'skipped',1,'2026-10-20 09:07:04',NULL,NULL,'2026-10-19 01:13:05','2026-10-20 09:02:04'),(3,99,'skipped',1,'2026-10-20 09:07:04',NULL,NULL,'2026-10-19 01:13:05','2026-10-20 09:02:04'),(4,100,'skipped',1,'2026-10-20 09:07:04',NULL,NULL,'2026-10-19 01:13:05','2026-10-20 09:02:04'),(5,101,'skipped',1,'2026-10-20 09:07:04',NULL,NULL,'2026-10-19 01:13:05','2026-10-20 09:02:04'),(6,102,'skipped',1,'2026-10-20 09:07:04',NULL,NULL,'2026-10-19 01:13:05','2026-10-20 09:02:04'),(7,103,'skipped',1,'2026-10-20 09:07:04',NULL,NULL,'2026-10-19 01:13:05','2026-10-20 09:02:04'),(8,104,'skipped',1,'2026-10-20 09:07:04',NULL,NULL,'2026-10-19 01:13:06','2026-10-20 09:02:04'),(9,105,'skipped',1,'2026-10-20 09:07:04',NULL,NULL,'2026-10-19 01:13:06','2026-10-20 09:02:04'),(10,106,'skipped',1,'2026-10-20 09:07:04',NULL,NULL,'2026-10-19 01:13:06','2026-10-20 09:02:04'),(11,107,'skipped',1,'2026-10-20 09:07:04',NULL,NULL,'2026-10-19 01:13:06','2026-10-20 09:02:04'),(12,108,'skipped',1,'2026-10-20 09:07:04',NULL,NULL,'2026-10-19 01:13:06','2026-10-20 09:02:04'),(13,109,'skipped',1,'2026-10-20 09:07:04',NULL,NULL,'2026-10-19 01:13:06','2026-10-20 09:02:04'),(14,110,'skipped',1,'2026-10-20 09:07:04',NULL,NULL,'2026-10-19 01:13:06','2026-10-20 09:02:04'),(15,111,'sent',1,'2026-10-20 09:07:10',NULL,NULL,'2026-10-19 01:22:02','2026-10-20 09:02:10'),(16,112,'sent',1,'2026-10-20 09:07:11',NULL,NULL,'2026-10-19 01:23:45','2026-10-20 09:02:11'),(17,113,'sent',1,'2026-10-20 09:07:13',NULL,NULL,'2026-10-19 01:26:34','2026-10-20 09:02:13'),(18,114,'sent',1,'2026-10-20 09:07:14',NULL,NULL,'2026-10-19 01:30:34','2026-10-20 09:02:14'),(19,115,'sent',1,'2026-10-20 09:07:15',NULL,NULL,'2026-10-19 01:32:48','2026-10-20 09:02:15'),(20,116,'sent',1,'2026-10-20 09:07:16',NULL,NULL,'2026-10-19 16:12:52','2026-10-20 09:02:16'),(21,117,'skipped',1,'2026-10-20 09:07:16',NULL,NULL,'2026-10-19 22:21:08','2026-10-20 09:02:16'),(22,118,'skipped',1,'2026-10-20 09:07:16',NULL,NULL,'2026-10-19 22:25:29','2026-10-20 09:02:16'),(23,119,'sent',1,'2026-10-20 09:07:17',NULL,NULL,'2026-10-20 00:54:04','2026-10-20 09:02:17'),(24,120,'skipped',1,'2026-10-20 09:07:17',NULL,NULL,'2026-10-20 00:54:04','2026-10-20 09:02:17'),(25,121,'skipped',1,'2026-10-20 09:07:17',NULL,NULL,'2026-10-20 00:54:04','2026-10-20 09:02:17'),(26,122,'skipped',1,'2026-10-20 09:07:17',NULL,NULL,'2026-10-20 00:54:04','2026-10-20 09:02:17'),(27,123,'skipped',1,'2026-10-20 09:07:17',NULL,NULL,'2026-10-20 00:54:04','2026-10-20 09:02:17'),(28,124,'sent',1,'2026-10-20 09:07:18',NULL,NULL,'2026-10-20 00:54:53','2026-10-20 09:02:18'),(29,125,'sent',1,'2026-10-20 09:07:19',NULL,NULL,'2026-10-20 00:59:34','2026-10-20 09:02:19'),(30,126,'sent',1,'2026-10-20 09:07:20',NULL,NULL,'2026-10-20 01:06:18','2026-10-20 09:02:20'),(31,127,'sent',1,'2026-10-20 09:07:22',NULL,NULL,'2026-10-20 01:06:18','2026-10-20 09:02:22'),(32,128,'sent',1,'2026-10-20 09:07:23',NULL,NULL,'2026-10-20 01:18:44','2026-10-20 09:02:23'),(33,129,'sent',1,'2026-10-20 09:07:24',NULL,NULL,'2026-10-20 01:18:44','2026-10-20 09:02:24'),(34,130,'sent',1,'2026-10-20 09:07:25',NULL,NULL,'2026-10-20 01:22:23','2026-10-20 09:02:25'),(35,131,'sent',1,'2026-10-20 09:07:26',NULL,NULL,'2026-10-20 02:02:49','2026-10-20 09:02:26'),(36,132,'sent',1,'2026-10-20 09:07:27',NULL,NULL,'2026-10-20 02:10:01','2026-10-20 09:02:27'),(37,133,'sent',1,'2026-10-20 09:07:28',NULL,NULL,'2026-10-20 05:41:13','2026-10-20 09:02:28'),(38,134,'sent',1,'2026-10-20 09:07:30',NULL,NULL,'2026-10-20 06:18:34','2026-10-20 09:02:30'),(39,135,'sent',1,'2026-10-20 09:07:31',NULL,NULL,'2026-10-20 06:18:34','2026-10-20 09:02:31'),(40,136,'sent',1,'2026-10-20 09:07:32',NULL,NULL,'2026-10-20 06:37:47','2026-10-20 09:02:32'),(41,137,'sent',1,'2026-10-20 09:07:33',NULL,NULL,'2026-10-20 06:39:49','2026-10-20 09:02:33'),(42,138,'sent',1,'2026-10-20 09:07:34',NULL,NULL,'2026-10-20 06:39:50','2026-10-20 09:02:34'),(43,139,'sent',1,'2026-10-20 09:07:35',NULL,NULL,'2026-10-20 06:41:51','2026-10-20 09:02:35');
/*!40000 ALTER TABLE `notification_deliveries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_preferences`
--

DROP TABLE IF EXISTS `notification_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_preferences` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `preferences` json NOT NULL,
  `revision` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `notification_preferences_user_id_unique` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_preferences`
--

LOCK TABLES `notification_preferences` WRITE;
/*!40000 ALTER TABLE `notification_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `announcement_id` bigint unsigned DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_announcement_id_foreign` (`announcement_id`),
  KEY `notifications_user_id_type_is_read_index` (`user_id`,`type`,`is_read`),
  CONSTRAINT `notifications_announcement_id_foreign` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=140 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,5,'Document Approved','Your Birth Certificate has been approved.','general',NULL,1,'2026-09-21 15:39:14','2026-09-21 15:36:00','2026-09-21 15:39:14'),(2,5,'Document Under Review','Your Report Card is currently under review.','general',NULL,1,'2026-09-23 06:36:09','2026-09-23 05:40:16','2026-09-23 06:36:09'),(3,5,'Document Rejected','Your Birth Certificate has been rejected.','general',NULL,1,'2026-09-23 06:37:53','2026-09-23 06:36:42','2026-09-23 06:37:53'),(4,5,'Document Rejected','Your Birth Certificate has been rejected.','general',NULL,1,'2026-09-23 06:37:54','2026-09-23 06:36:56','2026-09-23 06:37:54'),(5,5,'Document Rejected','Your Birth Certificate has been rejected. Remarks: Please upload a clearer copy.','general',NULL,1,'2026-09-23 06:38:56','2026-09-23 06:37:19','2026-09-23 06:38:56'),(6,5,'Document Verified','Your Birth Certificate has been verified.','general',NULL,1,'2026-09-23 06:40:54','2026-09-23 06:40:33','2026-09-23 06:40:54'),(7,5,'Document Verified','Your PSA Birth Certificate has been verified.','general',NULL,1,'2026-09-30 21:30:31','2026-09-23 07:07:12','2026-09-30 21:30:31'),(83,15,'Document Under Review','Your 2x2 Recent ID Photo is currently under review.','general',NULL,0,NULL,'2026-10-14 22:31:00','2026-10-14 22:31:00'),(94,5,'Document Verified','Your Certificate of Residency has been verified.','general',NULL,1,'2026-10-16 05:29:57','2026-10-16 05:28:56','2026-10-16 05:29:57'),(95,5,'Document Verified','Your Certificate of Good Moral Character has been verified.','general',NULL,1,'2026-10-16 05:30:02','2026-10-16 05:29:04','2026-10-16 05:30:02'),(96,5,'Document Verified','Your 2x2 ID Picture has been verified.','general',NULL,1,'2026-10-16 05:29:50','2026-10-16 05:29:11','2026-10-16 05:29:50'),(111,5,'Scholarship application updated','Your scholarship application #11 is approved for eligibility review/examination where applicable. This is not a scholarship award. Remarks: GWA: 445\nYear Level: 2nd Year\nAnnual Household Income: Below ₱100,000\nFamily Size: 5 or more dependents\nMotivation Statement: xadssdedvbbhhhgggvvv','scholarship',NULL,1,'2026-10-19 01:22:30','2026-10-19 01:22:02','2026-10-19 01:22:30'),(112,5,'Scholarship application updated','Your scholarship application #10 is approved for eligibility review/examination where applicable. This is not a scholarship award. Remarks: GWA: 200\nYear Level: 1st Year\nAnnual Household Income: ₱100,000 – ₱250,000\nFamily Size: 5 or more dependents\nMotivation Statement: walawaiiwwiaiaiwiwiw','scholarship',NULL,1,'2026-10-19 01:31:27','2026-10-19 01:23:45','2026-10-19 01:31:27'),(113,5,'Scholarship application updated','Your scholarship application #12 is approved for eligibility review/examination where applicable. This is not a scholarship award. Remarks: GWA: 744\nYear Level: 3rd Year\nAnnual Household Income: Below ₱100,000\nFamily Size: 5 or more dependents\nMotivation Statement: 1222http://localhost:8080/storage/emulated/0/ksweb/tools/phpMyAdminNginxHosts:%20noneOFFON','scholarship',NULL,1,'2026-10-19 01:26:51','2026-10-19 01:26:34','2026-10-19 01:26:51'),(114,5,'Scholarship application updated','Your scholarship application #13 is approved for eligibility review/examination where applicable. This is not a scholarship award. Remarks: GWA: 7555\nYear Level: 3rd Year\nAnnual Household Income: Below ₱100,000\nFamily Size: 5 or more dependents\nMotivation Statement: cd C:\\Users\\oseas\\StudioProjects\\edupath_mobile','scholarship',NULL,1,'2026-10-19 01:31:22','2026-10-19 01:30:33','2026-10-19 01:31:22'),(115,5,'Admission application approved','Your admission application #19 was approved.','admission',NULL,1,'2026-10-19 01:38:22','2026-10-19 01:32:48','2026-10-19 01:38:22'),(116,5,'FHE application pending entrance-exam result','FHE review pending: a completed, officially released entrance-exam result of at least 40/100 is required before approval or awarding.','scholarship',NULL,1,'2026-10-19 16:35:33','2026-10-19 16:12:52','2026-10-19 16:35:33'),(117,23,'Admission application approved','Your admission application #20 was approved.','admission',NULL,1,'2026-10-19 22:23:40','2026-10-19 22:21:08','2026-10-19 22:23:40'),(118,23,'Scholarship application updated','Your scholarship application #14 is approved for eligibility review/examination where applicable. This is not a scholarship award. Remarks: GWA: 3.00\nYear Level: 3rd Year\nAnnual Household Income: Above ₱500,000\nFamily Size: 5 or more dependents\nMotivation Statement: uwgegegsgsuehwhehsgsbhehegsggsgshshgsyevevshyegegeyegegegeygegeyeyeggeg','scholarship',NULL,1,'2026-10-19 22:25:48','2026-10-19 22:25:29','2026-10-19 22:25:48'),(119,5,'Entrance examination results released','Official results for your scheduled entrance examination are available. Open Entrance Exams to review your result.','exam',NULL,1,'2026-10-20 00:55:12','2026-10-20 00:54:04','2026-10-20 00:55:12'),(120,12,'Entrance examination results released','Official results for your scheduled entrance examination are available. Open Entrance Exams to review your result.','exam',NULL,0,NULL,'2026-10-20 00:54:04','2026-10-20 00:54:04'),(121,13,'Entrance examination results released','Official results for your scheduled entrance examination are available. Open Entrance Exams to review your result.','exam',NULL,0,NULL,'2026-10-20 00:54:04','2026-10-20 00:54:04'),(122,15,'Entrance examination results released','Official results for your scheduled entrance examination are available. Open Entrance Exams to review your result.','exam',NULL,0,NULL,'2026-10-20 00:54:04','2026-10-20 00:54:04'),(123,16,'Entrance examination results released','Official results for your scheduled entrance examination are available. Open Entrance Exams to review your result.','exam',NULL,0,NULL,'2026-10-20 00:54:04','2026-10-20 00:54:04'),(124,5,'Scholarship application updated','Your scholarship application #10 is approved for eligibility review/examination where applicable. This is not a scholarship award. Remarks: GWA: 200\nYear Level: 1st Year\nAnnual Household Income: ₱100,000 – ₱250,000\nFamily Size: 5 or more dependents\nMotivation Statement: walawaiiwwiaiaiwiwiw\nFHE review pending: a completed, officially released entrance-exam result of at least 40/100 is required before approval or awarding.','scholarship',NULL,1,'2026-10-20 00:55:23','2026-10-20 00:54:53','2026-10-20 00:55:23'),(125,28,'Admission application approved','Your admission application #23 was approved.','admission',NULL,1,'2026-10-20 01:01:13','2026-10-20 00:59:34','2026-10-20 01:01:13'),(126,28,'Scholarship application updated','Your scholarship application #16 is approved for eligibility review/examination where applicable. This is not a scholarship award. Remarks: GWA: 1.00\nYear Level: 4th Year\nAnnual Household Income: Below ₱100,000\nFamily Size: 3–4 dependents\nMotivation Statement: it helps me to buy tanduay','scholarship',NULL,1,'2026-10-20 01:19:31','2026-10-20 01:06:18','2026-10-20 01:19:31'),(127,28,'Online scholarship examination available','You are currently eligible to start online examination attempt 1. Open Online Scholarship Examination for instructions. Eligibility is checked again when you start; examination completion is separate from the final scholarship award.','exam',NULL,1,'2026-10-20 01:10:55','2026-10-20 01:06:18','2026-10-20 01:10:55'),(128,5,'Entrance examination results released','Official results for your scheduled entrance examination are available. Open Entrance Exams to review your result.','exam',NULL,1,'2026-10-20 02:01:27','2026-10-20 01:18:44','2026-10-20 02:01:27'),(129,28,'Entrance examination results released','Official results for your scheduled entrance examination are available. Open Entrance Exams to review your result.','exam',NULL,1,'2026-10-20 01:19:04','2026-10-20 01:18:44','2026-10-20 01:19:04'),(130,28,'Scholarship application updated','Your scholarship application #17 is approved for eligibility review/examination where applicable. This is not a scholarship award. Remarks: GWA: 2.00\nYear Level: 4th Year\nAnnual Household Income: Below ₱100,000\nFamily Size: 3–4 dependents\nMotivation Statement: bshsvvsshvsnabshsvsbsusgdd','scholarship',NULL,1,'2026-10-20 01:22:34','2026-10-20 01:22:23','2026-10-20 01:22:34'),(131,5,'Online scholarship examination available','You are currently eligible to start online examination attempt 4. Open Online Scholarship Examination for instructions. Eligibility is checked again when you start; examination completion is separate from the final scholarship award.','exam',NULL,1,'2026-10-20 02:11:40','2026-10-20 02:02:49','2026-10-20 02:11:40'),(132,5,'Online examination result released','Your official result for online examination attempt #9 is available in Online Scholarship Examination. This is separate from the final scholarship decision.','exam',NULL,1,'2026-10-20 02:10:13','2026-10-20 02:10:01','2026-10-20 02:10:13'),(133,29,'Admission application approved','Your admission application #24 was approved.','admission',NULL,1,'2026-10-20 05:44:28','2026-10-20 05:41:13','2026-10-20 05:44:28'),(134,5,'Entrance examination results released','Official results for your scheduled entrance examination are available. Open Entrance Exams to review your result.','exam',NULL,0,NULL,'2026-10-20 06:18:34','2026-10-20 06:18:34'),(135,29,'Entrance examination results released','Official results for your scheduled entrance examination are available. Open Entrance Exams to review your result.','exam',NULL,1,'2026-10-20 06:19:25','2026-10-20 06:18:34','2026-10-20 06:19:25'),(136,29,'Scholarship application updated','Your scholarship application #19 is under review. Remarks: GWA: 10\nYear Level: 1st Year\nAnnual Household Income: ₱100,000 – ₱250,000\nFamily Size: 3–4 dependents\nMotivation Statement: gahmavsmsnzhamq.ahansbsbsbkzyzjsmsjsksnsn','scholarship',NULL,1,'2026-10-20 06:38:27','2026-10-20 06:37:47','2026-10-20 06:38:27'),(137,29,'Scholarship application updated','Your scholarship application #19 is approved for eligibility review/examination where applicable. This is not a scholarship award. Remarks: GWA: 10\nYear Level: 1st Year\nAnnual Household Income: ₱100,000 – ₱250,000\nFamily Size: 3–4 dependents\nMotivation Statement: gahmavsmsnzhamq.ahansbsbsbkzyzjsmsjsksnsn','scholarship',NULL,1,'2026-10-20 06:43:57','2026-10-20 06:39:49','2026-10-20 06:43:57'),(138,29,'Online scholarship examination available','You are currently eligible to start online examination attempt 1. Open Online Scholarship Examination for instructions. Eligibility is checked again when you start; examination completion is separate from the final scholarship award.','exam',NULL,1,'2026-10-20 06:43:50','2026-10-20 06:39:49','2026-10-20 06:43:50'),(139,29,'Scholarship application updated','Your scholarship application #18 is approved for eligibility review/examination where applicable. This is not a scholarship award. Remarks: GWA: 10\nYear Level: 3rd Year\nAnnual Household Income: ₱100,000 – ₱250,000\nFamily Size: 3–4 dependents\nMotivation Statement: gahmavsmsnzhamq.ahansbsbsbkzyzjsmsjsksnsn','scholarship',NULL,1,'2026-10-20 06:43:42','2026-10-20 06:41:51','2026-10-20 06:43:42');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_exam_answers`
--

DROP TABLE IF EXISTS `online_exam_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_exam_answers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `online_exam_attempt_id` bigint unsigned NOT NULL,
  `online_exam_question_id` bigint unsigned NOT NULL,
  `online_exam_option_id` bigint unsigned DEFAULT NULL,
  `answered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `online_exam_answers_attempt_question_unique` (`online_exam_attempt_id`,`online_exam_question_id`),
  KEY `online_exam_answers_online_exam_question_id_foreign` (`online_exam_question_id`),
  KEY `online_exam_answers_online_exam_option_id_foreign` (`online_exam_option_id`),
  CONSTRAINT `online_exam_answers_online_exam_attempt_id_foreign` FOREIGN KEY (`online_exam_attempt_id`) REFERENCES `online_exam_attempts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `online_exam_answers_online_exam_option_id_foreign` FOREIGN KEY (`online_exam_option_id`) REFERENCES `online_exam_options` (`id`) ON DELETE SET NULL,
  CONSTRAINT `online_exam_answers_online_exam_question_id_foreign` FOREIGN KEY (`online_exam_question_id`) REFERENCES `online_exam_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=141 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_exam_answers`
--

LOCK TABLES `online_exam_answers` WRITE;
/*!40000 ALTER TABLE `online_exam_answers` DISABLE KEYS */;
INSERT INTO `online_exam_answers` VALUES (2,5,26,103,'2026-10-17 11:54:45','2026-10-17 11:54:05','2026-10-17 11:54:45'),(3,5,73,290,'2026-10-17 11:54:57','2026-10-17 11:54:57','2026-10-17 11:54:57'),(4,5,77,306,'2026-10-17 12:55:29','2026-10-17 12:54:57','2026-10-17 12:55:29'),(5,6,1,4,'2026-10-19 01:40:14','2026-10-19 01:40:05','2026-10-19 01:40:14'),(6,6,59,235,'2026-10-19 01:42:08','2026-10-19 01:42:08','2026-10-19 01:42:08'),(7,6,68,271,'2026-10-19 01:43:08','2026-10-19 01:43:08','2026-10-19 01:43:08'),(8,7,86,341,'2026-10-19 22:29:47','2026-10-19 22:29:47','2026-10-19 22:29:47'),(9,7,72,286,'2026-10-19 22:30:06','2026-10-19 22:30:06','2026-10-19 22:30:06'),(10,7,20,78,'2026-10-19 22:30:34','2026-10-19 22:30:34','2026-10-19 22:30:34'),(11,7,54,215,'2026-10-19 22:30:55','2026-10-19 22:30:55','2026-10-19 22:30:55'),(12,7,83,330,'2026-10-19 22:31:23','2026-10-19 22:31:24','2026-10-19 22:31:24'),(13,7,37,146,'2026-10-19 22:31:45','2026-10-19 22:31:45','2026-10-19 22:31:45'),(14,7,1,4,'2026-10-19 22:32:10','2026-10-19 22:32:10','2026-10-19 22:32:10'),(15,7,88,350,'2026-10-19 22:34:34','2026-10-19 22:34:34','2026-10-19 22:34:34'),(16,7,48,191,'2026-10-19 22:34:38','2026-10-19 22:34:38','2026-10-19 22:34:38'),(17,7,34,134,'2026-10-19 22:38:33','2026-10-19 22:38:33','2026-10-19 22:38:33'),(18,7,41,162,'2026-10-19 22:56:09','2026-10-19 22:56:09','2026-10-19 22:56:09'),(19,8,83,329,'2026-10-20 01:07:11','2026-10-20 01:07:11','2026-10-20 01:07:11'),(20,8,11,42,'2026-10-20 01:07:28','2026-10-20 01:07:28','2026-10-20 01:07:28'),(21,8,1,3,'2026-10-20 01:07:48','2026-10-20 01:07:48','2026-10-20 01:07:48'),(22,8,93,370,'2026-10-20 01:08:10','2026-10-20 01:08:10','2026-10-20 01:08:10'),(23,8,47,186,'2026-10-20 01:08:29','2026-10-20 01:08:29','2026-10-20 01:08:29'),(24,8,28,110,'2026-10-20 01:09:04','2026-10-20 01:08:54','2026-10-20 01:09:04'),(25,9,39,154,'2026-10-20 02:03:29','2026-10-20 02:03:29','2026-10-20 02:03:29'),(26,9,54,213,'2026-10-20 02:03:43','2026-10-20 02:03:43','2026-10-20 02:03:43'),(27,9,65,259,'2026-10-20 02:03:54','2026-10-20 02:03:54','2026-10-20 02:03:54'),(28,9,10,39,'2026-10-20 02:04:06','2026-10-20 02:04:06','2026-10-20 02:04:06'),(29,9,14,53,'2026-10-20 02:04:11','2026-10-20 02:04:11','2026-10-20 02:04:11'),(30,9,90,359,'2026-10-20 02:04:20','2026-10-20 02:04:20','2026-10-20 02:04:20'),(31,9,38,150,'2026-10-20 02:04:23','2026-10-20 02:04:23','2026-10-20 02:04:23'),(32,9,28,112,'2026-10-20 02:04:27','2026-10-20 02:04:27','2026-10-20 02:04:27'),(33,9,37,145,'2026-10-20 02:04:31','2026-10-20 02:04:31','2026-10-20 02:04:31'),(34,9,58,230,'2026-10-20 02:04:41','2026-10-20 02:04:41','2026-10-20 02:04:41'),(35,9,25,98,'2026-10-20 02:04:46','2026-10-20 02:04:46','2026-10-20 02:04:46'),(36,9,64,255,'2026-10-20 02:04:51','2026-10-20 02:04:51','2026-10-20 02:04:51'),(37,9,36,142,'2026-10-20 02:04:55','2026-10-20 02:04:55','2026-10-20 02:04:55'),(38,9,48,191,'2026-10-20 02:04:59','2026-10-20 02:04:59','2026-10-20 02:04:59'),(39,9,76,303,'2026-10-20 02:05:07','2026-10-20 02:05:07','2026-10-20 02:05:07'),(40,9,8,32,'2026-10-20 02:05:09','2026-10-20 02:05:09','2026-10-20 02:05:09'),(41,9,89,356,'2026-10-20 02:05:11','2026-10-20 02:05:10','2026-10-20 02:05:11'),(42,9,51,204,'2026-10-20 02:05:14','2026-10-20 02:05:13','2026-10-20 02:05:14'),(43,9,4,16,'2026-10-20 02:05:16','2026-10-20 02:05:16','2026-10-20 02:05:16'),(44,9,84,336,'2026-10-20 02:05:18','2026-10-20 02:05:18','2026-10-20 02:05:18'),(45,9,86,344,'2026-10-20 02:05:20','2026-10-20 02:05:20','2026-10-20 02:05:20'),(46,9,12,47,'2026-10-20 02:05:22','2026-10-20 02:05:22','2026-10-20 02:05:22'),(47,9,57,228,'2026-10-20 02:05:24','2026-10-20 02:05:24','2026-10-20 02:05:24'),(48,9,45,180,'2026-10-20 02:05:26','2026-10-20 02:05:26','2026-10-20 02:05:26'),(49,9,31,123,'2026-10-20 02:05:28','2026-10-20 02:05:28','2026-10-20 02:05:28'),(50,9,88,352,'2026-10-20 02:05:30','2026-10-20 02:05:30','2026-10-20 02:05:30'),(51,9,100,400,'2026-10-20 02:05:34','2026-10-20 02:05:32','2026-10-20 02:05:34'),(52,9,94,375,'2026-10-20 02:05:35','2026-10-20 02:05:35','2026-10-20 02:05:35'),(53,9,7,28,'2026-10-20 02:05:36','2026-10-20 02:05:36','2026-10-20 02:05:36'),(54,9,41,164,'2026-10-20 02:05:38','2026-10-20 02:05:38','2026-10-20 02:05:38'),(55,9,47,187,'2026-10-20 02:05:39','2026-10-20 02:05:39','2026-10-20 02:05:39'),(56,9,69,276,'2026-10-20 02:05:41','2026-10-20 02:05:41','2026-10-20 02:05:41'),(57,9,19,76,'2026-10-20 02:05:42','2026-10-20 02:05:42','2026-10-20 02:05:42'),(58,9,20,80,'2026-10-20 02:05:43','2026-10-20 02:05:43','2026-10-20 02:05:43'),(59,9,23,92,'2026-10-20 02:05:46','2026-10-20 02:05:46','2026-10-20 02:05:46'),(60,9,68,271,'2026-10-20 02:05:50','2026-10-20 02:05:50','2026-10-20 02:05:50'),(61,9,33,132,'2026-10-20 02:05:51','2026-10-20 02:05:51','2026-10-20 02:05:51'),(62,9,93,372,'2026-10-20 02:05:53','2026-10-20 02:05:53','2026-10-20 02:05:53'),(63,9,95,380,'2026-10-20 02:05:56','2026-10-20 02:05:55','2026-10-20 02:05:56'),(64,9,87,348,'2026-10-20 02:05:57','2026-10-20 02:05:57','2026-10-20 02:05:57'),(65,9,52,208,'2026-10-20 02:05:59','2026-10-20 02:05:59','2026-10-20 02:05:59'),(66,9,32,128,'2026-10-20 02:06:00','2026-10-20 02:06:00','2026-10-20 02:06:00'),(67,9,18,72,'2026-10-20 02:06:02','2026-10-20 02:06:02','2026-10-20 02:06:02'),(68,9,53,212,'2026-10-20 02:06:03','2026-10-20 02:06:03','2026-10-20 02:06:03'),(69,9,11,44,'2026-10-20 02:06:04','2026-10-20 02:06:04','2026-10-20 02:06:04'),(70,9,2,8,'2026-10-20 02:06:06','2026-10-20 02:06:06','2026-10-20 02:06:06'),(71,9,67,268,'2026-10-20 02:06:07','2026-10-20 02:06:07','2026-10-20 02:06:07'),(72,9,92,368,'2026-10-20 02:06:08','2026-10-20 02:06:08','2026-10-20 02:06:08'),(73,9,50,200,'2026-10-20 02:06:09','2026-10-20 02:06:09','2026-10-20 02:06:09'),(74,9,79,316,'2026-10-20 02:06:10','2026-10-20 02:06:10','2026-10-20 02:06:10'),(75,9,34,136,'2026-10-20 02:06:12','2026-10-20 02:06:12','2026-10-20 02:06:12'),(76,9,70,279,'2026-10-20 02:06:13','2026-10-20 02:06:13','2026-10-20 02:06:13'),(77,9,35,140,'2026-10-20 02:06:16','2026-10-20 02:06:16','2026-10-20 02:06:16'),(78,9,1,4,'2026-10-20 02:06:17','2026-10-20 02:06:17','2026-10-20 02:06:17'),(79,9,85,340,'2026-10-20 02:06:19','2026-10-20 02:06:19','2026-10-20 02:06:19'),(80,9,26,104,'2026-10-20 02:06:20','2026-10-20 02:06:20','2026-10-20 02:06:20'),(81,9,30,119,'2026-10-20 02:06:23','2026-10-20 02:06:23','2026-10-20 02:06:23'),(82,9,24,95,'2026-10-20 02:06:24','2026-10-20 02:06:24','2026-10-20 02:06:24'),(83,9,60,240,'2026-10-20 02:06:26','2026-10-20 02:06:26','2026-10-20 02:06:26'),(84,9,77,307,'2026-10-20 02:06:28','2026-10-20 02:06:28','2026-10-20 02:06:28'),(85,9,56,223,'2026-10-20 02:06:30','2026-10-20 02:06:30','2026-10-20 02:06:30'),(86,9,75,299,'2026-10-20 02:06:32','2026-10-20 02:06:32','2026-10-20 02:06:32'),(87,9,81,324,'2026-10-20 02:06:33','2026-10-20 02:06:33','2026-10-20 02:06:33'),(88,9,66,263,'2026-10-20 02:06:36','2026-10-20 02:06:36','2026-10-20 02:06:36'),(89,9,71,281,'2026-10-20 02:06:44','2026-10-20 02:06:44','2026-10-20 02:06:44'),(90,9,22,86,'2026-10-20 02:06:51','2026-10-20 02:06:51','2026-10-20 02:06:51'),(91,9,91,362,'2026-10-20 02:06:56','2026-10-20 02:06:56','2026-10-20 02:06:56'),(92,9,3,11,'2026-10-20 02:07:09','2026-10-20 02:07:09','2026-10-20 02:07:09'),(93,9,62,246,'2026-10-20 02:07:12','2026-10-20 02:07:12','2026-10-20 02:07:12'),(94,9,73,290,'2026-10-20 02:07:15','2026-10-20 02:07:15','2026-10-20 02:07:15'),(95,9,13,51,'2026-10-20 02:07:18','2026-10-20 02:07:17','2026-10-20 02:07:18'),(96,9,55,219,'2026-10-20 02:07:21','2026-10-20 02:07:21','2026-10-20 02:07:21'),(97,9,97,386,'2026-10-20 02:07:23','2026-10-20 02:07:23','2026-10-20 02:07:23'),(98,9,21,83,'2026-10-20 02:07:26','2026-10-20 02:07:26','2026-10-20 02:07:26'),(99,9,16,61,'2026-10-20 02:07:29','2026-10-20 02:07:29','2026-10-20 02:07:29'),(100,9,27,105,'2026-10-20 02:07:36','2026-10-20 02:07:36','2026-10-20 02:07:36'),(101,9,74,293,'2026-10-20 02:07:41','2026-10-20 02:07:41','2026-10-20 02:07:41'),(102,9,49,194,'2026-10-20 02:07:44','2026-10-20 02:07:44','2026-10-20 02:07:44'),(103,9,59,234,'2026-10-20 02:07:47','2026-10-20 02:07:47','2026-10-20 02:07:47'),(104,9,6,23,'2026-10-20 02:07:50','2026-10-20 02:07:50','2026-10-20 02:07:50'),(105,9,46,184,'2026-10-20 02:07:53','2026-10-20 02:07:53','2026-10-20 02:07:53'),(106,9,44,175,'2026-10-20 02:07:56','2026-10-20 02:07:56','2026-10-20 02:07:56'),(107,9,83,330,'2026-10-20 02:07:59','2026-10-20 02:07:59','2026-10-20 02:07:59'),(108,9,98,390,'2026-10-20 02:08:03','2026-10-20 02:08:03','2026-10-20 02:08:03'),(109,9,80,319,'2026-10-20 02:08:06','2026-10-20 02:08:06','2026-10-20 02:08:06'),(110,9,40,159,'2026-10-20 02:08:09','2026-10-20 02:08:09','2026-10-20 02:08:09'),(111,9,63,250,'2026-10-20 02:08:11','2026-10-20 02:08:11','2026-10-20 02:08:11'),(112,9,5,17,'2026-10-20 02:08:14','2026-10-20 02:08:14','2026-10-20 02:08:14'),(113,9,9,35,'2026-10-20 02:08:17','2026-10-20 02:08:17','2026-10-20 02:08:17'),(114,9,78,310,'2026-10-20 02:08:19','2026-10-20 02:08:19','2026-10-20 02:08:19'),(115,9,61,244,'2026-10-20 02:08:22','2026-10-20 02:08:22','2026-10-20 02:08:22'),(116,9,43,169,'2026-10-20 02:08:24','2026-10-20 02:08:24','2026-10-20 02:08:24'),(117,9,17,67,'2026-10-20 02:08:27','2026-10-20 02:08:27','2026-10-20 02:08:27'),(118,9,99,394,'2026-10-20 02:08:30','2026-10-20 02:08:30','2026-10-20 02:08:30'),(119,9,29,115,'2026-10-20 02:08:33','2026-10-20 02:08:33','2026-10-20 02:08:33'),(120,9,96,382,'2026-10-20 02:08:35','2026-10-20 02:08:35','2026-10-20 02:08:35'),(121,9,72,286,'2026-10-20 02:08:38','2026-10-20 02:08:38','2026-10-20 02:08:38'),(122,9,42,167,'2026-10-20 02:08:42','2026-10-20 02:08:42','2026-10-20 02:08:42'),(123,9,15,59,'2026-10-20 02:08:52','2026-10-20 02:08:52','2026-10-20 02:08:52'),(124,9,82,326,'2026-10-20 02:08:57','2026-10-20 02:08:57','2026-10-20 02:08:57'),(125,10,82,325,'2026-10-20 06:40:16','2026-10-20 06:40:16','2026-10-20 06:40:16'),(126,10,67,265,'2026-10-20 06:40:33','2026-10-20 06:40:33','2026-10-20 06:40:33'),(127,10,20,78,'2026-10-20 06:40:46','2026-10-20 06:40:42','2026-10-20 06:40:46'),(128,10,59,235,'2026-10-20 06:40:54','2026-10-20 06:40:54','2026-10-20 06:40:54'),(129,10,6,21,'2026-10-20 06:41:02','2026-10-20 06:41:02','2026-10-20 06:41:02'),(130,10,31,123,'2026-10-20 06:41:08','2026-10-20 06:41:08','2026-10-20 06:41:08'),(131,10,63,249,'2026-10-20 06:41:14','2026-10-20 06:41:14','2026-10-20 06:41:14'),(132,10,89,356,'2026-10-20 06:41:28','2026-10-20 06:41:28','2026-10-20 06:41:28'),(133,10,29,115,'2026-10-20 06:41:36','2026-10-20 06:41:36','2026-10-20 06:41:36'),(134,10,19,74,'2026-10-20 06:41:46','2026-10-20 06:41:46','2026-10-20 06:41:46'),(135,10,46,184,'2026-10-20 06:41:57','2026-10-20 06:41:57','2026-10-20 06:41:57'),(136,10,43,169,'2026-10-20 06:42:21','2026-10-20 06:42:21','2026-10-20 06:42:21'),(137,10,70,278,'2026-10-20 06:42:35','2026-10-20 06:42:35','2026-10-20 06:42:35'),(138,10,16,61,'2026-10-20 06:42:41','2026-10-20 06:42:41','2026-10-20 06:42:41'),(139,10,47,187,'2026-10-20 06:42:50','2026-10-20 06:42:46','2026-10-20 06:42:50'),(140,10,100,397,'2026-10-20 06:43:16','2026-10-20 06:43:16','2026-10-20 06:43:16');
/*!40000 ALTER TABLE `online_exam_answers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_exam_attempt_questions`
--

DROP TABLE IF EXISTS `online_exam_attempt_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_exam_attempt_questions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `online_exam_attempt_id` bigint unsigned NOT NULL,
  `online_exam_question_id` bigint unsigned NOT NULL,
  `position` smallint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attempt_question_unique` (`online_exam_attempt_id`,`online_exam_question_id`),
  UNIQUE KEY `attempt_position_unique` (`online_exam_attempt_id`,`position`),
  KEY `online_exam_attempt_questions_online_exam_question_id_foreign` (`online_exam_question_id`),
  CONSTRAINT `online_exam_attempt_questions_online_exam_attempt_id_foreign` FOREIGN KEY (`online_exam_attempt_id`) REFERENCES `online_exam_attempts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `online_exam_attempt_questions_online_exam_question_id_foreign` FOREIGN KEY (`online_exam_question_id`) REFERENCES `online_exam_questions` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=701 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_exam_attempt_questions`
--

LOCK TABLES `online_exam_attempt_questions` WRITE;
/*!40000 ALTER TABLE `online_exam_attempt_questions` DISABLE KEYS */;
INSERT INTO `online_exam_attempt_questions` VALUES (101,5,26,1,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(102,5,73,2,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(103,5,96,3,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(104,5,48,4,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(105,5,94,5,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(106,5,72,6,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(107,5,27,7,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(108,5,98,8,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(109,5,11,9,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(110,5,45,10,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(111,5,71,11,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(112,5,1,12,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(113,5,63,13,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(114,5,5,14,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(115,5,36,15,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(116,5,70,16,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(117,5,30,17,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(118,5,8,18,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(119,5,12,19,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(120,5,32,20,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(121,5,51,21,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(122,5,69,22,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(123,5,49,23,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(124,5,24,24,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(125,5,62,25,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(126,5,68,26,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(127,5,28,27,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(128,5,22,28,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(129,5,81,29,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(130,5,91,30,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(131,5,93,31,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(132,5,37,32,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(133,5,87,33,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(134,5,44,34,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(135,5,14,35,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(136,5,47,36,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(137,5,67,37,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(138,5,85,38,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(139,5,25,39,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(140,5,92,40,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(141,5,35,41,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(142,5,95,42,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(143,5,80,43,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(144,5,16,44,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(145,5,3,45,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(146,5,41,46,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(147,5,46,47,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(148,5,4,48,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(149,5,21,49,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(150,5,75,50,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(151,5,13,51,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(152,5,57,52,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(153,5,23,53,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(154,5,60,54,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(155,5,84,55,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(156,5,17,56,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(157,5,7,57,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(158,5,33,58,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(159,5,59,59,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(160,5,56,60,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(161,5,34,61,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(162,5,77,62,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(163,5,31,63,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(164,5,10,64,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(165,5,88,65,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(166,5,18,66,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(167,5,43,67,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(168,5,100,68,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(169,5,66,69,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(170,5,20,70,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(171,5,99,71,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(172,5,78,72,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(173,5,19,73,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(174,5,89,74,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(175,5,97,75,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(176,5,9,76,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(177,5,64,77,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(178,5,42,78,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(179,5,76,79,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(180,5,86,80,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(181,5,65,81,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(182,5,40,82,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(183,5,58,83,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(184,5,83,84,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(185,5,52,85,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(186,5,15,86,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(187,5,55,87,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(188,5,53,88,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(189,5,74,89,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(190,5,82,90,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(191,5,54,91,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(192,5,39,92,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(193,5,38,93,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(194,5,90,94,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(195,5,2,95,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(196,5,50,96,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(197,5,29,97,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(198,5,79,98,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(199,5,6,99,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(200,5,61,100,'2026-10-17 11:53:46','2026-10-17 11:53:46'),(201,6,1,1,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(202,6,19,2,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(203,6,59,3,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(204,6,68,4,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(205,6,94,5,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(206,6,62,6,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(207,6,83,7,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(208,6,57,8,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(209,6,52,9,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(210,6,44,10,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(211,6,70,11,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(212,6,74,12,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(213,6,3,13,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(214,6,29,14,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(215,6,27,15,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(216,6,5,16,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(217,6,51,17,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(218,6,24,18,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(219,6,86,19,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(220,6,92,20,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(221,6,95,21,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(222,6,73,22,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(223,6,35,23,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(224,6,91,24,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(225,6,9,25,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(226,6,32,26,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(227,6,12,27,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(228,6,14,28,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(229,6,81,29,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(230,6,88,30,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(231,6,90,31,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(232,6,48,32,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(233,6,49,33,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(234,6,93,34,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(235,6,85,35,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(236,6,7,36,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(237,6,99,37,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(238,6,77,38,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(239,6,20,39,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(240,6,37,40,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(241,6,36,41,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(242,6,89,42,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(243,6,31,43,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(244,6,100,44,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(245,6,23,45,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(246,6,76,46,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(247,6,17,47,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(248,6,8,48,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(249,6,46,49,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(250,6,84,50,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(251,6,15,51,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(252,6,45,52,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(253,6,34,53,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(254,6,60,54,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(255,6,42,55,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(256,6,82,56,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(257,6,80,57,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(258,6,13,58,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(259,6,66,59,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(260,6,26,60,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(261,6,41,61,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(262,6,78,62,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(263,6,2,63,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(264,6,50,64,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(265,6,72,65,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(266,6,25,66,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(267,6,55,67,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(268,6,22,68,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(269,6,10,69,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(270,6,4,70,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(271,6,64,71,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(272,6,61,72,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(273,6,47,73,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(274,6,65,74,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(275,6,67,75,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(276,6,6,76,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(277,6,56,77,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(278,6,16,78,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(279,6,53,79,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(280,6,54,80,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(281,6,38,81,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(282,6,98,82,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(283,6,58,83,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(284,6,40,84,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(285,6,69,85,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(286,6,33,86,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(287,6,39,87,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(288,6,11,88,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(289,6,18,89,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(290,6,79,90,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(291,6,96,91,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(292,6,97,92,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(293,6,28,93,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(294,6,43,94,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(295,6,75,95,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(296,6,87,96,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(297,6,63,97,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(298,6,21,98,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(299,6,30,99,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(300,6,71,100,'2026-10-19 01:39:53','2026-10-19 01:39:53'),(301,7,86,1,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(302,7,72,2,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(303,7,20,3,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(304,7,54,4,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(305,7,83,5,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(306,7,37,6,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(307,7,1,7,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(308,7,5,8,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(309,7,76,9,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(310,7,63,10,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(311,7,12,11,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(312,7,88,12,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(313,7,48,13,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(314,7,6,14,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(315,7,24,15,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(316,7,21,16,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(317,7,57,17,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(318,7,96,18,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(319,7,79,19,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(320,7,94,20,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(321,7,91,21,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(322,7,34,22,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(323,7,75,23,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(324,7,87,24,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(325,7,35,25,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(326,7,61,26,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(327,7,11,27,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(328,7,81,28,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(329,7,99,29,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(330,7,98,30,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(331,7,7,31,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(332,7,73,32,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(333,7,2,33,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(334,7,95,34,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(335,7,84,35,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(336,7,64,36,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(337,7,8,37,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(338,7,62,38,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(339,7,52,39,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(340,7,44,40,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(341,7,56,41,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(342,7,16,42,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(343,7,14,43,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(344,7,66,44,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(345,7,53,45,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(346,7,40,46,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(347,7,51,47,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(348,7,65,48,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(349,7,93,49,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(350,7,100,50,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(351,7,36,51,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(352,7,3,52,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(353,7,23,53,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(354,7,67,54,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(355,7,49,55,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(356,7,22,56,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(357,7,38,57,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(358,7,29,58,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(359,7,60,59,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(360,7,85,60,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(361,7,43,61,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(362,7,27,62,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(363,7,47,63,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(364,7,41,64,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(365,7,74,65,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(366,7,50,66,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(367,7,18,67,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(368,7,58,68,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(369,7,10,69,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(370,7,15,70,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(371,7,31,71,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(372,7,28,72,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(373,7,46,73,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(374,7,78,74,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(375,7,68,75,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(376,7,90,76,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(377,7,13,77,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(378,7,4,78,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(379,7,9,79,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(380,7,17,80,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(381,7,80,81,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(382,7,97,82,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(383,7,77,83,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(384,7,89,84,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(385,7,69,85,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(386,7,32,86,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(387,7,92,87,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(388,7,26,88,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(389,7,25,89,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(390,7,39,90,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(391,7,70,91,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(392,7,55,92,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(393,7,30,93,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(394,7,42,94,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(395,7,33,95,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(396,7,71,96,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(397,7,59,97,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(398,7,82,98,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(399,7,45,99,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(400,7,19,100,'2026-10-19 22:29:35','2026-10-19 22:29:35'),(401,8,83,1,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(402,8,11,2,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(403,8,1,3,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(404,8,93,4,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(405,8,47,5,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(406,8,28,6,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(407,8,24,7,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(408,8,42,8,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(409,8,30,9,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(410,8,59,10,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(411,8,18,11,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(412,8,94,12,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(413,8,98,13,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(414,8,65,14,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(415,8,82,15,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(416,8,32,16,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(417,8,8,17,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(418,8,40,18,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(419,8,7,19,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(420,8,16,20,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(421,8,77,21,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(422,8,14,22,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(423,8,78,23,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(424,8,81,24,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(425,8,6,25,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(426,8,66,26,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(427,8,73,27,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(428,8,9,28,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(429,8,22,29,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(430,8,80,30,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(431,8,39,31,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(432,8,29,32,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(433,8,51,33,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(434,8,74,34,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(435,8,34,35,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(436,8,2,36,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(437,8,46,37,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(438,8,48,38,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(439,8,50,39,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(440,8,95,40,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(441,8,3,41,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(442,8,52,42,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(443,8,57,43,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(444,8,79,44,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(445,8,38,45,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(446,8,13,46,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(447,8,96,47,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(448,8,36,48,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(449,8,54,49,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(450,8,49,50,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(451,8,20,51,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(452,8,90,52,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(453,8,100,53,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(454,8,17,54,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(455,8,33,55,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(456,8,37,56,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(457,8,89,57,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(458,8,21,58,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(459,8,23,59,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(460,8,61,60,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(461,8,71,61,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(462,8,72,62,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(463,8,55,63,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(464,8,85,64,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(465,8,43,65,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(466,8,25,66,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(467,8,56,67,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(468,8,31,68,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(469,8,87,69,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(470,8,92,70,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(471,8,67,71,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(472,8,88,72,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(473,8,15,73,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(474,8,84,74,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(475,8,10,75,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(476,8,75,76,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(477,8,69,77,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(478,8,70,78,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(479,8,64,79,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(480,8,4,80,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(481,8,58,81,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(482,8,45,82,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(483,8,91,83,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(484,8,97,84,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(485,8,35,85,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(486,8,76,86,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(487,8,12,87,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(488,8,41,88,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(489,8,53,89,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(490,8,5,90,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(491,8,63,91,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(492,8,86,92,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(493,8,62,93,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(494,8,44,94,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(495,8,19,95,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(496,8,99,96,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(497,8,60,97,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(498,8,26,98,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(499,8,68,99,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(500,8,27,100,'2026-10-20 01:07:06','2026-10-20 01:07:06'),(501,9,39,1,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(502,9,54,2,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(503,9,65,3,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(504,9,10,4,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(505,9,14,5,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(506,9,90,6,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(507,9,38,7,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(508,9,28,8,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(509,9,37,9,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(510,9,58,10,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(511,9,25,11,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(512,9,64,12,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(513,9,36,13,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(514,9,48,14,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(515,9,76,15,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(516,9,8,16,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(517,9,89,17,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(518,9,51,18,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(519,9,4,19,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(520,9,84,20,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(521,9,86,21,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(522,9,12,22,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(523,9,57,23,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(524,9,45,24,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(525,9,31,25,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(526,9,88,26,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(527,9,100,27,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(528,9,94,28,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(529,9,7,29,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(530,9,41,30,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(531,9,47,31,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(532,9,69,32,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(533,9,19,33,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(534,9,20,34,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(535,9,23,35,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(536,9,68,36,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(537,9,33,37,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(538,9,93,38,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(539,9,95,39,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(540,9,87,40,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(541,9,52,41,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(542,9,32,42,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(543,9,18,43,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(544,9,53,44,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(545,9,11,45,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(546,9,2,46,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(547,9,67,47,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(548,9,92,48,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(549,9,50,49,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(550,9,79,50,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(551,9,34,51,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(552,9,70,52,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(553,9,35,53,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(554,9,1,54,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(555,9,85,55,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(556,9,26,56,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(557,9,30,57,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(558,9,24,58,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(559,9,60,59,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(560,9,77,60,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(561,9,56,61,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(562,9,75,62,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(563,9,81,63,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(564,9,66,64,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(565,9,71,65,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(566,9,22,66,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(567,9,91,67,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(568,9,3,68,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(569,9,62,69,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(570,9,73,70,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(571,9,13,71,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(572,9,55,72,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(573,9,97,73,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(574,9,21,74,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(575,9,16,75,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(576,9,27,76,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(577,9,74,77,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(578,9,49,78,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(579,9,59,79,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(580,9,6,80,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(581,9,46,81,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(582,9,44,82,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(583,9,83,83,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(584,9,98,84,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(585,9,80,85,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(586,9,40,86,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(587,9,63,87,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(588,9,5,88,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(589,9,9,89,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(590,9,78,90,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(591,9,61,91,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(592,9,43,92,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(593,9,17,93,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(594,9,99,94,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(595,9,29,95,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(596,9,96,96,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(597,9,72,97,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(598,9,42,98,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(599,9,15,99,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(600,9,82,100,'2026-10-20 02:03:12','2026-10-20 02:03:12'),(601,10,82,1,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(602,10,67,2,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(603,10,20,3,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(604,10,59,4,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(605,10,6,5,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(606,10,31,6,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(607,10,63,7,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(608,10,89,8,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(609,10,29,9,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(610,10,19,10,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(611,10,46,11,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(612,10,43,12,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(613,10,70,13,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(614,10,16,14,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(615,10,47,15,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(616,10,100,16,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(617,10,26,17,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(618,10,49,18,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(619,10,98,19,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(620,10,18,20,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(621,10,38,21,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(622,10,88,22,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(623,10,7,23,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(624,10,33,24,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(625,10,40,25,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(626,10,2,26,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(627,10,30,27,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(628,10,78,28,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(629,10,60,29,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(630,10,84,30,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(631,10,96,31,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(632,10,48,32,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(633,10,61,33,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(634,10,77,34,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(635,10,79,35,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(636,10,57,36,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(637,10,92,37,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(638,10,56,38,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(639,10,28,39,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(640,10,97,40,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(641,10,4,41,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(642,10,65,42,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(643,10,14,43,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(644,10,24,44,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(645,10,32,45,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(646,10,66,46,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(647,10,13,47,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(648,10,45,48,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(649,10,52,49,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(650,10,23,50,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(651,10,85,51,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(652,10,73,52,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(653,10,99,53,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(654,10,41,54,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(655,10,39,55,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(656,10,35,56,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(657,10,51,57,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(658,10,68,58,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(659,10,87,59,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(660,10,58,60,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(661,10,86,61,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(662,10,34,62,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(663,10,71,63,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(664,10,83,64,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(665,10,5,65,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(666,10,10,66,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(667,10,53,67,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(668,10,95,68,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(669,10,94,69,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(670,10,44,70,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(671,10,37,71,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(672,10,81,72,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(673,10,1,73,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(674,10,76,74,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(675,10,50,75,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(676,10,11,76,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(677,10,21,77,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(678,10,62,78,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(679,10,3,79,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(680,10,90,80,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(681,10,55,81,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(682,10,9,82,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(683,10,74,83,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(684,10,36,84,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(685,10,75,85,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(686,10,72,86,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(687,10,8,87,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(688,10,15,88,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(689,10,17,89,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(690,10,25,90,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(691,10,64,91,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(692,10,42,92,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(693,10,27,93,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(694,10,80,94,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(695,10,93,95,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(696,10,12,96,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(697,10,91,97,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(698,10,69,98,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(699,10,22,99,'2026-10-20 06:40:03','2026-10-20 06:40:03'),(700,10,54,100,'2026-10-20 06:40:03','2026-10-20 06:40:03');
/*!40000 ALTER TABLE `online_exam_attempt_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_exam_attempts`
--

DROP TABLE IF EXISTS `online_exam_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_exam_attempts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `applicant_id` bigint unsigned NOT NULL,
  `status` enum('in_progress','completed','expired') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_progress',
  `question_count` int NOT NULL DEFAULT '0',
  `seconds_per_question` int NOT NULL DEFAULT '60',
  `started_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `current_question_index` int NOT NULL DEFAULT '0',
  `score` decimal(5,2) DEFAULT NULL,
  `passed` tinyint(1) DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `results_released_at` timestamp NULL DEFAULT NULL,
  `results_released_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `navigation_mode` tinyint unsigned NOT NULL DEFAULT '1',
  `viewed_question_index` int unsigned NOT NULL DEFAULT '0',
  `navigation_revision` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `online_exam_attempts_applicant_id_index` (`applicant_id`),
  CONSTRAINT `online_exam_attempts_applicant_id_foreign` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_exam_attempts`
--

LOCK TABLES `online_exam_attempts` WRITE;
/*!40000 ALTER TABLE `online_exam_attempts` DISABLE KEYS */;
INSERT INTO `online_exam_attempts` VALUES (3,2,'completed',10,60,'2026-10-15 20:18:18','2026-10-15 20:28:18','2026-10-15 20:18:30',0,0.00,NULL,'Answered 0 of 10 questions correctly.','2026-10-16 05:04:39',1,'2026-10-15 20:18:18','2026-10-16 05:04:39',1,0,0),(5,2,'expired',100,60,'2026-10-17 11:53:46','2026-10-17 13:33:46','2026-10-17 22:51:20',99,1.00,0,'Answered 1 of 100 questions correctly.',NULL,NULL,'2026-10-17 11:53:46','2026-10-17 22:51:20',1,0,0),(6,2,'expired',100,60,'2026-10-19 01:39:53','2026-10-19 03:19:53','2026-10-19 17:20:13',99,1.00,0,'Answered 1 of 100 questions correctly.',NULL,NULL,'2026-10-19 01:39:53','2026-10-19 17:20:13',1,0,0),(7,16,'in_progress',100,25,'2026-10-19 22:29:35','2026-10-19 23:11:15',NULL,87,NULL,NULL,NULL,NULL,NULL,'2026-10-19 22:29:35','2026-10-19 23:06:10',1,0,0),(8,18,'in_progress',100,20,'2026-10-20 01:07:06','2026-10-20 01:40:26',NULL,15,NULL,NULL,NULL,NULL,NULL,'2026-10-20 01:07:06','2026-10-20 01:12:09',1,0,0),(9,2,'completed',100,20,'2026-10-20 02:03:12','2026-10-20 02:36:32','2026-10-20 02:09:06',99,27.00,0,'Answered 27 of 100 questions correctly.','2026-10-20 02:10:01',1,'2026-10-20 02:03:12','2026-10-20 02:10:01',2,99,101),(10,19,'in_progress',100,16,'2026-10-20 06:40:03','2026-10-20 07:06:43',NULL,16,NULL,NULL,NULL,NULL,NULL,'2026-10-20 06:40:03','2026-10-20 06:43:17',2,16,16);
/*!40000 ALTER TABLE `online_exam_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_exam_availability_notices`
--

DROP TABLE IF EXISTS `online_exam_availability_notices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_exam_availability_notices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `applicant_id` bigint unsigned NOT NULL,
  `attempt_number` int unsigned NOT NULL,
  `notification_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_availability_applicant_attempt_unique` (`applicant_id`,`attempt_number`),
  KEY `online_exam_availability_notices_notification_id_foreign` (`notification_id`),
  CONSTRAINT `online_exam_availability_notices_applicant_id_foreign` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `online_exam_availability_notices_notification_id_foreign` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_exam_availability_notices`
--

LOCK TABLES `online_exam_availability_notices` WRITE;
/*!40000 ALTER TABLE `online_exam_availability_notices` DISABLE KEYS */;
INSERT INTO `online_exam_availability_notices` VALUES (1,18,1,127,'2026-10-20 01:06:18','2026-10-20 01:06:18'),(2,2,4,131,'2026-10-20 02:02:49','2026-10-20 02:02:49'),(3,19,1,138,'2026-10-20 06:39:50','2026-10-20 06:39:50');
/*!40000 ALTER TABLE `online_exam_availability_notices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_exam_options`
--

DROP TABLE IF EXISTS `online_exam_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_exam_options` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `online_exam_question_id` bigint unsigned NOT NULL,
  `text` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT '0',
  `position` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `online_exam_options_online_exam_question_id_foreign` (`online_exam_question_id`),
  CONSTRAINT `online_exam_options_online_exam_question_id_foreign` FOREIGN KEY (`online_exam_question_id`) REFERENCES `online_exam_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=401 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_exam_options`
--

LOCK TABLES `online_exam_options` WRITE;
/*!40000 ALTER TABLE `online_exam_options` DISABLE KEYS */;
INSERT INTO `online_exam_options` VALUES (1,1,'Scarce',0,0,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(2,1,'Plentiful',1,1,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(3,1,'Hidden',0,2,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(4,1,'Fragile',0,3,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(5,2,'100 minutes',0,0,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(6,2,'3 minutes',1,1,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(7,2,'1 minute',0,2,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(8,2,'33 minutes',0,3,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(9,3,'24',0,0,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(10,3,'30',0,1,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(11,3,'32',1,2,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(12,3,'36',0,3,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(13,4,'80',0,0,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(14,4,'82.5',0,1,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(15,4,'85',1,2,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(16,4,'87',0,3,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(17,5,'Green',0,0,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(18,5,'Orange',0,1,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(19,5,'Blue',1,2,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(20,5,'Purple',0,3,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(21,6,'Drawing',0,0,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(22,6,'Writing',0,1,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(23,6,'Eating',1,2,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(24,6,'Stirring',0,3,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(25,7,'Venus',0,0,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(26,7,'Mars',1,1,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(27,7,'Jupiter',0,2,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(28,7,'Mercury',0,3,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(29,8,'15',0,0,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(30,8,'25',0,1,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(31,8,'30',1,2,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(32,8,'35',0,3,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(33,9,'Occurence',0,0,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(34,9,'Occurrence',1,1,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(35,9,'Ocurrence',0,2,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(36,9,'Occurrance',0,3,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(37,10,'All roses fade quickly',0,0,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(38,10,'Some roses fade quickly',0,1,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(39,10,'No roses fade quickly',0,2,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(40,10,'Nothing can be concluded about roses',1,3,'2026-10-15 17:47:29','2026-10-15 17:47:29'),(41,11,'Cruel',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(42,11,'Kind',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(43,11,'Careless',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(44,11,'Proud',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(45,12,'Rare',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(46,12,'Limited',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(47,12,'Abundant',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(48,12,'Small',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(49,13,'She go to school daily.',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(50,13,'She goes to school daily.',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(51,13,'She going to school daily.',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(52,13,'She gone to school daily.',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(53,14,'Criterions',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(54,14,'Criteria',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(55,14,'Criterias',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(56,14,'Criterion',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(57,15,'Neccessary',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(58,15,'Necesary',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(59,15,'Necessary',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(60,15,'Necassary',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(61,16,'Explained',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(62,16,'The',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(63,16,'Teacher',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(64,16,'Lesson quickly',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(65,17,'Increase',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(66,17,'Enlarge',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(67,17,'Contract',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(68,17,'Extend',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(69,18,'Was',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(70,18,'Were',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(71,18,'Is',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(72,18,'Be',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(73,19,'Beautiful',1,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(74,19,'Beauty',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(75,19,'Beautify',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(76,19,'Beautifully',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(77,20,'Teached',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(78,20,'Taught',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(79,20,'Teaching',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(80,20,'Teaches',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(81,21,'Unwilling',1,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(82,21,'Excited',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(83,21,'Certain',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(84,21,'Careless',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(85,22,'Where are you going.',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(86,22,'Where are you going?',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(87,22,'Where are you going,',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(88,22,'Where are you going!',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(89,23,'Have',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(90,23,'Had',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(91,23,'Has',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(92,23,'Having',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(93,24,'Slow',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(94,24,'Swift',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(95,24,'Weak',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(96,24,'Late',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(97,25,'Athlete',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(98,25,'Ran',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(99,25,'Quickly',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(100,25,'The',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(101,26,'Our',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(102,26,'Ours',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(103,26,'We',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(104,26,'Us',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(105,27,'Introduce the paragraph main idea',1,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(106,27,'List every source',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(107,27,'End an essay',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(108,27,'Provide a title only',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(109,28,'Although',1,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(110,28,'Bright',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(111,28,'Carefully',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(112,28,'Table',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(113,29,'15',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(114,29,'20',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(115,29,'30',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(116,29,'45',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(117,30,'3',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(118,30,'5',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(119,30,'7',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(120,30,'10',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(121,31,'10',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(122,31,'11',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(123,31,'12',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(124,31,'14',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(125,32,'1/2',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(126,32,'1',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(127,32,'4/8',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(128,32,'3/8',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(129,33,'₱200',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(130,33,'₱250',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(131,33,'₱300',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(132,33,'₱350',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(133,34,'13 cm²',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(134,34,'26 cm²',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(135,34,'40 cm²',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(136,34,'80 cm²',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(137,35,'8',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(138,35,'12',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(139,35,'16',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(140,35,'24',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(141,36,'8',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(142,36,'9',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(143,36,'10',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(144,36,'11',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(145,37,'1/4',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(146,37,'2/3',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(147,37,'3/4',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(148,37,'4/5',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(149,38,'₱20',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(150,38,'₱25',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(151,38,'₱30',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(152,38,'₱35',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(153,39,'14 cm',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(154,39,'21 cm',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(155,39,'28 cm',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(156,39,'49 cm',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(157,40,'2',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(158,40,'5',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(159,40,'8',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(160,40,'13',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(161,41,'20',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(162,41,'40',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(163,41,'60',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(164,41,'80',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(165,42,'25 m',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(166,42,'250 m',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(167,42,'2,500 m',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(168,42,'25,000 m',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(169,43,'2/5',1,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(170,43,'3/5',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(171,43,'1/2',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(172,43,'2/3',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(173,44,'108',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(174,44,'144',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(175,44,'162',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(176,44,'216',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(177,45,'30 km/h',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(178,45,'40 km/h',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(179,45,'60 km/h',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(180,45,'90 km/h',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(181,46,'90°',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(182,46,'180°',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(183,46,'270°',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(184,46,'360°',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(185,47,'Lungs',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(186,47,'Liver',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(187,47,'Heart',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(188,47,'Kidneys',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(189,48,'Oxygen',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(190,48,'Carbon dioxide',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(191,48,'Nitrogen',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(192,48,'Hydrogen',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(193,49,'CO₂',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(194,49,'O₂',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(195,49,'H₂O',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(196,49,'NaCl',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(197,50,'Venus',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(198,50,'Mars',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(199,50,'Jupiter',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(200,50,'Mercury',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(201,51,'Friction',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(202,51,'Magnetism',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(203,51,'Gravity',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(204,51,'Electricity',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(205,52,'0°C',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(206,52,'50°C',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(207,52,'100°C',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(208,52,'150°C',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(209,53,'Flower',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(210,53,'Leaf',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(211,53,'Root',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(212,53,'Fruit',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(213,54,'Solid',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(214,54,'Liquid',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(215,54,'Gas',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(216,54,'Plasma',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(217,55,'Atom',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(218,55,'Tissue',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(219,55,'Cell',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(220,55,'Organ',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(221,56,'Vitamin A',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(222,56,'Vitamin B12',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(223,56,'Vitamin C',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(224,56,'Vitamin D',1,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(225,57,'Red blood cells',1,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(226,57,'White blood cells',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(227,57,'Platelets',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(228,57,'Plasma cells',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(229,58,'Sirius',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(230,58,'The Sun',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(231,58,'Polaris',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(232,58,'Alpha Centauri A',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(233,59,'Condensation',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(234,59,'Freezing',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(235,59,'Evaporation',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(236,59,'Deposition',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(237,60,'Heart',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(238,60,'Kidney',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(239,60,'Stomach',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(240,60,'Pancreas',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(241,61,'Rubber',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(242,61,'Glass',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(243,61,'Copper',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(244,61,'Dry wood',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(245,62,'300 km/s',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(246,62,'3,000 km/s',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(247,62,'30,000 km/s',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(248,62,'300,000 km/s',1,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(249,63,'Oxygen',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(250,63,'Nitrogen',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(251,63,'Carbon dioxide',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(252,63,'Argon',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(253,64,'Absorb light energy',1,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(254,64,'Absorb minerals directly',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(255,64,'Transport seeds',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(256,64,'Produce roots',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(257,65,'22',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(258,65,'24',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(259,65,'25',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(260,65,'30',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(261,66,'Apple',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(262,66,'Mango',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(263,66,'Carrot',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(264,66,'Banana',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(265,67,'All roses fade quickly.',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(266,67,'No roses fade quickly.',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(267,67,'All roses are flowers.',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(268,67,'All flowers are roses.',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(269,68,'EPH',1,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(270,68,'CNG',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(271,68,'EOG',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(272,68,'FPI',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(273,69,'Maria',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(274,69,'Ana',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(275,69,'Beth',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(276,69,'Cannot be determined',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(277,70,'20',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(278,70,'24',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(279,70,'25',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(280,70,'36',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(281,71,'Wednesday',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(282,71,'Thursday',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(283,71,'Friday',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(284,71,'Saturday',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(285,72,'Bee : hive',1,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(286,72,'Fish : water',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(287,72,'Dog : bone',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(288,72,'Cow : grass',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(289,73,'45°',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(290,73,'60°',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(291,73,'90°',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(292,73,'180°',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(293,74,'H',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(294,74,'I',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(295,74,'J',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(296,74,'K',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(297,75,'10',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(298,75,'18',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(299,75,'24',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(300,75,'30',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(301,76,'2',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(302,76,'3',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(303,76,'9',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(304,76,'11',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(305,77,'All students are athletes.',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(306,77,'Some students exercise.',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(307,77,'No students exercise.',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(308,77,'All who exercise are athletes.',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(309,78,'50',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(310,78,'55',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(311,78,'60',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(312,78,'65',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(313,79,'USFF',1,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(314,79,'UQDD',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(315,79,'SQDD',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(316,79,'USFE',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(317,80,'A',1,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(318,80,'B',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(319,80,'C',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(320,80,'Cannot be determined',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(321,81,'Square',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(322,81,'Triangle',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(323,81,'Pentagon',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(324,81,'Hexagon',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(325,82,'36',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(326,82,'42',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(327,82,'48',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(328,82,'60',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(329,83,'Cebu City',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(330,83,'Davao City',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(331,83,'Manila',1,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(332,83,'Baguio City',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(333,84,'English',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(334,84,'Filipino',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(335,84,'Spanish',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(336,84,'Cebuano',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(337,85,'365',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(338,85,'366',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(339,85,'364',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(340,85,'367',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(341,86,'Atlantic Ocean',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(342,86,'Indian Ocean',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(343,86,'Arctic Ocean',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(344,86,'Pacific Ocean',1,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(345,87,'Proceed',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(346,87,'Stop',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(347,87,'Speed up',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(348,87,'Turn anywhere',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(349,88,'Constitution',1,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(350,88,'Dictionary',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(351,88,'Invoice',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(352,88,'Timetable',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(353,89,'WHO',1,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(354,89,'WTO',0,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(355,89,'FIFA',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(356,89,'UNESCO',0,4,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(357,90,'Increase waste',0,1,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(358,90,'Reuse materials and reduce waste',1,2,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(359,90,'Consume more resources',0,3,'2026-10-16 05:16:29','2026-10-16 05:16:29'),(360,90,'Eliminate all manufacturing',0,4,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(361,91,'Coal',0,1,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(362,91,'Diesel',0,2,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(363,91,'Solar energy',1,3,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(364,91,'Natural gas',0,4,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(365,92,'Show the map symbols and their meanings',1,1,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(366,92,'Give the map a title only',0,2,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(367,92,'Measure rainfall',0,3,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(368,92,'List population totals only',0,4,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(369,93,'Executive',0,1,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(370,93,'Legislative',0,2,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(371,93,'Judicial',1,3,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(372,93,'Electoral',0,4,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(373,94,'Reuse one password everywhere',0,1,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(374,94,'Share passwords with friends',0,2,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(375,94,'Use a strong unique password and multifactor authentication',1,3,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(376,94,'Disable all security updates',0,4,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(377,95,'Liter',0,1,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(378,95,'Byte',1,2,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(379,95,'Meter',0,3,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(380,95,'Watt',0,4,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(381,96,'List sources used',1,1,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(382,96,'Present the title only',0,2,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(383,96,'Replace the introduction',0,3,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(384,96,'Summarize every paragraph',0,4,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(385,97,'Leaving taps running',0,1,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(386,97,'Repairing leaking faucets',1,2,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(387,97,'Washing sidewalks daily with a hose',0,3,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(388,97,'Taking unnecessarily long showers',0,4,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(389,98,'Share it immediately',0,1,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(390,98,'Check credible sources and supporting evidence',1,2,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(391,98,'Trust the headline alone',0,3,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(392,98,'Ignore the publication date',0,4,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(393,99,'A later textbook summary',0,1,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(394,99,'A fictional novel',0,2,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(395,99,'A diary written by an eyewitness at the time',1,3,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(396,99,'An unsourced social media post',0,4,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(397,100,'Direct people toward a safe exit',1,1,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(398,100,'Store classroom supplies',0,2,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(399,100,'Identify examination scores',0,3,'2026-10-16 05:16:30','2026-10-16 05:16:30'),(400,100,'Control internet access',0,4,'2026-10-16 05:16:30','2026-10-16 05:16:30');
/*!40000 ALTER TABLE `online_exam_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_exam_questions`
--

DROP TABLE IF EXISTS `online_exam_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_exam_questions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `source` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_exam_questions`
--

LOCK TABLES `online_exam_questions` WRITE;
/*!40000 ALTER TABLE `online_exam_questions` DISABLE KEYS */;
INSERT INTO `online_exam_questions` VALUES (1,'Choose the word most similar in meaning to \"abundant\".',1,'sample','2026-10-15 17:47:29','2026-10-15 17:47:29'),(2,'If 3 machines make 3 toys in 3 minutes, how long do 100 machines take to make 100 toys?',1,'sample','2026-10-15 17:47:29','2026-10-19 21:51:02'),(3,'Which number comes next: 2, 4, 8, 16, ...?',1,'sample','2026-10-15 17:47:29','2026-10-15 17:47:29'),(4,'A student scores 75, 80 and 90 in three tests. What is the average?',1,'sample','2026-10-15 17:47:29','2026-10-15 17:47:29'),(5,'Which of these is a primary color?',1,'sample','2026-10-15 17:47:29','2026-10-15 17:47:29'),(6,'Complete the analogy: Book is to Reading as Fork is to ___',1,'sample','2026-10-15 17:47:29','2026-10-15 17:47:29'),(7,'Which planet is known as the Red Planet?',1,'sample','2026-10-15 17:47:29','2026-10-15 17:47:29'),(8,'What is 15% of 200?',1,'sample','2026-10-15 17:47:29','2026-10-15 17:47:29'),(9,'Choose the correctly spelled word.',1,'sample','2026-10-15 17:47:29','2026-10-15 17:47:29'),(10,'If all roses are flowers and some flowers fade quickly, then:',1,'sample','2026-10-15 17:47:29','2026-10-15 17:47:29'),(11,'Choose the word closest in meaning to \"benevolent\".',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(12,'Choose the opposite of \"scarce\".',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(13,'Which sentence is grammatically correct?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(14,'What is the plural of \"criterion\"?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(15,'Choose the correctly spelled word.',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(16,'Identify the noun in: \"The teacher explained the lesson.\"',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(17,'Choose the opposite of \"expand\".',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(18,'Complete the sentence: Neither John nor his friends ___ present.',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(19,'Which word is an adjective?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(20,'Choose the correct past tense of \"teach\".',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(21,'What does \"reluctant\" mean?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(22,'Choose the correctly punctuated sentence.',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(23,'Complete: If I ___ enough money, I would buy a laptop.',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(24,'Which is a synonym for \"rapid\"?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(25,'Identify the adverb: \"The athlete ran quickly.\"',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(26,'Choose the correct word: Their house is larger than ___.',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(27,'What is the main purpose of a topic sentence?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(28,'Which word is a conjunction?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(29,'What is 15% of 200?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(30,'Solve: 3x + 5 = 20.',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(31,'What is the square root of 144?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(32,'Simplify: 3/4 + 1/4.',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(33,'A book costs ₱250 after a ₱50 discount. What was its original price?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(34,'What is the area of a rectangle 8 cm long and 5 cm wide?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(35,'Evaluate: 2⁴.',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(36,'What is the average of 6, 8, 10, and 12?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(37,'Express 0.75 as a fraction in simplest form.',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(38,'If 5 notebooks cost ₱150, what is the cost of one notebook?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(39,'What is the perimeter of a square with sides of 7 cm?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(40,'Solve: 2(x - 3) = 10.',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(41,'What is 3/5 of 100?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(42,'Convert 2.5 kilometers to meters.',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(43,'A class has 12 boys and 18 girls. What fraction of the class are boys?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(44,'What is the next number: 2, 6, 18, 54, ___?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(45,'A vehicle travels 120 km in 3 hours. What is its average speed?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(46,'What is the sum of the interior angles of a triangle?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(47,'Which organ pumps blood throughout the human body?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(48,'Which gas do plants absorb during photosynthesis?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(49,'What is the chemical formula for water?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(50,'Which planet is known as the Red Planet?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(51,'What force pulls objects toward Earth?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(52,'At standard atmospheric pressure, water boils at what temperature?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(53,'Which part of a plant mainly absorbs water from soil?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(54,'Which state of matter has a definite volume but no definite shape?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(55,'What is the basic unit of life?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(56,'Which vitamin can the human body produce with sufficient sunlight exposure?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(57,'Which blood cells primarily transport oxygen?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(58,'What is the closest star to Earth?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(59,'Which process changes liquid water into water vapor?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(60,'Which organ is primarily responsible for filtering waste from blood to form urine?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(61,'Which material is generally a good conductor of electricity?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(62,'What is the approximate speed of light in a vacuum?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(63,'Which gas makes up the largest proportion of Earth’s atmosphere?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(64,'What is the function of chlorophyll in plants?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(65,'What comes next: 5, 10, 15, 20, ___?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(66,'Which item does not belong?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(67,'All roses are flowers. Some flowers fade quickly. Which conclusion must be true?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(68,'If CAT is coded as DBU by shifting each letter one position forward, how is DOG coded?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(69,'Maria is taller than Ana. Ana is taller than Beth. Who is the shortest?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(70,'Find the missing number: 1, 4, 9, 16, ___?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(71,'If today is Monday, what day will it be 10 days from today?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(72,'Which pair has the same relationship as bird : nest?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(73,'A clock shows 3:00. What is the angle between its hour and minute hands?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(74,'Find the next letter: A, C, E, G, ___?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(75,'If 4 workers complete a task in 6 days at the same rate, how many worker-days does the task require?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(76,'Which number does not belong: 2, 3, 5, 9, 11?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(77,'Some students are athletes. All athletes exercise. Which statement must be true?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(78,'Complete the pattern: 100, 90, 80, 70, ___?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(79,'If BOOK is written as CPPL by shifting each letter forward one position, how is TREE written?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(80,'A is older than B, and B is older than C. Who is the oldest?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(81,'Which shape has exactly three sides?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(82,'Find the missing number: 3, 6, 12, 24, ___?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(83,'What is the capital city of the Philippines?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(84,'What is the national language specified in the Philippine Constitution?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(85,'How many days are there in a leap year?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(86,'Which ocean lies east of the Philippines?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(87,'What does a red traffic light generally mean?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(88,'Which document establishes the fundamental laws and principles of a country?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(89,'Which organization is primarily responsible for international public health coordination?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(90,'What is the main purpose of recycling?',1,'practice_bank','2026-10-16 05:16:29','2026-10-16 05:16:29'),(91,'Which is a renewable energy source?',1,'practice_bank','2026-10-16 05:16:30','2026-10-16 05:16:30'),(92,'What is the primary purpose of a map legend?',1,'practice_bank','2026-10-16 05:16:30','2026-10-16 05:16:30'),(93,'Which branch of government generally interprets laws?',1,'practice_bank','2026-10-16 05:16:30','2026-10-16 05:16:30'),(94,'Which practice best protects an online account?',1,'practice_bank','2026-10-16 05:16:30','2026-10-16 05:16:30'),(95,'Which unit is commonly used to measure computer file size?',1,'practice_bank','2026-10-16 05:16:30','2026-10-16 05:16:30'),(96,'What is the main purpose of a bibliography?',1,'practice_bank','2026-10-16 05:16:30','2026-10-16 05:16:30'),(97,'Which activity helps conserve water?',1,'practice_bank','2026-10-16 05:16:30','2026-10-16 05:16:30'),(98,'What should you do first when evaluating an online news claim?',1,'practice_bank','2026-10-16 05:16:30','2026-10-16 05:16:30'),(99,'Which of these is a primary source for a historical event?',1,'practice_bank','2026-10-16 05:16:30','2026-10-16 05:16:30'),(100,'What is the main purpose of an emergency evacuation route?',1,'practice_bank','2026-10-16 05:16:30','2026-10-16 05:16:30');
/*!40000 ALTER TABLE `online_exam_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_exam_retake_grants`
--

DROP TABLE IF EXISTS `online_exam_retake_grants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_exam_retake_grants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `applicant_id` bigint unsigned NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `granted_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `online_exam_retake_grants_applicant_id_foreign` (`applicant_id`),
  CONSTRAINT `online_exam_retake_grants_applicant_id_foreign` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_exam_retake_grants`
--

LOCK TABLES `online_exam_retake_grants` WRITE;
/*!40000 ALTER TABLE `online_exam_retake_grants` DISABLE KEYS */;
INSERT INTO `online_exam_retake_grants` VALUES (2,2,'sasasass',1,'2026-10-16 05:21:10','2026-10-16 05:21:10'),(3,2,'ssasasasasasassasasas',1,'2026-10-19 01:39:36','2026-10-19 01:39:36'),(4,2,'sasassassasasasasasasa',1,'2026-10-20 02:02:49','2026-10-20 02:02:49');
/*!40000 ALTER TABLE `online_exam_retake_grants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_exam_reviews`
--

DROP TABLE IF EXISTS `online_exam_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_exam_reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `online_exam_attempt_id` bigint unsigned NOT NULL,
  `reviewed_by` bigint unsigned DEFAULT NULL,
  `recommendation` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `online_exam_reviews_online_exam_attempt_id_reviewed_by_unique` (`online_exam_attempt_id`,`reviewed_by`),
  KEY `online_exam_reviews_reviewed_by_foreign` (`reviewed_by`),
  CONSTRAINT `online_exam_reviews_online_exam_attempt_id_foreign` FOREIGN KEY (`online_exam_attempt_id`) REFERENCES `online_exam_attempts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `online_exam_reviews_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_exam_reviews`
--

LOCK TABLES `online_exam_reviews` WRITE;
/*!40000 ALTER TABLE `online_exam_reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `online_exam_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `online_exam_settings`
--

DROP TABLE IF EXISTS `online_exam_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `online_exam_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `seconds_per_question` int unsigned NOT NULL DEFAULT '60',
  `updated_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `online_exam_settings_updated_by_foreign` (`updated_by`),
  CONSTRAINT `online_exam_settings_updated_by_foreign` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `online_exam_settings`
--

LOCK TABLES `online_exam_settings` WRITE;
/*!40000 ALTER TABLE `online_exam_settings` DISABLE KEYS */;
INSERT INTO `online_exam_settings` VALUES (1,16,1,'2026-10-19 01:44:14','2026-10-20 06:38:50');
/*!40000 ALTER TABLE `online_exam_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_otps`
--

DROP TABLE IF EXISTS `password_reset_otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_otps` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `attempts` tinyint unsigned NOT NULL DEFAULT '0',
  `verified_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `reset_token_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `password_reset_otps_user_id_foreign` (`user_id`),
  KEY `password_reset_otps_email_user_id_index` (`email`,`user_id`),
  CONSTRAINT `password_reset_otps_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_otps`
--

LOCK TABLES `password_reset_otps` WRITE;
/*!40000 ALTER TABLE `password_reset_otps` DISABLE KEYS */;
INSERT INTO `password_reset_otps` VALUES (5,4,'jhayde@gmail.com','$2y$12$auLtMA3OsGGm8GSic3yDR.WNlXL/xrClIbU1D916MNj29fzaGoLtO','2026-09-21 02:50:42',0,NULL,'2026-09-21 02:40:42','2026-09-21 02:40:42',NULL),(8,6,'arcc@gmail.com','$2y$12$uHBPnsHM7GlD.j9EPp0J0unjDRkLf5LESaidXJF9N.Pv8TVbACc6C','2026-09-21 03:12:35',0,NULL,'2026-09-21 03:02:35','2026-09-21 03:02:35',NULL),(13,1,'adminko202006@gmail.com','$2y$12$uAeF/poGU0eSpXd31epMQO7h2NDqMV4r5Hv6/.woTghbvfNzKlBWm','2026-09-21 15:59:15',0,'2026-09-21 15:49:36','2026-09-21 15:49:15','2026-09-21 15:49:36',NULL),(37,5,'archiecorre19@gmail.com','$2y$12$LHSFWt2PU7S24D6oQfVEx.F/I.az5tcMpcmXJOnufSK1VuP6X22Tq','2026-10-19 03:25:25',0,NULL,'2026-10-19 03:15:25','2026-10-19 03:15:25',NULL);
/*!40000 ALTER TABLE `password_reset_otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `personal_access_tokens`
--

DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=387 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personal_access_tokens`
--

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
INSERT INTO `personal_access_tokens` VALUES (1,'App\\Models\\User',1,'edupath-token','faac9cdcb599f7b9a731a415422e93279f89b1833354d14847707b425f4a98f8','[\"*\"]',NULL,NULL,'2026-09-21 02:25:41','2026-09-21 02:25:41'),(4,'App\\Models\\User',1,'edupath-token','b267f5d3a91045fb001ef670a045e9844942c49b569d9a0b9e188a3f383c7e23','[\"*\"]',NULL,NULL,'2026-09-21 02:29:43','2026-09-21 02:29:43'),(7,'App\\Models\\User',4,'edupath-token','13b0fdbb922219e130faa5df4bd94ee2907d47c9d19fef6d3c1550ee8a4e84f5','[\"*\"]',NULL,NULL,'2026-09-21 02:35:38','2026-09-21 02:35:38'),(10,'App\\Models\\User',5,'edupath-token','65ee3ed49dd7fe1b075ef6f06f980df14949cc9691ddffb2da1b7a14b539ee73','[\"*\"]',NULL,NULL,'2026-09-21 02:47:43','2026-09-21 02:47:43'),(12,'App\\Models\\User',6,'edupath-token','a0ff668127a0d0c21511241f95610b2b550c68abd068c7e12a25b90715b22227','[\"*\"]','2026-09-21 05:43:04',NULL,'2026-09-21 03:02:21','2026-09-21 05:43:04'),(14,'App\\Models\\User',1,'edupath-token','96460525f196a339c99c844ef69cb39c6f9ae90f515864d48da8a7bfb26e7a15','[\"*\"]',NULL,NULL,'2026-09-21 07:43:38','2026-09-21 07:43:38'),(16,'App\\Models\\User',1,'edupath-token','d02ab5d75dc3ed0bf535bcf83505bfec3263460055714675bdfd65ce98001210','[\"*\"]',NULL,NULL,'2026-09-21 07:53:34','2026-09-21 07:53:34'),(18,'App\\Models\\User',5,'edupath-token','f2aab9bd88c31eb305e5c7a63593f79b155e2ca853032715c5a801847a381b75','[\"*\"]',NULL,NULL,'2026-09-21 08:19:27','2026-09-21 08:19:27'),(19,'App\\Models\\User',5,'edupath-token','07cf5fff70161ece53e34d85c036d0718174681b1acb3a319634205d027d16c0','[\"*\"]',NULL,NULL,'2026-09-21 08:27:55','2026-09-21 08:27:55'),(25,'App\\Models\\User',5,'edupath-token','d54fc4a22fa5bc31519a6c52275715c60af0c00117b703f4cfba0ed9065fc6f6','[\"*\"]',NULL,NULL,'2026-09-21 15:31:00','2026-09-21 15:31:00'),(31,'App\\Models\\User',3,'edupath-token','58e95b0a5f506165c017be6a414cf0350bcc823e792016f40127b5ee26aa13f2','[\"*\"]','2026-09-21 15:36:20',NULL,'2026-09-21 15:36:13','2026-09-21 15:36:20'),(32,'App\\Models\\User',3,'edupath-token','47584fdf9112d536d9e706bf5b070b8bdc1a3979b7a238ada00b3806693a8342','[\"*\"]',NULL,NULL,'2026-09-21 15:38:43','2026-09-21 15:38:43'),(34,'App\\Models\\User',5,'edupath-token','60607b09fdc65b7a53896ed572099bcef48597a96fbed9061d2af60b004fb7d2','[\"*\"]',NULL,NULL,'2026-09-21 15:41:28','2026-09-21 15:41:28'),(38,'App\\Models\\User',1,'edupath-token','5282b846757e0ecba56308f88e665a38b73e2313024e6c64d64bb49a6ea60a55','[\"*\"]',NULL,NULL,'2026-09-21 15:44:47','2026-09-21 15:44:47'),(40,'App\\Models\\User',3,'edupath-token','f6f4e8cd2fc5fbfed5f40991f63582a96550e99d205d765e7af8402b5bf365ad','[\"*\"]',NULL,NULL,'2026-09-21 15:47:50','2026-09-21 15:47:50'),(41,'App\\Models\\User',3,'edupath-token','7929992fdb8bda369ad8cfff1cdbb6a3ceab368aa452ac60eac8f40f193dde65','[\"*\"]','2026-09-21 15:51:32',NULL,'2026-09-21 15:50:33','2026-09-21 15:51:32'),(43,'App\\Models\\User',8,'edupath-token','0cf5e449529355f1ad09ed640fe95bb21e59a99d56b6582c0242a387ab0a4309','[\"*\"]',NULL,NULL,'2026-09-21 15:55:23','2026-09-21 15:55:23'),(46,'App\\Models\\User',8,'edupath-token','06caf4c4b281c0ddd256044a45bdf249063e63599c8cf525c1ccf0c62f352ae9','[\"*\"]','2026-09-21 15:58:57',NULL,'2026-09-21 15:57:45','2026-09-21 15:58:57'),(47,'App\\Models\\User',8,'edupath-token','ab04d28c0742fbcceb83325bc80404f74673e0afee539e5ee2af6523a8b50329','[\"*\"]',NULL,NULL,'2026-09-21 15:59:14','2026-09-21 15:59:14'),(50,'App\\Models\\User',9,'edupath-token','0c86579acdf335998d716aeeddedce39d6d4043204ca5bf9bb71faa944061ef8','[\"*\"]',NULL,NULL,'2026-09-21 16:08:51','2026-09-21 16:08:51'),(51,'App\\Models\\User',9,'edupath-token','b1018a672bb3e8edb10e66bf677ac48177ccc2b4259e36fad98903e95426fbdf','[\"*\"]',NULL,NULL,'2026-09-21 16:10:01','2026-09-21 16:10:01'),(53,'App\\Models\\User',3,'edupath-token','e36162c83ed815e6a83a82fb941e7a7569f69b4b9ee874b4e346bb97cbcfea7d','[\"*\"]','2026-09-21 16:10:45',NULL,'2026-09-21 16:10:43','2026-09-21 16:10:45'),(54,'App\\Models\\User',3,'edupath-token','3a781139cd3232ae20fb412d6fbbc0d3215c9d0c8df3ec5fbff28d1201bc9369','[\"*\"]','2026-09-21 16:11:05',NULL,'2026-09-21 16:10:52','2026-09-21 16:11:05'),(55,'App\\Models\\User',3,'edupath-token','2c3d8ea81716569740986b9309d56b3b48020657dda23cec885de330865d1665','[\"*\"]','2026-09-21 16:11:28',NULL,'2026-09-21 16:11:08','2026-09-21 16:11:28'),(60,'App\\Models\\User',1,'edupath-token','259b52d7d9ec6ba1796e8ffdb06bec4df2f3b7d1748936a6337fbfd60a0f6881','[\"*\"]','2026-09-22 22:48:52',NULL,'2026-09-21 16:24:17','2026-09-22 22:48:52'),(61,'App\\Models\\User',1,'edupath-token','88f85133847eb49abe27c7faa4d3d3c60782851c6414c7e4716bb6eb23f9a800','[\"*\"]','2026-09-22 23:00:05',NULL,'2026-09-22 22:49:01','2026-09-22 23:00:05'),(63,'App\\Models\\User',1,'edupath-token','2791dc421da89b50fac89d15cc7131ff033740bc4bdfd0d54f0b62f3e0895574','[\"*\"]','2026-09-23 00:40:32',NULL,'2026-09-23 00:06:12','2026-09-23 00:40:32'),(64,'App\\Models\\User',5,'edupath-token','572a685176893edd6c1bded8f0eb334f284e7a8310308f2ecc0ee5760318d117','[\"*\"]','2026-09-23 00:37:56',NULL,'2026-09-23 00:33:49','2026-09-23 00:37:56'),(67,'App\\Models\\User',3,'edupath-token','e1e0933e0a2bbba239b11c89b101be7c91674b863b744eab0270bd23a7085dc8','[\"*\"]','2026-09-23 01:54:50',NULL,'2026-09-23 01:54:46','2026-09-23 01:54:50'),(68,'App\\Models\\User',3,'edupath-token','bf5d2a0de19fddf2b72fee9ecb6df5f2e62ee403b4348fb5a235cd54e87c1328','[\"*\"]','2026-09-23 02:25:58',NULL,'2026-09-23 01:55:35','2026-09-23 02:25:58'),(69,'App\\Models\\User',3,'edupath-token','0c9726c2087c50831550e8721e3b5b839afe446884c9f37fdd8e2e01b7690d58','[\"*\"]','2026-09-23 02:52:07',NULL,'2026-09-23 02:26:01','2026-09-23 02:52:07'),(70,'App\\Models\\User',3,'edupath-token','b77e16fa943e5a49d447b37569d7fcfc0e6012135ef344b34e024121c8e82ca4','[\"*\"]','2026-09-23 02:52:34',NULL,'2026-09-23 02:52:32','2026-09-23 02:52:34'),(72,'App\\Models\\User',1,'edupath-token','df3b1dcbc21461f36c6ddba03afd4714ede89896ea3c193df766b378ccf3d65c','[\"*\"]',NULL,NULL,'2026-09-23 03:50:53','2026-09-23 03:50:53'),(73,'App\\Models\\User',5,'edupath-token','d1e7325020a7d9cbcee206c863bbe70fcea41a09f5022228513fd464e5970342','[\"*\"]','2026-09-23 04:52:42',NULL,'2026-09-23 03:51:15','2026-09-23 04:52:42'),(76,'App\\Models\\User',1,'edupath-token','1d7ca7e767b70d23f65f781197b8c9da1f3b02439aaec69376ddb6593124b800','[\"*\"]',NULL,NULL,'2026-09-23 04:18:22','2026-09-23 04:18:22'),(77,'App\\Models\\User',1,'edupath-token','0bd4c96df3eb1ccc147694c29867c1e9c5e683bded592d8c87a821ddcb885b80','[\"*\"]','2026-09-23 04:37:37',NULL,'2026-09-23 04:18:42','2026-09-23 04:37:37'),(82,'App\\Models\\User',1,'edupath-token','d509d8b7244de36073ba7c51d9c1f09e4bf71322b4ebb646984a18862695475d','[\"*\"]','2026-09-23 05:31:33',NULL,'2026-09-23 05:31:32','2026-09-23 05:31:33'),(93,'App\\Models\\User',10,'edupath-token','1a02f68f5fb456b3f61e3b3990a6a5e65593b6b4aa0bf892ef83e223f4ef2446','[\"*\"]',NULL,NULL,'2026-09-23 08:18:07','2026-09-23 08:18:07'),(95,'App\\Models\\User',1,'edupath-token','48926ca764004069433ceb286be2ebaf2cdfd06dc4531ae3de927ebd15972964','[\"*\"]','2026-09-23 08:45:44',NULL,'2026-09-23 08:21:21','2026-09-23 08:45:44'),(98,'App\\Models\\User',1,'edupath-token','7475b6531aecf3d0b43e3fe0326f2b2ac5a7cf0ff3b48b8c4f9364e3f9188ffb','[\"*\"]','2026-09-23 09:34:14',NULL,'2026-09-23 09:19:44','2026-09-23 09:34:14'),(99,'App\\Models\\User',1,'edupath-token','a196639fee9b21c3344438a93ee9c21c1d7baa4f3a356621544f1ad151afb325','[\"*\"]','2026-09-23 09:44:21',NULL,'2026-09-23 09:37:59','2026-09-23 09:44:21'),(102,'App\\Models\\User',10,'edupath-token','f596cc7f2bff38f1cc6e281b0dac5280154775bbf8d7515f708b1e954949fb53','[\"*\"]','2026-09-23 09:53:48',NULL,'2026-09-23 09:52:26','2026-09-23 09:53:48'),(103,'App\\Models\\User',10,'edupath-token','be830d41032d3f7a2cbc85a9a74250f9a306a523e19177f9c75a852d77d3ee4a','[\"*\"]',NULL,NULL,'2026-09-23 09:58:56','2026-09-23 09:58:56'),(104,'App\\Models\\User',1,'edupath-token','9fd3b2982240b9277bc3871e20f5ab78b9be2465fd249db8a565c7bba039734a','[\"*\"]','2026-09-23 09:59:03',NULL,'2026-09-23 09:59:01','2026-09-23 09:59:03'),(105,'App\\Models\\User',1,'edupath-token','7cc6eff1c7290c93742767afc2cfce0c4ed5ff6e261222db7bf7c4ba4693d68f','[\"*\"]','2026-09-25 02:26:25',NULL,'2026-09-24 05:03:11','2026-09-25 02:26:25'),(106,'App\\Models\\User',11,'edupath-token','b0ef4d8742c67378305f757adf7640a6d1bd3123fb9ba46d0c13ca7671b2b44d','[\"*\"]',NULL,NULL,'2026-09-25 02:12:08','2026-09-25 02:12:08'),(107,'App\\Models\\User',11,'edupath-token','15966a92d3940be6d82accb088ab6fa4915606eb7bfb3bcd41dfb950c19e4f80','[\"*\"]',NULL,NULL,'2026-09-25 02:12:26','2026-09-25 02:12:26'),(108,'App\\Models\\User',11,'edupath-token','1a87fddf006c0de54e895febc43d33f2f588e68f9aa1299fa18ed7aadad465d3','[\"*\"]',NULL,NULL,'2026-09-25 02:12:31','2026-09-25 02:12:31'),(109,'App\\Models\\User',11,'edupath-token','2979673dfec509f6f28b6cc1f0a55770aa842e5fe4f8fff27f6bb7f7b87ffe1d','[\"*\"]',NULL,NULL,'2026-09-25 02:12:34','2026-09-25 02:12:34'),(110,'App\\Models\\User',11,'edupath-token','3ed8a17b2b00201c2471ae501d12a0238bebad2a8847f9a76aa53b4ee26dd02b','[\"*\"]',NULL,NULL,'2026-09-25 02:12:36','2026-09-25 02:12:36'),(111,'App\\Models\\User',11,'edupath-token','13aeb84f6e86fa43c6167c35aba0b0c5513cd71639ec25818f16cae7f37da520','[\"*\"]',NULL,NULL,'2026-09-25 02:12:37','2026-09-25 02:12:37'),(112,'App\\Models\\User',11,'edupath-token','7887813dec8e3ea30bb1aa038f47c9986287125c0e2a4111e2086ed6c91dcd8a','[\"*\"]',NULL,NULL,'2026-09-25 02:12:38','2026-09-25 02:12:38'),(113,'App\\Models\\User',11,'edupath-token','6d6b1f9491902615cd2850a5893397061300270d2485f4f85f57f9176b155c4d','[\"*\"]','2026-09-25 02:22:22',NULL,'2026-09-25 02:14:52','2026-09-25 02:22:22'),(114,'App\\Models\\User',11,'edupath-token','42a5cdea3c294f2dabae5c963c19d013a00bd01330adb65411ccb27f11006f88','[\"*\"]','2026-09-25 02:23:04',NULL,'2026-09-25 02:22:19','2026-09-25 02:23:04'),(116,'App\\Models\\User',11,'edupath-token','95314f4085eb51bd6ba274b3c5a67ac3700cc0abee05ca7da89ea28d0e195b07','[\"*\"]','2026-09-25 04:24:08',NULL,'2026-09-25 02:31:29','2026-09-25 04:24:08'),(117,'App\\Models\\User',3,'edupath-token','da86dbb345b78710e35cf4c1365f8aa33c51dfb07c4975aa694d094fde5d145b','[\"*\"]','2026-09-25 03:08:03',NULL,'2026-09-25 02:36:35','2026-09-25 03:08:03'),(118,'App\\Models\\User',5,'edupath-token','58e644a845d2746024f62804dbe63a1bf5ee72ca33b49eac65ce9a6f0c47dc1f','[\"*\"]',NULL,NULL,'2026-09-25 04:26:04','2026-09-25 04:26:04'),(119,'App\\Models\\User',5,'edupath-token','c94c1abda35d3ad3469b360b8a2bee5ca2625a68f97cd3b9e3792c0b141823e4','[\"*\"]',NULL,NULL,'2026-09-25 04:26:12','2026-09-25 04:26:12'),(120,'App\\Models\\User',5,'edupath-token','13713601d48f171a1d9bf4426096355a56a09acc3a48008c5a10fa7bef5f70ee','[\"*\"]',NULL,NULL,'2026-09-25 04:26:15','2026-09-25 04:26:15'),(121,'App\\Models\\User',5,'edupath-token','129facd00fd6fe697a1b8d917db73d785dbe15247b6302a8ace346ac2a2152c0','[\"*\"]',NULL,NULL,'2026-09-25 04:26:15','2026-09-25 04:26:15'),(122,'App\\Models\\User',5,'edupath-token','60ff9ec401c7d57bed768a40e4e0a5284b38773aa1f0414993db527dfe63d27a','[\"*\"]',NULL,NULL,'2026-09-25 04:28:46','2026-09-25 04:28:46'),(123,'App\\Models\\User',5,'edupath-token','7ee60eed22f8261f344a7cac353b2bba2ac3d4fecd3f8843e0bf19b850d16c50','[\"*\"]','2026-09-25 04:33:29',NULL,'2026-09-25 04:32:13','2026-09-25 04:33:29'),(124,'App\\Models\\User',11,'edupath-token','6caf05d1f2cfdde94e3c199a45b860623f5513292d931240740241a96366c017','[\"*\"]',NULL,NULL,'2026-09-25 04:34:15','2026-09-25 04:34:15'),(125,'App\\Models\\User',11,'edupath-token','0497e22dddad4f027d0922509134ef4f51e5164fb9538f741bd858568b12d98b','[\"*\"]',NULL,NULL,'2026-09-25 04:34:19','2026-09-25 04:34:19'),(126,'App\\Models\\User',11,'edupath-token','ed5eb18b6a6f05bfd710ea74b8fa1ba8202eabfc50950b5daa06cc71507a8b9f','[\"*\"]',NULL,NULL,'2026-09-25 04:34:26','2026-09-25 04:34:26'),(127,'App\\Models\\User',11,'edupath-token','f0330b5504fbafac9e6f6136e7109be10065c4aac2972491fee62b768018ca95','[\"*\"]',NULL,NULL,'2026-09-25 04:34:27','2026-09-25 04:34:27'),(128,'App\\Models\\User',11,'edupath-token','f394212997cc94e658616dc8e7899f273f910fb31f7e21060829f0b98569a9ed','[\"*\"]',NULL,NULL,'2026-09-25 04:34:28','2026-09-25 04:34:28'),(129,'App\\Models\\User',11,'edupath-token','a0db9083965165d7517de87aad10de20d4f259fc0e3166c761b462c6739d90cf','[\"*\"]','2026-09-25 04:38:54',NULL,'2026-09-25 04:34:29','2026-09-25 04:38:54'),(130,'App\\Models\\User',11,'edupath-token','2a14823b239a16e98efee8425e27b0d7a9605468353d95d89681ac5a6c367b9f','[\"*\"]',NULL,NULL,'2026-09-25 04:39:11','2026-09-25 04:39:11'),(131,'App\\Models\\User',11,'edupath-token','ff9a91f1bc4fb8e9ba339e598b8146bac1fb40cbfd10314c53d8fdded25adc26','[\"*\"]',NULL,NULL,'2026-09-25 04:39:13','2026-09-25 04:39:13'),(133,'App\\Models\\User',5,'edupath-token','acfcef6ae0242506b408f86ccf5e3946b612ea8db64e5f2cacad9b479cf34f76','[\"*\"]','2026-09-25 04:41:45',NULL,'2026-09-25 04:41:26','2026-09-25 04:41:45'),(134,'App\\Models\\User',5,'edupath-token','b314f5c27d90a8251114d4d9c6e1f0c5a3bad5cd6cedd330d231776b26748dfa','[\"*\"]','2026-10-01 02:17:28',NULL,'2026-09-25 05:01:47','2026-10-01 02:17:28'),(135,'App\\Models\\User',1,'edupath-token','f7f20a654dc5b251963157a707845b414bac651e86f1a42260c32f7fb16afa5d','[\"*\"]','2026-09-30 20:51:32',NULL,'2026-09-28 07:51:40','2026-09-30 20:51:32'),(136,'App\\Models\\User',5,'edupath-token','47c4ec069a6d207fc4087c12c5b9d37b2ccea29945614832b49ea1ffb76ea579','[\"*\"]','2026-09-28 07:55:50',NULL,'2026-09-28 07:54:04','2026-09-28 07:55:50'),(137,'App\\Models\\User',1,'edupath-token','8b7642c2c71aa3cb99f5f3b37c4af4f6eb19735f3dfa1eb25d44965ed14d99de','[\"*\"]','2026-09-28 08:00:13',NULL,'2026-09-28 07:58:16','2026-09-28 08:00:13'),(138,'App\\Models\\User',1,'edupath-token','a724fdc71c2d0880118c740deee285a69f9a0da9b035a8fe1631e862185ac52e','[\"*\"]','2026-09-28 10:16:55',NULL,'2026-09-28 10:07:43','2026-09-28 10:16:55'),(144,'App\\Models\\User',1,'edupath-token','ba976ed1ee2fef6f97d1b9704d799d736dccd4872b65375269e44da8a0dc8815','[\"*\"]',NULL,NULL,'2026-10-01 01:15:17','2026-10-01 01:15:17'),(151,'App\\Models\\User',3,'edupath-token','57e9db995936f342c554ec8f83751b7922469fb160c8e64a3162dbb174bbe2de','[\"*\"]','2026-10-10 21:14:10',NULL,'2026-10-01 01:41:49','2026-10-10 21:14:10'),(152,'App\\Models\\User',5,'edupath-token','7f8b075200831056019847e13b7f8332ac670929988ae4daa3a11d8d01926d7e','[\"*\"]','2026-10-01 02:20:00',NULL,'2026-10-01 02:17:43','2026-10-01 02:20:00'),(153,'App\\Models\\User',5,'edupath-token','c59150144026ba5356cf2f6221b1551493b92c96da85ba8071f5ed0b65044fd3','[\"*\"]','2026-10-01 02:48:46',NULL,'2026-10-01 02:48:29','2026-10-01 02:48:46'),(154,'App\\Models\\User',5,'edupath-token','e989ae4636507f8d4263d3baa30017b5363fbb551f8fb0427c47b27186451b60','[\"*\"]','2026-10-01 03:19:38',NULL,'2026-10-01 03:16:04','2026-10-01 03:19:38'),(155,'App\\Models\\User',5,'edupath-token','4dbbb9dad21cb2ba1d987beb4be5f517894948247793e74b6f4c3ad2cad53143','[\"*\"]','2026-10-01 03:25:10',NULL,'2026-10-01 03:19:50','2026-10-01 03:25:10'),(156,'App\\Models\\User',5,'edupath-token','6daf7183525a1c1245a587d1dd30ad929e1dfad498b26d0e1de89641db61825d','[\"*\"]','2026-10-01 03:27:50',NULL,'2026-10-01 03:25:23','2026-10-01 03:27:50'),(159,'App\\Models\\User',1,'edupath-token','9efd8349d00d88a5fcd62b5556db7b3b57237751577783c07f7072f1d462b71e','[\"*\"]',NULL,NULL,'2026-10-11 01:54:01','2026-10-11 01:54:01'),(160,'App\\Models\\User',1,'edupath-token','a6dcf77bde59dc54c6b8abff3e88ecc7834ce8be2f101f918f267d925320f847','[\"*\"]','2026-10-11 01:54:54',NULL,'2026-10-11 01:54:05','2026-10-11 01:54:54'),(161,'App\\Models\\User',1,'edupath-token','b0cbccc2624517d35503053f871d7d983bdca27e1031eabe6a829cf18b98aaa0','[\"*\"]','2026-10-11 01:55:25',NULL,'2026-10-11 01:54:59','2026-10-11 01:55:25'),(162,'App\\Models\\User',1,'edupath-token','de4a6b98ae1c65926dc1b2c7a667d28f26f7d902b29e742d8fc58235e34c631a','[\"*\"]','2026-10-11 03:24:24',NULL,'2026-10-11 01:55:32','2026-10-11 03:24:24'),(163,'App\\Models\\User',1,'edupath-token','c0006fa1f01541f9060017ed9baf3e2623e77d84d5b4e0b297016af13b4e5206','[\"*\"]','2026-10-11 04:43:31',NULL,'2026-10-11 03:24:31','2026-10-11 04:43:31'),(164,'App\\Models\\User',1,'edupath-token','b33f65c6d87e327a2f166b60b34728331e24412effd5411a1939580115c28f64','[\"*\"]','2026-10-11 05:24:22',NULL,'2026-10-11 04:45:54','2026-10-11 05:24:22'),(165,'App\\Models\\User',1,'edupath-token','21663433c814bd2aaba24fe79319c7e81af4c1ff24493c288ccd435c4259708f','[\"*\"]','2026-10-11 05:28:27',NULL,'2026-10-11 05:24:19','2026-10-11 05:28:27'),(167,'App\\Models\\User',1,'edupath-token','83117f925db714b3fb3ac04938519ad696de09f9c0e1df03b58af66bf0346176','[\"*\"]','2026-10-11 07:17:11',NULL,'2026-10-11 06:09:44','2026-10-11 07:17:11'),(169,'App\\Models\\User',1,'edupath-token','c1f3937c9a822370bf67cfc138768687ea7ec5371b2e68a17093cc928f0d9bdb','[\"*\"]','2026-10-11 07:20:58',NULL,'2026-10-11 07:17:13','2026-10-11 07:20:58'),(172,'App\\Models\\User',1,'edupath-token','f693462056a0e49343ccab946342e40deb9eadbdfef6d60e40dede3f0bdbf9f9','[\"*\"]','2026-10-11 08:22:01',NULL,'2026-10-11 08:11:05','2026-10-11 08:22:01'),(173,'App\\Models\\User',1,'edupath-token','86689669f5edc4f96b70bc67bbf55aa4014e143496c3836b13645478f2cb3363','[\"*\"]','2026-10-11 08:22:26',NULL,'2026-10-11 08:22:24','2026-10-11 08:22:26'),(174,'App\\Models\\User',5,'edupath-token','bc03ca823722085d5954a6cfd9fac053761427931adc64b4b8c646c5f588690e','[\"*\"]','2026-10-12 03:53:03',NULL,'2026-10-12 03:52:42','2026-10-12 03:53:03'),(175,'App\\Models\\User',5,'edupath-token','d1a9f0f9684b1bbe9e6bde009065c9d9159bd9a6d87f50627bdedd42c5b1d4b9','[\"*\"]','2026-10-12 04:46:39',NULL,'2026-10-12 03:57:18','2026-10-12 04:46:39'),(176,'App\\Models\\User',5,'edupath-token','878ad1a492970baec3452951c3a2186c7ec83eaa692596d36ec648f7f430c94e','[\"*\"]','2026-10-12 04:47:47',NULL,'2026-10-12 04:46:55','2026-10-12 04:47:47'),(177,'App\\Models\\User',1,'edupath-token','9d780a69d78645aebaa846f7c2e915c2b52f2bd66d1fa7b840fa3df5ef5c8152','[\"*\"]',NULL,NULL,'2026-10-12 04:59:16','2026-10-12 04:59:16'),(181,'App\\Models\\User',5,'edupath-token','0706ab0fcaf5bd7609769d009d89a79e79e4d8f2b911457c62ec889f3ac98ac7','[\"*\"]',NULL,NULL,'2026-10-12 06:00:32','2026-10-12 06:00:32'),(189,'App\\Models\\User',1,'edupath-token','122394e003a7a344c7b2722ebdd4129a273472b2da14ef06d7951249501c7a4a','[\"*\"]','2026-10-12 15:51:14',NULL,'2026-10-12 15:22:20','2026-10-12 15:51:14'),(190,'App\\Models\\User',1,'edupath-token','25c2b6ddbc2c1f45f0508eadba30af0b1da0668eb252d5f9693e8b4fdf53acb2','[\"*\"]','2026-10-12 19:44:37',NULL,'2026-10-12 15:52:48','2026-10-12 19:44:37'),(191,'App\\Models\\User',12,'edupath-token','1793ab14d9c500417e395c05d0f4038675ebf38f66d34d32ec014d72ead09db0','[\"*\"]',NULL,NULL,'2026-10-12 19:23:35','2026-10-12 19:23:35'),(192,'App\\Models\\User',12,'edupath-token','8bf13b6053c7640dff6b9419fc059ccf61e1b4a008c81e0fdbca795df265144b','[\"*\"]','2026-10-12 19:40:53',NULL,'2026-10-12 19:23:57','2026-10-12 19:40:53'),(193,'App\\Models\\User',13,'edupath-token','dd4769a6121b6a1a7b16578522c8682e1557a95b97c5b6d5a2eb0e9acdb7ec7a','[\"*\"]',NULL,NULL,'2026-10-12 19:41:48','2026-10-12 19:41:48'),(194,'App\\Models\\User',13,'edupath-token','29ce539b56031c1883a3573ff47e25f6a631b9492e98d38cae2a5520d810f4fb','[\"*\"]','2026-10-12 19:43:33',NULL,'2026-10-12 19:42:05','2026-10-12 19:43:33'),(195,'App\\Models\\User',1,'edupath-token','137d4c659f663148f16d2ce71907d7a53e07f0f2587c0c5f89732292a0bb2a38','[\"*\"]','2026-10-13 23:37:24',NULL,'2026-10-12 19:44:39','2026-10-13 23:37:24'),(196,'App\\Models\\User',13,'edupath-token','59c4ee6ea7e770f312e8f73bbc4ac89c9883ef46ae7eb8871a17271ab010715a','[\"*\"]','2026-10-12 19:50:40',NULL,'2026-10-12 19:49:54','2026-10-12 19:50:40'),(197,'App\\Models\\User',13,'edupath-token','d73863fadd3505f8928bfa318cca47d8910ccc34e22ed5345659441cce22556c','[\"*\"]','2026-10-12 19:53:07',NULL,'2026-10-12 19:51:09','2026-10-12 19:53:07'),(199,'App\\Models\\User',14,'edupath-token','f2c08dff1d5af0c5200e26e0604f5de313fc5f16bb01c84251b0af78c999bffb','[\"*\"]',NULL,NULL,'2026-10-12 19:58:01','2026-10-12 19:58:01'),(200,'App\\Models\\User',14,'edupath-token','81dba8a43e5eb5b1baf4bbd31c4a79a8f1cc0a4231e449e3ccc413f964b20af1','[\"*\"]','2026-10-12 20:29:07',NULL,'2026-10-12 19:58:23','2026-10-12 20:29:07'),(202,'App\\Models\\User',14,'edupath-token','731a64f6d64c550eb4d4c5dafbe9d14f7b03697ac190424d01a74e57b93bae91','[\"*\"]','2026-10-12 20:41:12',NULL,'2026-10-12 20:31:57','2026-10-12 20:41:12'),(204,'App\\Models\\User',14,'edupath-token','edd817392d46241887babb33de806257661384f81fb645038c352c757142f1a9','[\"*\"]','2026-10-12 20:58:11',NULL,'2026-10-12 20:57:14','2026-10-12 20:58:11'),(205,'App\\Models\\User',5,'edupath-token','b56dd30a76d4bf4b694d52c5b6dacbefe138ca7a2b832a20aea2513a24911f0e','[\"*\"]','2026-10-13 21:55:40',NULL,'2026-10-13 21:50:24','2026-10-13 21:55:40'),(206,'App\\Models\\User',5,'edupath-token','c41cd1e2397d17408c1ae387c9a5e56b2a633126d00c0da5d42a5c7a8bf9cb75','[\"*\"]','2026-10-13 22:52:33',NULL,'2026-10-13 22:50:28','2026-10-13 22:52:33'),(207,'App\\Models\\User',5,'edupath-token','c31e1f82caa3c37a132b07ee48783ee80dfbc786d0a43aeeb4057f2a9bb311a1','[\"*\"]','2026-10-13 22:53:18',NULL,'2026-10-13 22:53:07','2026-10-13 22:53:18'),(208,'App\\Models\\User',5,'edupath-token','7db4912b6a6af7194a7ac3765b1b76528632d2e4d222160ff2a808fc63a6a0e2','[\"*\"]','2026-10-13 22:54:35',NULL,'2026-10-13 22:54:26','2026-10-13 22:54:35'),(209,'App\\Models\\User',5,'edupath-token','4f2c8146854c9f82c57a75299b9a650aa2d6e294333b6159ca887dea238e7b82','[\"*\"]','2026-10-13 23:04:07',NULL,'2026-10-13 23:04:02','2026-10-13 23:04:07'),(210,'App\\Models\\User',5,'edupath-token','8d9ab5263069215e57e5eb9c7bb918c9a0e84be28c996969146d501026559da5','[\"*\"]','2026-10-13 23:09:47',NULL,'2026-10-13 23:07:25','2026-10-13 23:09:47'),(215,'App\\Models\\User',1,'edupath-token','067ea60f413962fb249405d75c3950fd1c19c2c7ebeb7252db6bf2a447792a9b','[\"*\"]','2026-10-14 05:06:03',NULL,'2026-10-13 23:37:25','2026-10-14 05:06:03'),(217,'App\\Models\\User',5,'edupath-token','9c3288516a77172711aa520755506f7349aac6c782683fbc7e8ef326564b5454','[\"*\"]','2026-10-14 00:01:48',NULL,'2026-10-14 00:00:00','2026-10-14 00:01:48'),(220,'App\\Models\\User',1,'edupath-token','01efc5faea5b2332362af0308cc9fdd968c5f31aa218c2ec8829f8ecef84412d','[\"*\"]','2026-10-14 01:36:54',NULL,'2026-10-14 01:25:53','2026-10-14 01:36:54'),(223,'App\\Models\\User',5,'edupath-token','aad3082b6bf7bb174eb73c12d444e11322f8b6f45ab73a295973d0de9d764b21','[\"*\"]','2026-10-14 06:01:10',NULL,'2026-10-14 05:02:43','2026-10-14 06:01:10'),(224,'App\\Models\\User',1,'edupath-token','62834179e8218464045678442259598b27a556696c310c46aaeaa2b528d6eb27','[\"*\"]','2026-10-14 08:25:15',NULL,'2026-10-14 05:06:03','2026-10-14 08:25:15'),(228,'App\\Models\\User',1,'edupath-token','a7b78bb1e2df75fba2ecd83679d8a8d7e275456cf3ff4c08eac87ad93f168c80','[\"*\"]','2026-10-14 09:18:48',NULL,'2026-10-14 08:25:16','2026-10-14 09:18:48'),(236,'App\\Models\\User',1,'edupath-token','e48d1692ca69cc65cbbdf77c3a027212426a718ef762c92ae9a733131c014587','[\"*\"]','2026-10-14 15:16:14',NULL,'2026-10-14 14:53:51','2026-10-14 15:16:14'),(237,'App\\Models\\User',15,'edupath-token','104f7c6a3f34800760a5cfd59ddcb2ed60e15faaf9ff7f684e291dec32705c9e','[\"*\"]',NULL,NULL,'2026-10-14 15:14:05','2026-10-14 15:14:05'),(239,'App\\Models\\User',1,'edupath-token','affe4189e536c04242fca62ddde01ef6799d198ceb8a1d15a2e6f574244a7b27','[\"*\"]','2026-10-14 22:28:49',NULL,'2026-10-14 15:16:14','2026-10-14 22:28:49'),(241,'App\\Models\\User',1,'edupath-token','f34c251e7dc1aef91dbd9f42cc4bf7f5deb77f898c609761afa65cce9a7d4a43','[\"*\"]',NULL,NULL,'2026-10-14 22:28:48','2026-10-14 22:28:48'),(243,'App\\Models\\User',1,'edupath-token','c9103476bde07e92b6104abb4f09b75d86d6e96baf03a398f0d79f7e2da30f22','[\"*\"]','2026-10-14 23:07:48',NULL,'2026-10-14 22:50:07','2026-10-14 23:07:48'),(244,'App\\Models\\User',16,'edupath-token','3d5509d2d654c15673883878875fc54c56a72ff27144bb15623990616f8406d7','[\"*\"]',NULL,NULL,'2026-10-14 23:01:16','2026-10-14 23:01:16'),(245,'App\\Models\\User',16,'edupath-token','cbdb268f7694c1a6ca2a38fa7dd664cf9ec43fbbd979327f2d10cdc9dee1188c','[\"*\"]','2026-10-14 23:13:54',NULL,'2026-10-14 23:01:31','2026-10-14 23:13:54'),(246,'App\\Models\\User',5,'edupath-token','8503651d226de92a4dbb296d5c94720befe1e95505f9c8f7b09399d1515744b2','[\"*\"]','2026-10-15 06:01:12',NULL,'2026-10-15 01:06:07','2026-10-15 06:01:12'),(247,'App\\Models\\User',1,'edupath-token','99a568e5b2ba9beec820dd616861a5f26f93532cd1c307cccb75634bbbff9726','[\"*\"]','2026-10-15 05:34:01',NULL,'2026-10-15 03:40:34','2026-10-15 05:34:01'),(248,'App\\Models\\User',1,'edupath-token','a1a775373d040f2f5590881bbaf5d4324f8f41ab59a31f1cd9013bcd7fff6b90','[\"*\"]','2026-10-15 06:29:04',NULL,'2026-10-15 05:33:59','2026-10-15 06:29:04'),(249,'App\\Models\\User',5,'edupath-token','adc706339c277bab25a0f727706451cd306eab24e4335c98bf798d5333980945','[\"*\"]','2026-10-15 20:43:04',NULL,'2026-10-15 06:16:49','2026-10-15 20:43:04'),(250,'App\\Models\\User',1,'edupath-token','cc01a38af2c8f259d9ea9bcb851e9ca86f10f44b92b88699cabdc79cc11dbcb8','[\"*\"]','2026-10-15 06:36:02',NULL,'2026-10-15 06:29:04','2026-10-15 06:36:02'),(251,'App\\Models\\User',1,'edupath-token','b47ab0390521fb1aeb3880115233fb430e8502c16c0ddf8840d850f6147a210e','[\"*\"]','2026-10-19 23:41:43',NULL,'2026-10-15 15:05:32','2026-10-19 23:41:43'),(263,'App\\Models\\User',1,'e2e-release-test','d1daeeee62d1c77fed4511f96bbe1379497ec1d2c6b0a8810cb689433f0c93fb','[\"*\"]','2026-10-15 17:57:08',NULL,'2026-10-15 17:57:08','2026-10-15 17:57:08'),(264,'App\\Models\\User',18,'edupath-token','5f1d6398ff0be632e2abedcbae477c12e86d710683ee0598d7459bd5ba376365','[\"*\"]',NULL,NULL,'2026-10-15 18:20:42','2026-10-15 18:20:42'),(266,'App\\Models\\User',18,'edupath-token','e9272f3b9f537580f3fd149f446c75d444ea90115f19126588067a6163a30e00','[\"*\"]','2026-10-15 18:28:15',NULL,'2026-10-15 18:23:24','2026-10-15 18:28:15'),(267,'App\\Models\\User',1,'edupath-token','39947a544ac158070d905479ee4c80412cfbaa6f560c5dad23256308513cb091','[\"*\"]','2026-10-16 04:07:58',NULL,'2026-10-15 20:16:22','2026-10-16 04:07:58'),(269,'App\\Models\\User',5,'edupath-token','317a3adfaa15fe62285ae948e617a23f67f0f46651c728f5b29c929b38a84f65','[\"*\"]','2026-10-16 04:31:30',NULL,'2026-10-16 04:08:25','2026-10-16 04:31:30'),(280,'App\\Models\\User',5,'edupath-token','daaec26e6322f75a926fd0ec59876e29822ba204aa8056f033c8f21a1f1d643a','[\"*\"]','2026-10-16 11:14:24',NULL,'2026-10-16 05:32:13','2026-10-16 11:14:24'),(281,'App\\Models\\User',5,'edupath-token','cafc4c1133fce8f5c69984b825c7538f4ba9ec5ebfe901d12dae749d05531c82','[\"*\"]',NULL,NULL,'2026-10-16 11:14:28','2026-10-16 11:14:28'),(288,'App\\Models\\User',19,'edupath-token','a6a8e1cb7581b39985fa2945119f3398a036ff8cd5ff53498318588081a8ab2b','[\"*\"]',NULL,NULL,'2026-10-16 11:23:06','2026-10-16 11:23:06'),(293,'App\\Models\\User',19,'edupath-token','665e0e792a1bde2ed0b3499d7430512d4ad9468de3f0f37504c4881ac668af15','[\"*\"]','2026-10-17 05:25:01',NULL,'2026-10-16 11:28:11','2026-10-17 05:25:01'),(295,'App\\Models\\User',19,'edupath-token','4675cfb486942aedeab09fc4a6926fbc46ce6d4c428cfacd4316a57304fe571b','[\"*\"]',NULL,NULL,'2026-10-17 05:25:06','2026-10-17 05:25:06'),(296,'App\\Models\\User',1,'edupath-token','25ecb2b7175ff149e870b2777e6cad00ea71e3c841da0917134b3ec15f9f64cf','[\"*\"]','2026-10-17 07:23:52',NULL,'2026-10-17 05:25:14','2026-10-17 07:23:52'),(297,'App\\Models\\User',5,'edupath-token','2aadb0596efa0b53c5ae6f438e997099c8d990c5c983f6cb312d0dcf77ec2f6b','[\"*\"]','2026-10-17 07:44:46',NULL,'2026-10-17 05:40:02','2026-10-17 07:44:46'),(298,'App\\Models\\User',1,'edupath-token','603fee556f5b0069135be449d58d9fa2d4bc36946e6f7d45648bf34f336a5f3f','[\"*\"]','2026-10-17 07:28:57',NULL,'2026-10-17 07:23:55','2026-10-17 07:28:57'),(299,'App\\Models\\User',1,'edupath-token','2286ad9e0231ff76ad469e9db4ef4c1841978669c908f33c54bbf6024ae05011','[\"*\"]','2026-10-17 09:47:43',NULL,'2026-10-17 07:29:12','2026-10-17 09:47:43'),(304,'App\\Models\\User',5,'edupath-token','133638a241ff1deb7dfc4d0b7b4a4c6f280fea51e662d3f09b981b8dbdb629fe','[\"*\"]','2026-10-17 23:11:13',NULL,'2026-10-17 14:03:42','2026-10-17 23:11:13'),(306,'App\\Models\\User',22,'edupath-token','7d0da52106d0a11bae6e27179d58c8c2e3de74e1d233338032e284f9a9640d40','[\"*\"]',NULL,NULL,'2026-10-17 14:42:00','2026-10-17 14:42:00'),(307,'App\\Models\\User',22,'edupath-token','975f86b70d2e9f93f28e85072fc64ad96771df22b8445278e504c34700585728','[\"*\"]','2026-10-17 14:43:44',NULL,'2026-10-17 14:42:13','2026-10-17 14:43:44'),(311,'App\\Models\\User',1,'edupath-token','1578912d7eb5b5ff3ac121b1f1fb512bbb7ffc77414812de8e1e2071a5eb56b1','[\"*\"]','2026-10-18 00:52:38',NULL,'2026-10-18 00:52:23','2026-10-18 00:52:38'),(314,'App\\Models\\User',5,'edupath-token','efc171b6a0e99117f756aca691479a34770ae07abbb64ed37e125378d0c529de','[\"*\"]','2026-10-18 01:21:34',NULL,'2026-10-18 01:18:34','2026-10-18 01:21:34'),(319,'App\\Models\\User',3,'edupath-token','fde1a96e16f264926fb6f1a9224139a4d75bdc6c7aee1864f4620d2e2154d307','[\"*\"]','2026-10-18 04:24:32',NULL,'2026-10-18 04:03:26','2026-10-18 04:24:32'),(320,'App\\Models\\User',3,'edupath-token','b7345ad02c718f4642b82b387189548b7a784baa2eca1039b8a54fec05a90924','[\"*\"]',NULL,NULL,'2026-10-18 04:24:41','2026-10-18 04:24:41'),(321,'App\\Models\\User',3,'edupath-token','96ab7930a9f748ab80b423e14be15392c1f61c635aafe3cb5cad920e1849f99e','[\"*\"]','2026-10-18 04:32:02',NULL,'2026-10-18 04:24:44','2026-10-18 04:32:02'),(322,'App\\Models\\User',5,'edupath-token','89ce0cf9caebaededb8e3244b99bb60bee0fcb989926c4bd5b7f70ce48796e71','[\"*\"]','2026-10-18 04:40:48',NULL,'2026-10-18 04:30:55','2026-10-18 04:40:48'),(323,'App\\Models\\User',3,'edupath-token','b8d427ce01790a3c757f9ff6246005f6e237d96ce15377436803a3561d84855e','[\"*\"]',NULL,NULL,'2026-10-18 04:32:17','2026-10-18 04:32:17'),(329,'App\\Models\\User',3,'edupath-token','9cde85435d685279d7917d21cb137b633fe3ba809e13ffed2e6103c88cf66339','[\"*\"]','2026-10-18 04:59:24',NULL,'2026-10-18 04:54:24','2026-10-18 04:59:24'),(331,'App\\Models\\User',3,'edupath-token','fc11a24fb6e94d76eceffe68c636e64732056ce16414bb5db500aee9acb73f26','[\"*\"]','2026-10-18 05:02:50',NULL,'2026-10-18 05:02:33','2026-10-18 05:02:50'),(334,'App\\Models\\User',5,'edupath-token','21821348971df9f247962057675b523479e3ae7cff398d7ed518e8938a4d4164','[\"*\"]','2026-10-18 06:16:26',NULL,'2026-10-18 05:52:58','2026-10-18 06:16:26'),(336,'App\\Models\\User',1,'edupath-token','f721a9b805d7f14d958cbf1f07d504d2531e32b6d1abd704537bb6ab24ebc561','[\"*\"]','2026-10-19 01:06:41',NULL,'2026-10-18 06:19:00','2026-10-19 01:06:41'),(341,'App\\Models\\User',5,'edupath-token','435abebd335d0cac94f4bd15411ec5a13b489b7a4ad7297e5ecb576cfcfcb88f','[\"*\"]','2026-10-19 03:18:42',NULL,'2026-10-19 01:34:19','2026-10-19 03:18:42'),(344,'App\\Models\\User',3,'edupath-token','3807b2bc0768173e926fb81118019f9625b47725491b31f55df0515722649183','[\"*\"]',NULL,NULL,'2026-10-19 03:21:17','2026-10-19 03:21:17'),(351,'App\\Models\\User',5,'edupath-token','1ccedfd4f1d077391911dcbae4ce8850f58588ff3b414a5ec89e623a6a22dc09','[\"*\"]','2026-10-19 04:25:27',NULL,'2026-10-19 04:20:29','2026-10-19 04:25:27'),(356,'App\\Models\\User',1,'edupath-token','f8716b6a540b671c05b3eb2e9b25f2712a0dfff3bab49d70951ab1f9c7f9ef4d','[\"*\"]','2026-10-19 15:52:32',NULL,'2026-10-19 07:32:53','2026-10-19 15:52:32'),(357,'App\\Models\\User',5,'edupath-token','7e729ee7528a6c8d021e2cf8d17f895a019b67baf06be97dc76fae2d6b9d3100','[\"*\"]',NULL,NULL,'2026-10-19 14:45:33','2026-10-19 14:45:33'),(363,'App\\Models\\User',1,'edupath-token','81b4bf538f188ff57335c7cf220308a6965e55a0a6944be1cc72090a5c8da367','[\"*\"]','2026-10-19 21:46:10',NULL,'2026-10-19 15:52:36','2026-10-19 21:46:10'),(367,'App\\Models\\User',1,'edupath-token','3b0becb1b3c3ac461f5430045ff39561a1b935d8223f02ff1ec11ab699ce72f9','[\"*\"]','2026-10-19 23:08:52',NULL,'2026-10-19 21:47:42','2026-10-19 23:08:52'),(368,'App\\Models\\User',23,'edupath-token','e6ccd034b14d5b24e475b89aae4441b103ee34076b014ea6561ac1118b1a17d7','[\"*\"]',NULL,NULL,'2026-10-19 22:12:49','2026-10-19 22:12:49'),(369,'App\\Models\\User',23,'edupath-token','b20ebc358a22c8f4ec46808eec9da1debd3b8930170bbc812145996bea4eb9c5','[\"*\"]','2026-10-19 23:08:02',NULL,'2026-10-19 22:13:01','2026-10-19 23:08:02'),(370,'App\\Models\\User',1,'edupath-token','f8d4818227e6fe094ff77e3b49844d9e9d49d6517cadaca5c0df472d7759af57','[\"*\"]',NULL,NULL,'2026-10-19 22:18:51','2026-10-19 22:18:51'),(371,'App\\Models\\User',1,'edupath-token','f9036c0a3fe327dfeb9d919291b8d91c5073a8d6467df424b65f84c5c008839b','[\"*\"]',NULL,NULL,'2026-10-19 22:18:54','2026-10-19 22:18:54'),(372,'App\\Models\\User',1,'edupath-token','22366beef8e6f8d9ca59c03ba8b1d85cd9995bdf81ef5deae36cbb0d8f7d1df7','[\"*\"]','2026-10-19 23:31:10',NULL,'2026-10-19 22:19:04','2026-10-19 23:31:10'),(373,'App\\Models\\User',1,'edupath-token','65bc29447ac153c109c30eb9eefca87e196c4bc707b2ddbe154d287b4b90a4a6','[\"*\"]','2026-10-20 05:17:13',NULL,'2026-10-20 00:28:53','2026-10-20 05:17:13'),(374,'App\\Models\\User',5,'edupath-token','067c1f53516850c934b9d141630f1f48c29fd59d3933702dab929d641fb21582','[\"*\"]','2026-10-20 02:43:15',NULL,'2026-10-20 00:35:52','2026-10-20 02:43:15'),(375,'App\\Models\\User',28,'edupath-token','e6da58f75e96e44201359cd2df702edb3a4e8fc01217f444a3df4d2eff203c20','[\"*\"]',NULL,NULL,'2026-10-20 00:40:52','2026-10-20 00:40:52'),(376,'App\\Models\\User',28,'edupath-token','4f0b3ba570e51f8ab9ae368afc96595b6bc68f5c2d0b688dd4c0485412755a88','[\"*\"]','2026-10-20 02:40:49',NULL,'2026-10-20 00:41:59','2026-10-20 02:40:49'),(377,'App\\Models\\User',5,'edupath-token','9cac10ee9b4282f6a9f4d61fd1e4ef667b1a27977d36e49d2e4d75b21cd7d3ae','[\"*\"]','2026-10-20 05:19:51',NULL,'2026-10-20 05:16:05','2026-10-20 05:19:51'),(380,'App\\Models\\User',29,'edupath-token','303e9e897fe18c60322dcf4c8d8833353ca7912205dba2a4c1414e3915736040','[\"*\"]',NULL,NULL,'2026-10-20 05:19:54','2026-10-20 05:19:54'),(381,'App\\Models\\User',29,'edupath-token','3dba69b51ce092b66a221c8ee88ef46cdce6440d313cc352c48fdb11e8fc7bcf','[\"*\"]','2026-10-20 06:45:02',NULL,'2026-10-20 05:26:46','2026-10-20 06:45:02'),(384,'App\\Models\\User',1,'edupath-token','3d021cf5f09aa9ffb93862d1cd4c74a52fb6f86376145c61f1764a740aaac807','[\"*\"]','2026-10-20 05:42:35',NULL,'2026-10-20 05:42:31','2026-10-20 05:42:35');
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scholarship_applications`
--

DROP TABLE IF EXISTS `scholarship_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scholarship_applications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `applicant_id` bigint unsigned NOT NULL,
  `scholarship_id` bigint unsigned NOT NULL,
  `status` enum('pending','under_review','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `staff_recommendation` enum('recommended','not_recommended','needs_information') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `staff_recommendation_remarks` text COLLATE utf8mb4_unicode_ci,
  `staff_recommended_by` bigint unsigned DEFAULT NULL,
  `staff_recommended_at` timestamp NULL DEFAULT NULL,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `award_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'undecided',
  `award_decided_by` bigint unsigned DEFAULT NULL,
  `award_decided_at` timestamp NULL DEFAULT NULL,
  `award_remarks` text COLLATE utf8mb4_unicode_ci,
  `award_revision` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `scholarship_applications_applicant_scholarship_unique` (`applicant_id`,`scholarship_id`),
  KEY `scholarship_applications_scholarship_id_foreign` (`scholarship_id`),
  CONSTRAINT `scholarship_applications_applicant_id_foreign` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `scholarship_applications_scholarship_id_foreign` FOREIGN KEY (`scholarship_id`) REFERENCES `scholarships` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scholarship_applications`
--

LOCK TABLES `scholarship_applications` WRITE;
/*!40000 ALTER TABLE `scholarship_applications` DISABLE KEYS */;
INSERT INTO `scholarship_applications` VALUES (10,2,17,'approved','GWA: 200\nYear Level: 1st Year\nAnnual Household Income: ₱100,000 – ₱250,000\nFamily Size: 5 or more dependents\nMotivation Statement: walawaiiwwiaiaiwiwiw\nFHE review pending: a completed, officially released entrance-exam result of at least 40/100 is required before approval or awarding.',NULL,NULL,NULL,NULL,'2026-10-17 11:51:12','2026-10-17 11:51:12','2026-10-20 00:54:53','undecided',NULL,NULL,NULL,0),(11,2,18,'approved','GWA: 445\nYear Level: 2nd Year\nAnnual Household Income: Below ₱100,000\nFamily Size: 5 or more dependents\nMotivation Statement: xadssdedvbbhhhgggvvv',NULL,NULL,NULL,NULL,'2026-10-19 01:14:57','2026-10-19 01:14:57','2026-10-19 01:22:02','undecided',NULL,NULL,NULL,0),(12,2,19,'approved','GWA: 744\nYear Level: 3rd Year\nAnnual Household Income: Below ₱100,000\nFamily Size: 5 or more dependents\nMotivation Statement: 1222http://localhost:8080/storage/emulated/0/ksweb/tools/phpMyAdminNginxHosts:%20noneOFFON',NULL,NULL,NULL,NULL,'2026-10-19 01:25:48','2026-10-19 01:25:48','2026-10-19 01:26:34','undecided',NULL,NULL,NULL,0),(14,16,18,'approved','GWA: 3.00\nYear Level: 3rd Year\nAnnual Household Income: Above ₱500,000\nFamily Size: 5 or more dependents\nMotivation Statement: uwgegegsgsuehwhehsgsbhehegsggsgshshgsyevevshyegegeyegegegeygegeyeyeggeg',NULL,NULL,NULL,NULL,'2026-10-19 22:23:20','2026-10-19 22:23:20','2026-10-19 22:25:29','undecided',NULL,NULL,NULL,0),(16,18,19,'approved','GWA: 1.00\nYear Level: 4th Year\nAnnual Household Income: Below ₱100,000\nFamily Size: 3–4 dependents\nMotivation Statement: it helps me to buy tanduay',NULL,NULL,NULL,NULL,'2026-10-20 01:03:22','2026-10-20 01:03:22','2026-10-20 01:06:18','undecided',NULL,NULL,NULL,0),(17,18,17,'approved','GWA: 2.00\nYear Level: 4th Year\nAnnual Household Income: Below ₱100,000\nFamily Size: 3–4 dependents\nMotivation Statement: bshsvvsshvsnabshsvsbsusgdd',NULL,NULL,NULL,NULL,'2026-10-20 01:21:15','2026-10-20 01:21:15','2026-10-20 01:22:23','undecided',NULL,NULL,NULL,0),(18,19,17,'approved','GWA: 10\nYear Level: 3rd Year\nAnnual Household Income: ₱100,000 – ₱250,000\nFamily Size: 3–4 dependents\nMotivation Statement: gahmavsmsnzhamq.ahansbsbsbkzyzjsmsjsksnsn',NULL,NULL,NULL,NULL,'2026-10-20 06:05:18','2026-10-20 06:05:18','2026-10-20 06:41:51','undecided',NULL,NULL,NULL,0),(19,19,23,'approved','GWA: 10\nYear Level: 1st Year\nAnnual Household Income: ₱100,000 – ₱250,000\nFamily Size: 3–4 dependents\nMotivation Statement: gahmavsmsnzhamq.ahansbsbsbkzyzjsmsjsksnsn',NULL,NULL,NULL,NULL,'2026-10-20 06:34:21','2026-10-20 06:34:21','2026-10-20 06:39:49','undecided',NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `scholarship_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scholarships`
--

DROP TABLE IF EXISTS `scholarships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scholarships` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `program_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `requires_online_exam` tinyint(1) NOT NULL DEFAULT '0',
  `requires_face_to_face_exam` tinyint(1) NOT NULL DEFAULT '0',
  `description` text COLLATE utf8mb4_unicode_ci,
  `objectives` text COLLATE utf8mb4_unicode_ci,
  `goals` text COLLATE utf8mb4_unicode_ci,
  `target_beneficiaries` text COLLATE utf8mb4_unicode_ci,
  `amount` decimal(10,2) DEFAULT NULL,
  `eligibility` text COLLATE utf8mb4_unicode_ci,
  `requirements` text COLLATE utf8mb4_unicode_ci,
  `benefits` text COLLATE utf8mb4_unicode_ci,
  `covered_expenses` text COLLATE utf8mb4_unicode_ci,
  `application_start` date DEFAULT NULL,
  `application_start_at` datetime DEFAULT NULL,
  `application_end` date DEFAULT NULL,
  `application_end_at` datetime DEFAULT NULL,
  `available_slots` int unsigned DEFAULT NULL,
  `unlimited_awards` tinyint(1) NOT NULL DEFAULT '0',
  `exam_question_count` smallint unsigned NOT NULL DEFAULT '100',
  `exam_seconds_per_question` smallint unsigned NOT NULL DEFAULT '60',
  `exam_passing_score` smallint unsigned NOT NULL DEFAULT '50',
  `admission_approval_required` tinyint(1) NOT NULL DEFAULT '1',
  `renewal_requirements` text COLLATE utf8mb4_unicode_ci,
  `official_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scholarships`
--

LOCK TABLES `scholarships` WRITE;
/*!40000 ALTER TABLE `scholarships` DISABLE KEYS */;
INSERT INTO `scholarships` VALUES (17,'Free Higher Education (FHE)','Government of the Philippines / UniFAST / CHED','Free Higher Education','unifast',0,1,'The Free Higher Education (FHE) benefit is implemented under Republic Act No. 10931, also known as the Universal Access to Quality Tertiary Education Act. It provides eligible Filipino students studying in covered public higher education institutions with free tuition and other eligible school fees, subject to applicable laws, implementing rules, and institutional policies. For Trinidad Municipal College, eligibility and coverage must be verified through the appropriate college offices.','1. Reduce financial barriers to tertiary education.\n2. Support access to affordable and quality higher education.\n3. Help eligible students pursue their academic programs.\n4. Promote educational opportunity and inclusion.\n5. Support students in completing their tertiary education.','1. Improve access to higher education for eligible students.\n2. Reduce eligible tuition and school-fee expenses.\n3. Support student enrollment and retention.\n4. Promote equitable access to educational opportunities.\n5. Contribute to long-term educational development.','Eligible Filipino students enrolled in covered public higher education institutions, including qualified Trinidad Municipal College students, subject to institutional and national eligibility requirements.',10000.00,'1. Must satisfy applicable Filipino citizenship requirements.\n2. Must be admitted or enrolled in an eligible institution and program.\n3. Must meet applicable admission and enrollment requirements.\n4. Must satisfy the eligibility conditions under RA 10931.\n5. Must not fall under applicable statutory or regulatory exclusions.\n6. Continued eligibility is subject to applicable institutional and national rules.','1. Valid admission or enrollment information.\n2. Student identification or other accepted identification, if required.\n3. Academic records required for admission or enrollment.\n4. Supporting documents requested by the Registrar or designated office.\n5. Additional eligibility documents where required by official guidelines.','1. Coverage of eligible tuition fees.\n2. Coverage of other eligible school fees.\n3. Reduced direct educational costs for qualified students.\n4. Improved financial accessibility of tertiary education.\n5. Support for continued participation in higher education.','1. Eligible tuition fees.\n2. Eligible miscellaneous or other school fees as defined by applicable rules.\n3. Other charges expressly covered by official FHE regulations.\n\nNote: Personal expenses, transportation, and living allowances are not automatically included under the FHE tuition benefit.',NULL,NULL,NULL,NULL,NULL,1,100,60,50,1,'1. Maintain eligibility under applicable FHE regulations.\n2. Meet institutional enrollment and academic requirements.\n3. Submit updated documentation when officially required.\n4. Comply with applicable continuation and exclusion rules.','https://unifast.gov.ph/',1,'2026-10-17 09:59:26','2026-10-19 16:12:52'),(18,'Tertiary Education Subsidy (TES)','UniFAST / CHED','TES','other',1,0,'The Tertiary Education Subsidy (TES) is a government financial assistance program established under the Universal Access to Quality Tertiary Education framework. It provides eligible tertiary education students with financial assistance according to current program guidelines, funding availability, prioritization rules, and recipient-selection procedures. Eligibility does not automatically guarantee an award. Trinidad Municipal College participation, application procedures, and current availability must be confirmed with its Scholarship Office.','1. Provide financial assistance to eligible tertiary students.\n2. Reduce financial difficulties associated with college education.\n3. Improve access to higher education among priority beneficiaries.\n4. Support students in continuing their studies.\n5. Promote equitable educational opportunities.','1. Improve financial support for eligible students.\n2. Reduce the risk of discontinuing studies due to financial barriers.\n3. Support educational access among qualified beneficiaries.\n4. Encourage successful continuation of tertiary education.\n5. Contribute to national educational inclusion objectives.','Tertiary education students who meet current TES eligibility requirements and beneficiary-prioritization rules, including qualified students of participating higher education institutions.',10000.00,'1. Must meet applicable TES citizenship and student eligibility requirements.\n2. Must satisfy current enrollment and institutional eligibility rules.\n3. Must meet the applicable beneficiary-prioritization criteria.\n4. Must comply with current UniFAST/CHED selection procedures.\n5. Must satisfy restrictions on overlapping government benefits where applicable.\n6. Final recipient selection is subject to the administering authority.','1. Enrollment or admission verification, as officially required.\n2. Valid student identification or accepted identification documents.\n3. Academic or institutional records when required.\n4. Beneficiary eligibility or prioritization documentation when applicable.\n5. Additional documents specified in the current official TES announcement.\n6. Other verification requirements imposed by the administering authority.','1. Financial assistance for eligible beneficiaries.\n2. Support for allowable educational expenses.\n3. Assistance in reducing financial barriers to college education.\n4. Support for continued enrollment and academic participation.\n5. Additional benefits only when expressly provided by official TES guidelines.','1. Educational expenses covered under current TES guidelines.\n2. Allowable learning materials and academic-related costs.\n3. Other permitted expenses depending on beneficiary category and program rules.\n\nNote: Exact coverage and subsidy amounts must be verified against current official TES guidelines before publication.',NULL,NULL,NULL,NULL,NULL,1,100,60,50,1,'1. Continue meeting applicable TES eligibility requirements.\n2. Maintain the enrollment status required by the program.\n3. Submit updated supporting documents when required.\n4. Follow current continuation and validation procedures.\n5. Remain subject to official funding, prioritization, and selection rules.','https://unifast.gov.ph/',1,'2026-10-17 09:59:26','2026-10-17 10:01:41'),(19,'Tulong Dunong Program (TDP)','CHED / UniFAST','TDP','other',1,0,'The Tulong Dunong Program (TDP) is a government educational financial assistance program intended to support eligible tertiary education students. Its implementation, beneficiary selection, financial assistance, and documentation requirements are governed by applicable program guidelines and official announcements. Trinidad Municipal College applicants must follow the instructions issued by the designated Scholarship Office and administering authorities for the relevant application cycle.','1. Provide educational assistance to eligible college students.\n2. Help reduce financial challenges associated with tertiary education.\n3. Support access to college education.\n4. Assist eligible beneficiaries in continuing their studies.\n5. Promote educational opportunity among qualified applicants.','1. Improve access to educational financial assistance.\n2. Support continued participation in tertiary education.\n3. Reduce financial obstacles to academic progress.\n4. Assist students who satisfy official beneficiary requirements.\n5. Contribute to broader educational development objectives.','Eligible tertiary education students meeting current TDP beneficiary requirements, including qualified applicants covered by official CHED or authorized program announcements.',20000.00,'1. Must meet current TDP student eligibility requirements.\n2. Must satisfy applicable enrollment or admission conditions.\n3. Must comply with beneficiary selection criteria.\n4. Must meet any financial, documentary, or prioritization requirements officially imposed.\n5. Must comply with restrictions on duplicate benefits where applicable.\n6. Final eligibility and recipient selection remain subject to official review.','1. Official application or beneficiary information form, if required.\n2. Valid identification documents as prescribed.\n3. Enrollment or admission verification.\n4. Academic or institutional documents when required.\n5. Eligibility or supporting certifications specified in the announcement.\n6. Other documentation requested by the authorized program office.','1. Financial educational assistance for selected beneficiaries.\n2. Support for allowable education-related costs.\n3. Assistance in meeting certain academic expenses.\n4. Reduced financial burden for eligible recipients.\n5. Support for continuing tertiary education.','1. Educational expenses permitted by applicable TDP rules.\n2. Eligible learning materials and academic needs.\n3. Other allowable costs specified by official program guidelines.\n\nNote: Actual grant amount, covered expenses, and payment conditions depend on the official TDP application cycle.',NULL,NULL,NULL,NULL,NULL,1,100,60,50,1,'1. Continue satisfying applicable program eligibility requirements.\n2. Maintain the required enrollment status where applicable.\n3. Submit updated records if requested.\n4. Follow official continuation or reapplication procedures.\n5. Remain subject to funding availability and authorized selection.','https://unifast.gov.ph/',1,'2026-10-17 09:59:26','2026-10-17 10:01:08'),(23,'LIBRE TAGAY','Alixie TOROR','Trinidad Assistance Financial Program','other',1,0,NULL,NULL,NULL,NULL,1500.00,NULL,NULL,'pang birthday',NULL,NULL,'2026-10-20 14:00:00',NULL,'2026-10-20 16:00:00',NULL,1,100,60,50,1,NULL,NULL,1,'2026-10-20 06:30:50','2026-10-20 06:33:38');
/*!40000 ALTER TABLE `scholarships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('cADnQDoF66HiM1y2SjxUt0hGDzMrmaa78rX4R8R3',NULL,'192.168.1.10','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0','YTozOntzOjY6Il90b2tlbiI7czo0MDoiWXlkOXQyb3l5YlRSZVVlV0Yxd2ltT2wyNzF1S0k0dVRoOWZSbHR2QSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjQ6Imh0dHA6Ly8xOTIuMTY4LjEuMTA6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1790258546),('MAp6uU796OeJ6M0mr8DxNfzXoibVhAvObrTgW5sC',NULL,'192.168.8.52','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiOU55MmN2ZU5xdTdVZDkySVJyaVlPQUEwMTF0U0VOb1FPTDFCVlhGMSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjQ6Imh0dHA6Ly8xOTIuMTY4LjguNTI6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1791804524),('mDX7hXsjmGDYKhpdmgggdV1JQeAzchtho6SYoGty',NULL,'192.168.8.44','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiYllpM3BZSFF6YXB4WDRIYXNJU0JsQkNpYmVXMnpRNXN2bEJJc25YVCI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjQ6Imh0dHA6Ly8xOTIuMTY4LjguNDQ6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1791957703),('NLkGZHRf34EUyaCtwFpqr3BiBNwM4b6oCUbIHkSo',NULL,'192.168.8.44','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-PH) WindowsPowerShell/5.1.26100.9444','YTozOntzOjY6Il90b2tlbiI7czo0MDoiQ1ppdmltSVZFUXI1bFhRNnExbGlOMFF5dGFwRjdWNndYeGpFUDJSUSI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjQ6Imh0dHA6Ly8xOTIuMTY4LjguNDQ6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1791957648),('ZbRxv8YzlFmfuXuo5zlDClVRe5snDzo53UrQPFmv',NULL,'192.168.8.44','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36','YTozOntzOjY6Il90b2tlbiI7czo0MDoiWkFPQXpMY3BtRnBwV1JucEdsRllSUlBFYmpmQnJzS1VESTRsTUtsNiI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjQ6Imh0dHA6Ly8xOTIuMTY4LjguNDQ6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==',1791957704);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `employee_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `staff_role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Admission Staff',
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_user_id_unique` (`user_id`),
  UNIQUE KEY `staff_employee_id_unique` (`employee_id`),
  CONSTRAINT `staff_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (2,3,'24-019731','Admission Staff','oseas','jaa','morant','Admission Staff','active','2026-09-21 02:31:45','2026-09-21 02:31:45'),(3,7,'24-019730','Admission Staff','oseas','jaa','morant','Admission Staff','active','2026-09-21 15:27:45','2026-10-18 04:35:43'),(4,8,'24-020442','Admission Staff','dooydoora','y','boot','CEO','active','2026-09-21 15:54:43','2026-09-21 15:54:43');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_permissions`
--

DROP TABLE IF EXISTS `staff_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `staff_id` bigint unsigned NOT NULL,
  `manage_admissions` tinyint(1) NOT NULL DEFAULT '1',
  `verify_documents` tinyint(1) NOT NULL DEFAULT '1',
  `manage_exams` tinyint(1) NOT NULL DEFAULT '0',
  `manage_scholarships` tinyint(1) NOT NULL DEFAULT '0',
  `manage_announcements` tinyint(1) NOT NULL DEFAULT '0',
  `send_notifications` tinyint(1) NOT NULL DEFAULT '0',
  `view_reports` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `review_online_exams` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_permissions_staff_id_unique` (`staff_id`),
  CONSTRAINT `staff_permissions_staff_id_foreign` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_permissions`
--

LOCK TABLES `staff_permissions` WRITE;
/*!40000 ALTER TABLE `staff_permissions` DISABLE KEYS */;
INSERT INTO `staff_permissions` VALUES (2,2,1,1,1,1,1,1,1,'2026-09-21 02:31:45','2026-10-18 04:02:18',0),(3,3,1,1,1,0,0,0,0,'2026-09-21 15:27:45','2026-10-18 04:35:43',0),(4,4,1,1,1,0,1,1,1,'2026-09-21 15:54:43','2026-09-21 16:22:16',0);
/*!40000 ALTER TABLE `staff_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_programs`
--

DROP TABLE IF EXISTS `staff_programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_programs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `staff_id` bigint unsigned NOT NULL,
  `academic_program_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_programs_staff_id_academic_program_id_unique` (`staff_id`,`academic_program_id`),
  KEY `staff_programs_academic_program_id_foreign` (`academic_program_id`),
  CONSTRAINT `staff_programs_academic_program_id_foreign` FOREIGN KEY (`academic_program_id`) REFERENCES `academic_programs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `staff_programs_staff_id_foreign` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_programs`
--

LOCK TABLES `staff_programs` WRITE;
/*!40000 ALTER TABLE `staff_programs` DISABLE KEYS */;
INSERT INTO `staff_programs` VALUES (5,2,6,'2026-09-30 22:27:40','2026-09-30 22:27:40'),(7,2,7,NULL,NULL),(11,2,8,NULL,NULL),(12,2,9,NULL,NULL),(13,2,10,NULL,NULL),(14,2,11,NULL,NULL),(15,2,12,NULL,NULL);
/*!40000 ALTER TABLE `staff_programs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_onboarding_states`
--

DROP TABLE IF EXISTS `user_onboarding_states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_onboarding_states` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `tutorial_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'applicant',
  `tutorial_version` int unsigned NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_started',
  `current_step_id` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'welcome',
  `enrollment_source` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `revision` int unsigned NOT NULL DEFAULT '1',
  `started_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `skipped_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_onboarding_version_unique` (`user_id`,`tutorial_key`,`tutorial_version`),
  CONSTRAINT `user_onboarding_states_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_onboarding_states`
--

LOCK TABLES `user_onboarding_states` WRITE;
/*!40000 ALTER TABLE `user_onboarding_states` DISABLE KEYS */;
INSERT INTO `user_onboarding_states` VALUES (1,5,'applicant',1,'completed','finish','manual',200,'2026-10-19 17:20:50','2026-10-19 17:21:04',NULL,'2026-10-17 14:03:50','2026-10-19 17:21:04'),(2,22,'applicant',1,'completed','finish','new_registration',10,'2026-10-17 14:42:20','2026-10-17 14:42:43',NULL,'2026-10-17 14:42:00','2026-10-17 14:42:43'),(3,19,'applicant',1,'completed','finish','manual',9,'2026-10-19 21:46:46','2026-10-19 21:47:19',NULL,'2026-10-19 21:46:46','2026-10-19 21:47:19'),(4,23,'applicant',1,'completed','finish','new_registration',10,'2026-10-19 22:13:23','2026-10-19 22:13:43',NULL,'2026-10-19 22:12:49','2026-10-19 22:13:43'),(5,28,'applicant',1,'completed','finish','new_registration',10,'2026-10-20 00:42:23','2026-10-20 00:43:05',NULL,'2026-10-20 00:40:52','2026-10-20 00:43:05'),(6,29,'applicant',1,'skipped','programs','new_registration',5,'2026-10-20 05:27:22',NULL,'2026-10-20 05:29:41','2026-10-20 05:19:54','2026-10-20 05:29:41');
/*!40000 ALTER TABLE `user_onboarding_states` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','staff','applicant') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'applicant',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fcm_token` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `profile_photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','adminko202006@gmail.com',NULL,'$2y$12$F8QnX6CgJbl53mY8KYrvpew20ODxS/IKmE6CgLxdIDmy9hqMLCVZa','admin',NULL,NULL,'2026-09-21 02:24:06','2026-10-17 12:42:42','admin_profile_photos/4KAVvQ9kI1EshYmkgExHCzb8egy7huwh5YBCTki9.jpg'),(3,'oseas jaa morant','oseasjamz12@gmail.com',NULL,'$2y$12$HTyWSodXRQ87YnuhmdK5q.6Ya659zmV7mUrqIpm5PAAeokvTRPLXK','staff',NULL,NULL,'2026-09-21 02:31:45','2026-10-19 03:22:20','staff_profile_photos/ubtBNg0iZ8etZLvFgRGGiTEBBiJwpgzpvZ3DYTei.jpg'),(4,'jhayde d lufdy','jhayde@gmail.com',NULL,'$2y$12$3rwrlTfL9wkq4gXuvM7wYOytq1BLGIvWgi1lVBB9cx7fxRGffE29e','applicant',NULL,NULL,'2026-09-21 02:35:38','2026-09-21 02:35:38',NULL),(5,'Archie D. Corre','archiecorre19@gmail.com',NULL,'$2y$12$1wHLCz5ohxRY9mvVNhGjwONisx9Rj2.qwWMA2eC2bYXEKHboT.Qxu','applicant','CsFdy75OiEy21qfiIa4ewvHAaoYzP6DfSWHyNQXzQbEkBcuzZv2L8Z9kWn8w','dlubokcITVO-nlM_6PoklQ:APA91bEuCvaDDAOlaGVGn6_S9I8Jo43ZUZiawPCNbIJvTBt1o6k1-_EjJQ8HWHCL3mW5BEmv_sBPKZAsHA_EzcAmfYb90NuFZrOBc5ssePxaFIMfEEEgCg8','2026-09-21 02:47:43','2026-10-20 00:35:58',NULL),(6,'da adad adad','arcc@gmail.com',NULL,'$2y$12$SbUndP73i9twcUWejSuy0O0F49yb8hXek6.zM0VRG6JgdYWoqDsWW','applicant',NULL,NULL,'2026-09-21 03:02:20','2026-09-21 03:02:20',NULL),(7,'adminko202006@gmail.com','oseasjamzs12@gmail.com',NULL,'$2y$12$HcbO3r5geMq6grPwoJtKsOFyzRvDeN/.lsu80S9MDpwHm.4EGZf82','staff',NULL,NULL,'2026-09-21 15:27:45','2026-09-21 15:27:45',NULL),(8,'arkinss','doydoramarkjun08@gmail.com',NULL,'$2y$12$K3PELCSEaNLjEOdUf7otuOx1yT1RB638A72.Go9nOWoGXl2fP7AOG','staff',NULL,NULL,'2026-09-21 15:54:43','2026-09-21 15:54:43',NULL),(9,'oseasa qq morant','sas@gmail.com',NULL,'$2y$12$vKxnf7rJBNz/FFRIy1E2buSBNGE5kydHnph6oQUmHsrdf6pemOOYW','applicant',NULL,NULL,'2026-09-21 16:08:51','2026-09-21 16:08:51',NULL),(10,'ced jaa cdrdrd','ced@gmail.com',NULL,'$2y$12$rhp8mqke9bP5ZhTZv7w5c.ubL7Dud5EJUq0w/MOWlU2Pvt4zPSMTa','applicant',NULL,NULL,'2026-09-23 08:18:07','2026-09-23 08:18:07',NULL),(11,'Mark D Pits','pits@gmail.com',NULL,'$2y$12$W9tzWPmuh1x2IwZ65RyDFucKvjswzaO7QJDcop5Wq.mlAi8P2akVq','applicant',NULL,NULL,'2026-09-25 02:12:07','2026-09-25 02:12:07',NULL),(12,'rhae Dssj Jsjsj','rhea@gmail.com',NULL,'$2y$12$GdCjDppEFPeWPZcg7laSSe4Utq7DuCwAJWi.aYawR7zSlAQwcLNkG','applicant',NULL,NULL,'2026-10-12 19:23:34','2026-10-12 19:23:34',NULL),(13,'alviz Fjdjd Bhdhd','alviz@gmail.com',NULL,'$2y$12$.cSM844uBOCYztYNDzgVWuyaKh2E7lbiTmDrtV36AK1MQutAGKbOm','applicant',NULL,NULL,'2026-10-12 19:41:48','2026-10-12 19:41:48',NULL),(14,'Seyat Vshsehh Hehehehe','seyat@gmail.com',NULL,'$2y$12$tckGpWHSIsKCIBpcOZo1/ucukhm4RTYdx80BteQtjMT59Tx6tFO36','applicant',NULL,NULL,'2026-10-12 19:58:01','2026-10-12 19:58:01',NULL),(15,'David Caballero','caballero@gmail.com',NULL,'$2y$12$mIPAquGBwQ7Z/sgK7.wNj.6vjuc1YI/iesdWuoufDbGekVuaVT61.','applicant',NULL,NULL,'2026-10-14 15:14:05','2026-10-14 15:14:05',NULL),(16,'Oseas V Jamora','yat@gmail.com',NULL,'$2y$12$n9xQmXIiBBBlN1XCojtzNuZ3EIRZK8bvDLfSwF47APP7YNiN5y29m','applicant',NULL,NULL,'2026-10-14 23:01:16','2026-10-14 23:01:16',NULL),(18,'Workflow Check','wfcheck1792117240@example.test',NULL,'$2y$12$j1hFuGNJb8/fRCOH9z0phO5NF10tSl5eBcvsYHPPj23f5cDO3MZWu','applicant',NULL,NULL,'2026-10-15 18:20:42','2026-10-15 18:20:42',NULL),(19,'sabbabba sss sswsw','aeeee@gmail.com',NULL,'$2y$12$gwBzEVLf4NJC8prIwLdly.wLzWNJm0y9f.GVUZ6iMKk12YKcHcoka','applicant',NULL,NULL,'2026-10-16 11:23:06','2026-10-16 11:23:06',NULL),(22,'Haha Haha Uwuw','anas@gmail.com',NULL,'$2y$12$4ZVXRYExgRxmf7BP1u9Q9.xALCkRg50lJO6aNrEcgoNghyR5qJfim','applicant',NULL,NULL,'2026-10-17 14:42:00','2026-10-17 14:42:00',NULL),(23,'Oseas V Jamora','yasyjams@gmail.com',NULL,'$2y$12$e7/xAX2PIU4PM8lZqg5Z7OYFmtwEm4drs4.cUhI95HoABDNrsxyZe','applicant',NULL,NULL,'2026-10-19 22:12:49','2026-10-20 00:35:58',NULL),(28,'Mark Anthony Wahing Pepito','pepito@gmail.com',NULL,'$2y$12$q6VEXo7SJ7rvTaoZb6wAfe1pR6EwtPmORIwBwda79f8DX79fMxCQ.','applicant',NULL,'dUrI-RZ_QkuDCPYYu1e2xZ:APA91bHOkdsjTntktzdJkpwb1bKMw-_D1m7PK9q9HyGhaPe8KgI3hiKNXY-FCKxvx3VLRDauzA9babnuXTlN3jPXIfQWLqNp6qov1Ql1vyk9gR6bBCednog','2026-10-20 00:40:52','2026-10-20 00:42:08',NULL),(29,'Devid Caballero','caballero018@gmail.com',NULL,'$2y$12$gkiqoXlIuKp3ONIUTjj1su987j/7NxDo2j2S3NLFVJpF5N49HCgJC','applicant',NULL,'fbz9FwH7Q9W2pzx9-YP1_b:APA91bGScAnMU4hQNM4dZKDJ6sYZTd0hN7oeIKtzZfSGSsnBOO2tXwuEcTWF92yvOLmMGJ6xa-z6BhmkEmSd71qMdGIjVq0yCuQpXoE07AQRvaAulaRt9OA','2026-10-20 05:19:54','2026-10-20 05:28:11',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflow_events`
--

DROP TABLE IF EXISTS `workflow_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `subject_type` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_id` bigint unsigned NOT NULL,
  `actor_id` bigint unsigned DEFAULT NULL,
  `action` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_status` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `workflow_events_subject_type_subject_id_index` (`subject_type`,`subject_id`),
  KEY `workflow_events_actor_id_index` (`actor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflow_events`
--

LOCK TABLES `workflow_events` WRITE;
/*!40000 ALTER TABLE `workflow_events` DISABLE KEYS */;
INSERT INTO `workflow_events` VALUES (1,'staff',2,1,'account_permissions_or_assignments_updated',NULL,'active','Account, permission, or program assignment updated.','2026-10-18 04:02:18','2026-10-18 04:02:18'),(2,'staff',3,1,'account_permissions_or_assignments_updated',NULL,'active','Account, permission, or program assignment updated.','2026-10-18 04:35:43','2026-10-18 04:35:43'),(3,'scholarship',11,1,'application_review','pending','approved','GWA: 445\nYear Level: 2nd Year\nAnnual Household Income: Below ₱100,000\nFamily Size: 5 or more dependents\nMotivation Statement: xadssdedvbbhhhgggvvv','2026-10-19 01:22:02','2026-10-19 01:22:02'),(4,'scholarship',10,1,'application_review','pending','approved','GWA: 200\nYear Level: 1st Year\nAnnual Household Income: ₱100,000 – ₱250,000\nFamily Size: 5 or more dependents\nMotivation Statement: walawaiiwwiaiaiwiwiw','2026-10-19 01:23:45','2026-10-19 01:23:45'),(5,'scholarship',12,1,'application_review','pending','approved','GWA: 744\nYear Level: 3rd Year\nAnnual Household Income: Below ₱100,000\nFamily Size: 5 or more dependents\nMotivation Statement: 1222http://localhost:8080/storage/emulated/0/ksweb/tools/phpMyAdminNginxHosts:%20noneOFFON','2026-10-19 01:26:34','2026-10-19 01:26:34'),(6,'scholarship',13,1,'application_review','pending','approved','GWA: 7555\nYear Level: 3rd Year\nAnnual Household Income: Below ₱100,000\nFamily Size: 5 or more dependents\nMotivation Statement: cd C:\\Users\\oseas\\StudioProjects\\edupath_mobile','2026-10-19 01:30:33','2026-10-19 01:30:33'),(7,'admission',19,1,'decision','pending','approved',NULL,'2026-10-19 01:32:48','2026-10-19 01:32:48'),(8,'staff',2,1,'account_permissions_or_assignments_updated',NULL,'active','Account, permission, or program assignment updated.','2026-10-19 03:22:21','2026-10-19 03:22:21'),(9,'scholarship_configuration',17,NULL,'fhe_entrance_rule_correction',NULL,NULL,'User-authorized maintenance: FHE uses the scheduled face-to-face entrance examination. Existing online attempts and their history were preserved.','2026-10-19 16:12:52','2026-10-19 16:12:52'),(10,'scholarship',10,NULL,'fhe_entrance_rule_correction','approved','pending','FHE review pending: a completed, officially released entrance-exam result of at least 40/100 is required before approval or awarding. User-authorized maintenance; no final award or admission decision changed.','2026-10-19 16:12:52','2026-10-19 16:12:52'),(11,'admission',20,1,'decision','pending','approved',NULL,'2026-10-19 22:21:08','2026-10-19 22:21:08'),(12,'scholarship',14,1,'application_review','pending','approved','GWA: 3.00\nYear Level: 3rd Year\nAnnual Household Income: Above ₱500,000\nFamily Size: 5 or more dependents\nMotivation Statement: uwgegegsgsuehwhehsgsbhehegsggsgshshgsyevevshyegegeyegegegeygegeyeyeggeg','2026-10-19 22:25:29','2026-10-19 22:25:29'),(13,'online_exam_settings',1,NULL,'standard_timing_restored','5','60','Project owner explicitly authorized restoration to 60 seconds per question on October 20, 2026. Applied through maintenance tooling; existing attempts retain their original timing.','2026-10-19 23:49:10','2026-10-19 23:49:10'),(14,'scheduled_exam',5,1,'result_released',NULL,'released',NULL,'2026-10-20 00:54:05','2026-10-20 00:54:05'),(15,'scholarship',10,1,'application_review','pending','approved','GWA: 200\nYear Level: 1st Year\nAnnual Household Income: ₱100,000 – ₱250,000\nFamily Size: 5 or more dependents\nMotivation Statement: walawaiiwwiaiaiwiwiw\nFHE review pending: a completed, officially released entrance-exam result of at least 40/100 is required before approval or awarding.','2026-10-20 00:54:53','2026-10-20 00:54:53'),(16,'admission',23,1,'decision','pending','approved',NULL,'2026-10-20 00:59:34','2026-10-20 00:59:34'),(17,'online_exam_settings',1,1,'timing_updated','60','20','New attempts use the updated timing; existing attempts keep their original limit.','2026-10-20 01:01:17','2026-10-20 01:01:17'),(18,'scholarship',16,1,'application_review','pending','approved','GWA: 1.00\nYear Level: 4th Year\nAnnual Household Income: Below ₱100,000\nFamily Size: 3–4 dependents\nMotivation Statement: it helps me to buy tanduay','2026-10-20 01:06:18','2026-10-20 01:06:18'),(19,'scheduled_exam',6,1,'roster_uploaded',NULL,'uploaded','Private PDF roster version: f8kPaUOuJW9H5ZRWdEWUDygsgecnZcWN4WB3uyY3.pdf','2026-10-20 01:15:58','2026-10-20 01:15:58'),(20,'scheduled_exam',6,1,'result_released',NULL,'released',NULL,'2026-10-20 01:18:44','2026-10-20 01:18:44'),(21,'scholarship',17,1,'application_review','pending','approved','GWA: 2.00\nYear Level: 4th Year\nAnnual Household Income: Below ₱100,000\nFamily Size: 3–4 dependents\nMotivation Statement: bshsvvsshvsnabshsvsbsusgdd','2026-10-20 01:22:23','2026-10-20 01:22:23'),(22,'online_exam',9,1,'result_released',NULL,'released',NULL,'2026-10-20 02:10:01','2026-10-20 02:10:01'),(23,'admission',24,1,'decision','pending','approved',NULL,'2026-10-20 05:41:13','2026-10-20 05:41:13'),(24,'scheduled_exam',7,1,'roster_uploaded',NULL,'uploaded','Private PDF roster version: m0wgsn3zkm5T9oIbB1q9V3XIU3i3CAlJwojl5IGr.pdf','2026-10-20 06:13:21','2026-10-20 06:13:21'),(25,'scheduled_exam',7,1,'result_released',NULL,'released',NULL,'2026-10-20 06:18:34','2026-10-20 06:18:34'),(26,'scholarship',19,1,'application_review','pending','under_review','GWA: 10\nYear Level: 1st Year\nAnnual Household Income: ₱100,000 – ₱250,000\nFamily Size: 3–4 dependents\nMotivation Statement: gahmavsmsnzhamq.ahansbsbsbkzyzjsmsjsksnsn','2026-10-20 06:37:47','2026-10-20 06:37:47'),(27,'online_exam_settings',1,1,'timing_updated','20','16','New attempts use the updated timing; existing attempts keep their original limit.','2026-10-20 06:38:50','2026-10-20 06:38:50'),(28,'scholarship',19,1,'application_review','under_review','approved','GWA: 10\nYear Level: 1st Year\nAnnual Household Income: ₱100,000 – ₱250,000\nFamily Size: 3–4 dependents\nMotivation Statement: gahmavsmsnzhamq.ahansbsbsbkzyzjsmsjsksnsn','2026-10-20 06:39:49','2026-10-20 06:39:49'),(29,'scholarship',18,1,'application_review','pending','approved','GWA: 10\nYear Level: 3rd Year\nAnnual Household Income: ₱100,000 – ₱250,000\nFamily Size: 3–4 dependents\nMotivation Statement: gahmavsmsnzhamq.ahansbsbsbkzyzjsmsjsksnsn','2026-10-20 06:41:51','2026-10-20 06:41:51');
/*!40000 ALTER TABLE `workflow_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'edupath'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-21  1:53:34
