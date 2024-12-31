const mongoose = require('mongoose');
const dotenv = require('dotenv');

// LISTENING TO SYNC CODE BUGS
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 🔴 SHUTTING DOWN');
  console.log(err.name, err.message);
  // shutdown server first
  process.exit(1);
});

// read variable from the file and save them into node JS env variable
dotenv.config({ path: './config.env' });
const app = require('./app');

// process.env available in every single file in the project
// console.log(process.env);

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// Database and options
// return promise: parse connection obj
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => console.log('DB connection successful!'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// LISTENING TO ASYNC CODE REJECT
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLER REJECTION! 🔴 SHUTTING DOWN');
  console.log(err.name, err.message);
  // shutdown server first
  server.close(() => {
    process.exit(1);
  });
});