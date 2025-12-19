DROP DATABASE IF EXISTS lms;

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
    PRIMARY KEY (person_id),
    
    -- check for email validity. needs at least a character before @, after @, after ".".
	CHECK (email LIKE '%_@_%._%')
);

CREATE TABLE IF NOT EXISTS student (
	person_id BIGINT, -- already PK, also FK
    student_id CHAR(10) NOT NULL UNIQUE,
    cohort CHAR(3),
    PRIMARY KEY (person_id),
    FOREIGN KEY (person_id) REFERENCES person (person_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- for quick sorting when needed.
CREATE INDEX index_student_student_id ON student (student_id);


CREATE TABLE IF NOT EXISTS instructor (
	person_id BIGINT, -- already PK, also FK
    instructor_id CHAR(5) NOT NULL UNIQUE,
	PRIMARY KEY (person_id),
    FOREIGN KEY (person_id) REFERENCES person (person_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- for quick sorting when needed.
CREATE INDEX index_instructor_instructor_id ON instructor (instructor_id);


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

-- for quick sorting when needed.
CREATE INDEX index_enrolment_offering ON enrolment (class_offering_id);

CREATE TABLE IF NOT EXISTS attendance (
	attendance_id BIGINT AUTO_INCREMENT, -- already PK
    enrolment_id BIGINT NOT NULL,
    session_id BIGINT NOT NULL,
    attendance_status ENUM('Verified','Pending','Not attended') NOT NULL default 'Not attended',
    PRIMARY KEY (attendance_id),
    FOREIGN KEY (enrolment_id) REFERENCES enrolment (enrolment_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (session_id) REFERENCES class_session (session_id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- person must be unique per session, no duplicates
    CONSTRAINT unique_attendance UNIQUE(enrolment_id, session_id)
);

CREATE TABLE IF NOT EXISTS assessment_type (
	assessment_id INT AUTO_INCREMENT,
    course_code CHAR(11),
    assessment_type VARCHAR(50) NOT NULL,
    weight TINYINT UNSIGNED NOT NULL, -- on the assumption that weights are not floats
    
    PRIMARY KEY (assessment_id),
    FOREIGN KEY (course_code) REFERENCES course (course_code) ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- type of assessment must be unique per course, no duplicates
    CONSTRAINT unique_asessment UNIQUE(course_code, assessment_type),
    
    -- 0 <= weight <= 100
    CHECK (weight >= 0 AND 100 >= weight)
);

CREATE TABLE IF NOT EXISTS grade (
	grade_id BIGINT AUTO_INCREMENT,
    enrolment_id BIGINT NOT NULL,
	score TINYINT UNSIGNED NOT NULL, -- on the assumption that grades are not floats
    assessment_id INT,
    
    PRIMARY KEY (grade_id),
    FOREIGN KEY (enrolment_id) REFERENCES enrolment (enrolment_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (assessment_id) REFERENCES assessment_type (assessment_id) ON DELETE CASCADE ON UPDATE CASCADE,
	
    -- no duplicate assessment
    CONSTRAINT unique_grade_per_assessment UNIQUE (enrolment_id, assessment_id),
    
    -- 0 <= score <= 100
    CHECK (score >= 0 AND 100 >= score)
);

-- Views
-- CREATE VIEW view_student_grades_and_attendance AS
-- SELECT p.full_name, ga.session_id, ga.assessment_type, ga.score, ga.weight, ga.attendance_status
-- FROM grades_and_attendance ga
-- JOIN enrolment e ON ga.enrolment_id = e.enrolment_id
-- JOIN student s ON s.student_id = e.student_id
-- JOIN person p ON p.person_id = s.person_id;

-- indexes to speed up the view
-- CREATE INDEX index_ga_enrolment_id ON grades_and_attendance (enrolment_id);
-- CREATE INDEX index_ga_session_id ON grades_and_attendance (session_id);
-- CREATE INDEX index_enrolment_student_id ON enrolment (student_id);
-- CREATE INDEX index_student_student_id ON student (student_id);
-- CREATE INDEX index_student_person_id ON student (person_id);


