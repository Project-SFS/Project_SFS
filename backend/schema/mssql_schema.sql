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
