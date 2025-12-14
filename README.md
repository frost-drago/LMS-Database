## Note
- **Frontend**: Uses React
- **Backend**: Uses Express

## How to use
- set up database in MySQL using `lms-sql_schema.sql`.
- (optional and under work) load data into the tables using `lms-sql_data`.
- go to `server/.env` and change password to your SQL password.
- go to your environment variables and add `C:\Program Files\MySQL\MySQL Server 8.0\bin` to your PATH.
### Backend server
- go to `server` folder and in the terminal run `npm install`
- start the server using `node index.js`
### Frontend server (only run after backend server runs)
- go to `client` folder and in the terminal run `npm install`
- start the server using `npm start`
- go to localhost:3000
