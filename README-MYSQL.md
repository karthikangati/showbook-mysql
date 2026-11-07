# ShowBook MySQL

A full-stack movie-booking application using React, Express, JWT authentication, and MySQL.

## Production deployment

1. Deploy this folder to Railway.
2. Add a Railway MySQL database to the same project.
3. Connect the application service to the MySQL service so `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, and `MYSQLDATABASE` are available.
4. Add `JWT_SECRET` with a long random value.
5. Railway will build with the Dockerfile and run the Express server.

## Local development with Docker unavailable

Install MySQL, create an empty database named `showbook`, copy `.env.example` to `.env`, and run:

```sh
npm run build
npm start
```

The server automatically creates the tables and demo movie data.