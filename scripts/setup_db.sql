-- T05: shorts100 전용 데이터베이스 및 사용자 생성
CREATE USER shorts WITH PASSWORD 'shorts';
CREATE DATABASE shorts100 OWNER shorts;
GRANT ALL PRIVILEGES ON DATABASE shorts100 TO shorts;
ALTER DATABASE shorts100 SET TIME ZONE 'Asia/Seoul';