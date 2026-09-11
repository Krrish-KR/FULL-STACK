@echo off
set "JAVA_HOME=C:\Java\jdk-17.0.8.1+1"
set "PATH=C:\Java\jdk-17.0.8.1+1\bin;C:\Maven\apache-maven-3.9.5\bin;%PATH%"
cd /d "%~dp0"
call "C:\Maven\apache-maven-3.9.5\bin\mvn.cmd" spring-boot:run
