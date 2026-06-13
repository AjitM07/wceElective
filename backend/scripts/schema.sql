CREATE DATABASE IF NOT EXISTS wce_elective
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE wce_elective;

CREATE TABLE IF NOT EXISTS students (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  first_name    VARCHAR(50)  NOT NULL,
  prn           VARCHAR(20)  NOT NULL UNIQUE,
  division      VARCHAR(10)  NOT NULL DEFAULT 'A',
  details_verified BOOLEAN   DEFAULT FALSE,
  email         VARCHAR(120) NOT NULL UNIQUE,
  phone         VARCHAR(15),
  cgpa          DECIMAL(4,2),
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('student') DEFAULT 'student',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coordinators (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  department    VARCHAR(50)  DEFAULT 'CSE',
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('coordinator') DEFAULT 'coordinator',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS electives (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL UNIQUE,
  code          VARCHAR(20),
  description   TEXT,
  capacity      INT DEFAULT 40,
  academic_year VARCHAR(20) DEFAULT '2025-26',
  semester      VARCHAR(10) DEFAULT 'SEM-VI',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS elective_preferences (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  student_id      INT NOT NULL,
  elective_id     INT NOT NULL,
  preference_rank TINYINT NOT NULL CHECK (preference_rank IN (1, 2, 3)),
  reason          TEXT,
  submitted_at    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)  REFERENCES students(id)  ON DELETE CASCADE,
  FOREIGN KEY (elective_id) REFERENCES electives(id) ON DELETE CASCADE,
  UNIQUE KEY uq_student_pref (student_id, preference_rank)
);

CREATE TABLE IF NOT EXISTS elective_allocations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  student_id    INT NOT NULL UNIQUE,
  elective_id   INT NOT NULL,
  allocated_by  INT,
  allocated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)   REFERENCES students(id)     ON DELETE CASCADE,
  FOREIGN KEY (elective_id)  REFERENCES electives(id)    ON DELETE CASCADE,
  FOREIGN KEY (allocated_by) REFERENCES coordinators(id) ON DELETE SET NULL
);

CREATE INDEX idx_students_email  ON students(email);
CREATE INDEX idx_students_prn    ON students(prn);
CREATE INDEX idx_coord_email     ON coordinators(email);
CREATE INDEX idx_pref_student    ON elective_preferences(student_id);
CREATE INDEX idx_alloc_elective  ON elective_allocations(elective_id);

CREATE TABLE IF NOT EXISTS portal_settings (
  name          VARCHAR(50) PRIMARY KEY,
  is_accessible BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);