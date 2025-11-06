USE lms;

INSERT INTO course (course_code, course_name, credit, course_description) VALUES 
	('COMP6799001', 'Database Technology', 2, 'This course was designed to teach the fundamentals of SQL databases.'),
    ('ENGL6172001', 'Academic English II', 3, 'This is the continuation of academic english I.'),
    ('COMP6049001', 'Algorithm Design and Analysis', 4, 'This course teaches how to calculate theoretical runtime.'),
    ('STAT617001', 'Basic Statistics', 2, 'This course was designed to teach students how to do statistics.');
    
INSERT INTO person (person_id, full_name, email) VALUES
	(1, 'Zuri Dawson', 'zdawson@university.id'),
    (2, 'Iker Terry', 'iterry@university.id'),
    (3, 'Wren Rowe', 'wrowe@university.id'),
    (4, 'Kamden Norris', 'knorris@university.id'),
    (5, 'Arielle Summers', 'asummers@university.id'),
    (6, 'Darius Chandler', 'dchandler@university.id'),
    (7, 'Viviana Kent', 'vkent@university.id');
    
INSERT INTO student (person_id, student_id, cohort) VALUES
	(1, 'U280010001', 'U28'),
    (2, 'U280010002', 'U28'),
    (3, 'U280010003', 'U28'),
    (4, 'U270010004', 'U27'),
    (5, 'U270010005', 'U27');
    
INSERT INTO instructor (person_id, instructor_id) VALUES
	(5, 'A1001'),
    (6, 'B1002'),
    (7, 'C1003');
    
INSERT INTO term (start_date, end_date, term_label) VALUES
	('2025-09-08 00:00:01', '2026-01-21 00:00:01', 'Odd 2025'),
    ('2026-02-01 00:00:01', '2026-08-05 00:00:01', 'Even 2026');
    
INSERT INTO class_offering (course_code, term_id, class_group, class_type) VALUES
	('COMP6799001', 1, 'B3AC', 'LAB'),
    ('COMP6799001', 1, 'B3BC', 'LAB'),
    ('COMP6799001', 1, 'B3CC', 'LAB'),
    ('ENGL6172001', 1, 'L3AC', 'LEC'),
    ('ENGL6172001', 1, 'L3BC', 'LEC'),
    ('ENGL6172001', 1, 'L3CC', 'LEC');
    
INSERT INTO teaching_assignment (instructor_id, class_offering_id, teaching_role) VALUES
	('A1001', 1, 'TA'),
    ('B1002', 1, 'Lecturer');
    
INSERT INTO class_session (class_offering_id, session_no, session_start_date, session_end_date, title, room) VALUES
	(1, 1, '2025-09-10 17:00:00', '2025-09-10 18:40:00', 'Introduction to Databases and DBMS', 'FX609'),
    (1, 2, '2025-09-17 17:00:00', '2025-09-17 18:40:00', 'Database Design; Data Modeling using Entity-Relationship (ER) Model', 'FX609'),
    (1, 3, '2025-09-24 17:00:00', '2025-09-24 18:40:00', 'Enhance ER (EER); Logical design: Mapping ER/EER to Relational Schema', 'FX609'),
    (1, 4, '2025-09-17 17:00:00', '2025-09-17 18:40:00', 'Normalization', 'FX609');
    
INSERT INTO enrolment (class_offering_id, student_id, enrolment_status, enroled_at) VALUES 
	(1, 'U280010001', 'Active', '2025-09-01 13:00:00'),
    (4, 'U280010001', 'Active', '2025-09-01 13:00:00'),
    (1, 'U280010002', 'Active', '2025-09-01 13:00:00'),
    (4, 'U280010002', 'Active', '2025-09-01 13:00:00');