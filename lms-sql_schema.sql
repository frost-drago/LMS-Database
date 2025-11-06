CREATE DATABASE IF NOT EXISTS lms
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE lms;

CREATE TABLE IF NOT EXISTS course (
	course_code CHAR(11), -- already PK
    course_name VARCHAR(255) NOT NULL,
    credit TINYINT UNSIGNED NOT NULL, -- credits cannot be negative
    course_description VARCHAR(1000),
    PRIMARY KEY (course_code)
);

CREATE TABLE IF NOT EXISTS person (
	person_id BIGINT AUTO_INCREMENT, -- already PK
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    PRIMARY KEY (person_id)
);

CREATE TABLE IF NOT EXISTS student (
	person_id BIGINT, -- already PK, also FK
    student_id CHAR(10) NOT NULL UNIQUE,
    cohort CHAR(3),
    PRIMARY KEY (person_id),
    FOREIGN KEY (person_id) REFERENCES person (person_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS instructor (
	person_id BIGINT, -- already PK, also FK
    instructor_id CHAR(5) NOT NULL UNIQUE,
	PRIMARY KEY (person_id),
    FOREIGN KEY (person_id) REFERENCES person (person_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS term (
	term_id SMALLINT AUTO_INCREMENT, -- already PK
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    term_label VARCHAR(20) NOT NULL UNIQUE,
    PRIMARY KEY (term_id),
    
    -- check if end date comes after start date
    CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS class_offering (
	class_offering_id INT AUTO_INCREMENT, -- already PK
    course_code CHAR(11) NOT NULL,
    term_id SMALLINT NOT NULL,
    class_group CHAR(4) NOT NULL,
    class_type ENUM('LEC', 'LAB', 'TUT') NOT NULL,
    PRIMARY KEY (class_offering_id),
    FOREIGN KEY (course_code) REFERENCES course (course_code) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (term_id) REFERENCES term (term_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- class offering should be unique per (course_code, term_id, class_group, class_type).
    CONSTRAINT unique_class_offering UNIQUE(course_code, term_id, class_group, class_type)
);

CREATE TABLE IF NOT EXISTS teaching_assignment (
	instructor_id CHAR(5), -- PK and FK
    class_offering_id INT, -- PK and FK
    teaching_role ENUM('Lecturer','TA','Tutor','Grader') NOT NULL DEFAULT 'Lecturer',
    PRIMARY KEY (instructor_id, class_offering_id),
    FOREIGN KEY (instructor_id) REFERENCES instructor (instructor_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (class_offering_id) REFERENCES class_offering (class_offering_id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS class_session (
	session_id BIGINT AUTO_INCREMENT, -- already PK
    class_offering_id INT NOT NULL,
    session_no SMALLINT UNSIGNED NOT NULL, -- session number cannot be negative
    session_start_date DATETIME NOT NULL,
    session_end_date DATETIME NOT NULL,
    title VARCHAR(100),
    room VARCHAR(10),
    PRIMARY KEY (session_id),
    FOREIGN KEY (class_offering_id) REFERENCES class_offering (class_offering_id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- cannot have more than of the same session number per class offering.
    CONSTRAINT unique_session UNIQUE(class_offering_id, session_no),
    
    -- check if end date comes after start date
    CHECK (session_end_date > session_start_date)
);

-- who is in which class.
CREATE TABLE IF NOT EXISTS enrolment (
	enrolment_id BIGINT AUTO_INCREMENT, -- already PK
    class_offering_id INT NOT NULL,
    student_id CHAR(10) NOT NULL,
    enrolment_status ENUM('Active', 'Inactive') DEFAULT 'Active',
    enroled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (enrolment_id),
    FOREIGN KEY (class_offering_id) REFERENCES class_offering (class_offering_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (student_id) REFERENCES student (student_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- a student cannot enrol more than one time for a class.
    CONSTRAINT unique_enrolment UNIQUE(student_id, class_offering_id)
);

-- our lecturer told us to reduce the number of tables so we have this combined table now.
-- pretend that every session must have an attendance and grading on the spot.
CREATE TABLE IF NOT EXISTS grades_and_attendance (
	record_id BIGINT AUTO_INCREMENT, -- already PK
    enrolment_id BIGINT NOT NULL,
    session_id BIGINT NOT NULL,
    assessment_type VARCHAR(50) NOT NULL,
    score TINYINT UNSIGNED NOT NULL, -- on the assumption that grades are not floats
    weight TINYINT UNSIGNED NOT NULL, -- on the assumption that weights are not floats
    attendance_status ENUM('Verified','Pending','Not attended') NOT NULL default 'Not attended',
    FOREIGN KEY (enrolment_id) REFERENCES enrolment (enrolment_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (session_id) REFERENCES class_session (session_id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- person must be unique per session, no duplicates
    CONSTRAINT unique_grades_and_attendance UNIQUE(enrolment_id, session_id),
    
    -- 0 <= score <= 100; 0 <= weight <= 100
    CHECK (score >= 0 AND 100 >= score AND weight >= 0 AND 100 >= weight)
);

-- Supporting indexes (InnoDB auto-creates for FKs, but named indexes aid readability/EXPLAIN)
CREATE INDEX idx_enrolment_offering ON enrolment (class_offering_id);
CREATE INDEX idx_enrolment_student  ON enrolment (student_id);
CREATE INDEX idx_session_offering   ON class_session (class_offering_id);
CREATE INDEX idx_ga_enrolment       ON grades_and_attendance (enrolment_id);
CREATE INDEX idx_ga_session         ON grades_and_attendance (session_id);