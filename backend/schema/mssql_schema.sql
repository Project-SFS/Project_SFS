-- SQL Server schema. Every statement is idempotent: it runs on each backend start (database/migrate.js)
-- and only creates what is missing, so it is safe against an existing production database.
-- Statements are separated by GO lines.

IF OBJECT_ID(N'dbo.SolveForSakthi_Users', N'U') IS NULL
CREATE TABLE SolveForSakthi_Users (
    ID INT NOT NULL PRIMARY KEY IDENTITY(1,1),
    EMAIL VARCHAR(256) UNIQUE NULL,
    PASSWORD VARCHAR(256) NULL,
    ROLE VARCHAR(10) NULL,
    COLLEGE VARCHAR(100) NULL,
    COLLEGE_CODE VARCHAR(50) UNIQUE NULL,
    STATUS VARCHAR(10) NULL DEFAULT 'PENDING',
    NAME VARCHAR(256) NULL,
    PHONE VARCHAR(20) NULL,
    DATE VARCHAR(20) NULL
)
GO

IF OBJECT_ID(N'dbo.SolveForSakthi_Problems', N'U') IS NULL
CREATE TABLE SolveForSakthi_Problems (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TITLE VARCHAR(100),
    DESCRIPTION TEXT,
    SUB_DEADLINE DATE,
    CATEGORY VARCHAR(50),
    DEPT VARCHAR(50),
    Reference VARCHAR(256),
    Evaluator_ID INT
)
GO

IF OBJECT_ID(N'dbo.SolveForSakthi_Submissions', N'U') IS NULL
CREATE TABLE SolveForSakthi_Submissions (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    PROBLEM_ID INT,
    TEAM_ID INT,
    TEAM_EMAIL VARCHAR(100),
    SOL_TITLE VARCHAR(100),
    SOL_DESCRIPTION TEXT,
    SUB_DATE DATE,
    STATUS VARCHAR(20) DEFAULT 'PENDING',
    SOL_LINK VARCHAR(256),
    FILES VARCHAR(256),
    MARK INT,
    CP_MARK INT,
    PS_MARK INT,
    BV_MARK INT,
    FP_MARK INT,
    IN_MARK INT
)
GO

IF OBJECT_ID(N'dbo.SolveForSakthi_Team_List', N'U') IS NULL
CREATE TABLE SolveForSakthi_Team_List (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    NAME VARCHAR(50),
    SPOC_ID INT,
    LEAD_EMAIL VARCHAR(50),
    LEAD_PHONE VARCHAR(50),
    MENTOR_NAME VARCHAR(50),
    MENTOR_EMAIL VARCHAR(50)
)
GO

IF OBJECT_ID(N'dbo.SolveForSakthi_Team_Members_List', N'U') IS NULL
CREATE TABLE SolveForSakthi_Team_Members_List (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    NAME VARCHAR(50),
    SPOC_ID INT,
    EMAIL VARCHAR(100),
    PHONE VARCHAR(20),
    GENDER VARCHAR(10),
    ROLE VARCHAR(20),
    Team_ID INT
)
GO

-- Columns the application uses that the original schema did not have
IF COL_LENGTH(N'dbo.SolveForSakthi_Users', N'PHONE') IS NULL
    ALTER TABLE SolveForSakthi_Users ADD PHONE VARCHAR(20) NULL
GO

IF COL_LENGTH(N'dbo.SolveForSakthi_Submissions', N'TEAM_ID') IS NULL
    ALTER TABLE SolveForSakthi_Submissions ADD TEAM_ID INT NULL
GO

-- Problem statements per team. A team requests a problem (REQUESTED); its SPOC approves (ASSIGNED)
-- or rejects (REJECTED) it, or assigns one directly. A team can only submit to ASSIGNED problems.
IF OBJECT_ID(N'dbo.SolveForSakthi_Team_Problems', N'U') IS NULL
CREATE TABLE SolveForSakthi_Team_Problems (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TEAM_ID INT NOT NULL,
    PROBLEM_ID INT NOT NULL,
    STATUS VARCHAR(20) NOT NULL CONSTRAINT DF_SolveForSakthi_Team_Problems_STATUS DEFAULT 'ASSIGNED',
    REQUESTED_DATE VARCHAR(20) NULL,
    ASSIGNED_BY INT NULL,
    ASSIGNED_DATE VARCHAR(20) NULL,
    CONSTRAINT UQ_SolveForSakthi_Team_Problems UNIQUE (TEAM_ID, PROBLEM_ID)
)
GO

IF COL_LENGTH(N'dbo.SolveForSakthi_Team_Problems', N'STATUS') IS NULL
    ALTER TABLE SolveForSakthi_Team_Problems ADD STATUS VARCHAR(20) NOT NULL
        CONSTRAINT DF_SolveForSakthi_Team_Problems_STATUS DEFAULT 'ASSIGNED'
GO

IF COL_LENGTH(N'dbo.SolveForSakthi_Team_Problems', N'REQUESTED_DATE') IS NULL
    ALTER TABLE SolveForSakthi_Team_Problems ADD REQUESTED_DATE VARCHAR(20) NULL
GO

-- Who created each problem statement and when (rows from before this was tracked stay NULL)
IF COL_LENGTH(N'dbo.SolveForSakthi_Problems', N'CREATED_BY') IS NULL
    ALTER TABLE SolveForSakthi_Problems ADD CREATED_BY INT NULL
GO

IF COL_LENGTH(N'dbo.SolveForSakthi_Problems', N'CREATED_AT') IS NULL
    ALTER TABLE SolveForSakthi_Problems ADD CREATED_AT DATETIME2 NULL
GO

-- Which admin last evaluated each submission and when
IF COL_LENGTH(N'dbo.SolveForSakthi_Submissions', N'EVALUATED_BY') IS NULL
    ALTER TABLE SolveForSakthi_Submissions ADD EVALUATED_BY INT NULL
GO

IF COL_LENGTH(N'dbo.SolveForSakthi_Submissions', N'EVALUATED_AT') IS NULL
    ALTER TABLE SolveForSakthi_Submissions ADD EVALUATED_AT DATETIME2 NULL
GO

-- When each team was registered (teams from before this was tracked stay NULL)
IF COL_LENGTH(N'dbo.SolveForSakthi_Team_List', N'CREATED_AT') IS NULL
    ALTER TABLE SolveForSakthi_Team_List ADD CREATED_AT DATETIME2 NULL
GO

-- Problem statement template fields (also filled by the Excel import)
IF COL_LENGTH(N'dbo.SolveForSakthi_Problems', N'DOMAIN') IS NULL
    ALTER TABLE SolveForSakthi_Problems ADD DOMAIN NVARCHAR(200) NULL
GO

IF COL_LENGTH(N'dbo.SolveForSakthi_Problems', N'EXPECTED_OUTCOMES') IS NULL
    ALTER TABLE SolveForSakthi_Problems ADD EXPECTED_OUTCOMES NVARCHAR(MAX) NULL
GO

IF COL_LENGTH(N'dbo.SolveForSakthi_Problems', N'REQUIREMENTS') IS NULL
    ALTER TABLE SolveForSakthi_Problems ADD REQUIREMENTS NVARCHAR(MAX) NULL
GO

IF COL_LENGTH(N'dbo.SolveForSakthi_Problems', N'TECHNOLOGY') IS NULL
    ALTER TABLE SolveForSakthi_Problems ADD TECHNOLOGY NVARCHAR(500) NULL
GO

-- link to an optional supporting document (the template's "Upload Document" column)
IF COL_LENGTH(N'dbo.SolveForSakthi_Problems', N'DOCUMENT_LINK') IS NULL
    ALTER TABLE SolveForSakthi_Problems ADD DOCUMENT_LINK NVARCHAR(1000) NULL
GO

-- titles from the template can be longer than the original 100 characters, and imported text may
-- contain characters outside the Western code page (₹, curly quotes, Tamil...), so both are Unicode
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = N'SolveForSakthi_Problems'
               AND COLUMN_NAME = N'TITLE' AND DATA_TYPE = N'nvarchar' AND CHARACTER_MAXIMUM_LENGTH >= 300)
    ALTER TABLE SolveForSakthi_Problems ALTER COLUMN TITLE NVARCHAR(300) NULL
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = N'SolveForSakthi_Problems'
           AND COLUMN_NAME = N'DESCRIPTION' AND DATA_TYPE = N'text')
    ALTER TABLE SolveForSakthi_Problems ALTER COLUMN DESCRIPTION NVARCHAR(MAX) NULL
GO

-- Evaluation is a decision plus a comment (no marks): PENDING -> CHANGES_REQUESTED / APPROVED / REJECTED.
-- The latest comment is kept on the submission; every decision is kept in the reviews table.
IF COL_LENGTH(N'dbo.SolveForSakthi_Submissions', N'EVALUATION_COMMENT') IS NULL
    ALTER TABLE SolveForSakthi_Submissions ADD EVALUATION_COMMENT NVARCHAR(MAX) NULL
GO

IF OBJECT_ID(N'dbo.SolveForSakthi_Submission_Reviews', N'U') IS NULL
CREATE TABLE SolveForSakthi_Submission_Reviews (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    SUBMISSION_ID INT NOT NULL,
    DECISION VARCHAR(20) NOT NULL,
    COMMENT NVARCHAR(MAX) NULL,
    REVIEWED_BY INT NULL,
    REVIEWED_AT DATETIME2 NOT NULL
)
GO

-- results from the marks era: ACCEPTED is now APPROVED
UPDATE SolveForSakthi_Submissions SET STATUS = 'APPROVED' WHERE STATUS = 'ACCEPTED'
GO

-- Graduation: every member has a graduation year; the team's year is the highest of them. After that
-- year ends the team is archived (GRADUATED_AT): hidden from its SPOC, login closed, records kept.
IF COL_LENGTH(N'dbo.SolveForSakthi_Team_Members_List', N'GRAD_YEAR') IS NULL
    ALTER TABLE SolveForSakthi_Team_Members_List ADD GRAD_YEAR INT NULL
GO

IF COL_LENGTH(N'dbo.SolveForSakthi_Team_List', N'GRADUATED_AT') IS NULL
    ALTER TABLE SolveForSakthi_Team_List ADD GRADUATED_AT DATETIME2 NULL
GO

IF COL_LENGTH(N'dbo.SolveForSakthi_Team_List', N'GRADUATION_YEAR') IS NULL
    ALTER TABLE SolveForSakthi_Team_List ADD GRADUATION_YEAR INT NULL
GO

-- Every email the platform sends, for the admin's communication history. Mails with passwords or
-- verification codes are logged without their text.
IF OBJECT_ID(N'dbo.SolveForSakthi_Mail_Log', N'U') IS NULL
CREATE TABLE SolveForSakthi_Mail_Log (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TO_ADDR NVARCHAR(1000) NULL,
    CC_ADDR NVARCHAR(1000) NULL,
    SUBJECT NVARCHAR(500) NULL,
    BODY_TEXT NVARCHAR(MAX) NULL,
    STATUS VARCHAR(10) NOT NULL,
    ERROR NVARCHAR(500) NULL,
    SENT_AT DATETIME2 NOT NULL
)
GO

-- When the password was last changed by an admin / SPOC; logins issued before it stop working
IF COL_LENGTH(N'dbo.SolveForSakthi_Users', N'PASSWORD_CHANGED_AT') IS NULL
    ALTER TABLE SolveForSakthi_Users ADD PASSWORD_CHANGED_AT DATETIME2 NULL
GO

-- Evaluation marks (5 criteria x 20 = 100), given with a review decision. The latest marks are kept on the
-- submission, each review keeps its own. (The older CP/PS/BV/FP/IN marks used other criteria and are not used.)
IF COL_LENGTH(N'dbo.SolveForSakthi_Submissions', N'EVAL_TOTAL') IS NULL
    ALTER TABLE SolveForSakthi_Submissions ADD
        EVAL_UNDERSTANDING INT NULL, EVAL_SOLUTION INT NULL, EVAL_TOOLS INT NULL,
        EVAL_PRESENTATION INT NULL, EVAL_ACCEPTANCE INT NULL, EVAL_TOTAL INT NULL
GO

IF COL_LENGTH(N'dbo.SolveForSakthi_Submission_Reviews', N'EVAL_TOTAL') IS NULL
    ALTER TABLE SolveForSakthi_Submission_Reviews ADD
        EVAL_UNDERSTANDING INT NULL, EVAL_SOLUTION INT NULL, EVAL_TOOLS INT NULL,
        EVAL_PRESENTATION INT NULL, EVAL_ACCEPTANCE INT NULL, EVAL_TOTAL INT NULL
GO

-- Deadline reminders already sent (one per team, problem and deadline; a new deadline gets a new reminder)
IF OBJECT_ID(N'dbo.SolveForSakthi_Deadline_Reminders', N'U') IS NULL
CREATE TABLE SolveForSakthi_Deadline_Reminders (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TEAM_ID INT NOT NULL,
    PROBLEM_ID INT NOT NULL,
    DEADLINE DATE NOT NULL,
    SENT_AT DATETIME2 NOT NULL,
    CONSTRAINT UQ_SolveForSakthi_Deadline_Reminders UNIQUE (TEAM_ID, PROBLEM_ID, DEADLINE)
)
GO

-- Admin permissions. The main admin (IS_SUPER_ADMIN = 1, the first admin) has everything, cannot be deleted
-- and is the only one who manages other admins. Other admins get any of: PROBLEMS, EVALUATE, USERS.
IF COL_LENGTH(N'dbo.SolveForSakthi_Users', N'IS_SUPER_ADMIN') IS NULL
    ALTER TABLE SolveForSakthi_Users ADD IS_SUPER_ADMIN BIT NOT NULL CONSTRAINT DF_SolveForSakthi_Users_IS_SUPER_ADMIN DEFAULT 0
GO

IF COL_LENGTH(N'dbo.SolveForSakthi_Users', N'ADMIN_PERMISSIONS') IS NULL
    ALTER TABLE SolveForSakthi_Users ADD ADMIN_PERMISSIONS VARCHAR(200) NULL
GO

-- admins from before permissions existed keep full access
UPDATE SolveForSakthi_Users SET ADMIN_PERMISSIONS = 'PROBLEMS,EVALUATE,USERS' WHERE ROLE = 'ADMIN' AND ADMIN_PERMISSIONS IS NULL
GO
