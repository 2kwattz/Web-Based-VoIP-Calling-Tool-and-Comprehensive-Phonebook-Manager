  const validator = require('validator'); //Validator
  const express = require('express'); // Express Framework
  const app = express(); // Instance of Express
  const path = require('path'); // Defines Static Path and Templates
  const port = 3000; // Port Number
  const cheerio = require('cheerio'); //CSS Selector Control
  const dotenv = require('dotenv').config(); // DotEnv Enviorment for security
  const csv = require('fast-csv'); // Importing CSV in MySQL
  const axios = require("axios"); // Http Request Maker
  const hbs = require('hbs'); // Template Engine
  const fs = require('fs'); // File System Lib
  const pdf = require('html-pdf'); // For Database pdf download
  const excel = require('exceljs'); // For Database Excel downloads
  const bodyParser = require('body-parser'); // For Parsing forms
  const nodemailer = require('nodemailer'); // For Verification OTP
  const jwt = require('jsonwebtoken'); // User Authentication for Chat Application 
  const fsPromises = require('fs').promises; // To Prevent Event loop from triggering server restart in chat
  const cookieParser = require('cookie-parser');

  const chokidar = require('chokidar'); // To Moniter File changes in realtime

  app.use(cookieParser());

  // const onvif = require('node-onvif');
  // For IPC A22EP Cameras Video Streaming 

  // Video Camera Configurations

  // IPC A22EP -A Object

  // let device = new onvif.OnvifDevice({
  //   xaddr: 'http://192.168.x.x/onvif/device_service',
  //   user : 'admin',
  //   pass : 'XXX'
  // });

  const crypto = require('crypto');
  const socketsConnected = new Set()

  // Generate a random nonce value for each request
  // Middleware to generate a random nonce for each request
  app.use((req, res, next) => {
    const nonce = crypto.randomBytes(16).toString('base64');
    res.locals.nonce = nonce;
    next();
  });

  const cors = require('cors'); // Cross Enviornment

  const http = require('http').Server(app); // http request maker
  const io = require('socket.io')(http)
  // const httpServer = require('http').createServer(express);

  app.use((req, res, next) => {
    if (req.is('text/html')) {
      res.setHeader('Content-Security-Policy', "script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'");
    }
    next();
  });

  // Storing Chat Application Data

  const users = new Map();

  // const io = require('socket.io')(http);

  // const socket = io('http://localhost:3000');
  // Routes

  console.log(module.paths); // For testing purpose

  // Setting Paths
  const staticPath = path.join(__dirname, "../public");
  const templatePath = path.join(__dirname, "../templates/views");
  const partialsPath = path.join(__dirname, "../templates/partials");
  const messagePath = path.join(__dirname, "../dev-data/messages");


  const compression = require("compression"); // Optimizer
  // const { dirname } = require('path');

  // Defining View Engine & Its Path
  app.set('view engine', 'hbs');
  app.set('views', templatePath);
  app.use(express.static(staticPath));
  hbs.registerPartials(partialsPath);

  // Set Helper

  // Register the 'eq' helper
  hbs.registerHelper('eq', function (a, b) {
    return a === b;
  });

  // Storage Processing Middleware
  const multer = require('multer');
  const storage = multer.memoryStorage();

  const imagesPath = path.join(__dirname, "../dev-data/uploads");
  const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, imagesPath);
    },
    filename: (req, file, cb) => {
      console.log(file);
      cb(null, Date.now() + path.extname(file.originalname))
    }
  })
  const upload = multer({ storage: diskStorage });

  // const localUpload = multer({ storage: localStorage }).single('addDisplayPicturePb');
  // Limit uploads by 50mb
  app.use(bodyParser.json({ limit: '50mb' }));

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


  // Database connection

  const mysql = require('./db/conn.js');

  // Enable CORS for PHP Integration
  app.use(cors());

  // Security Middleware
  const helmet = require('helmet');
  app.use(helmet()); // Setting Security Headers

  // To get form data
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // Routing Middleware

  app.use('/', require('../routes/pages'));
  app.use('/auth', require('../routes/auth'));

  app.post('/upload', upload.single('image'), async (req, res) => {
    // Handle the uploaded file here
    res.send('File uploaded successfully');
  });

  // Function to check if the phone number exists in the database
  function checkUserExistsInDatabase(phoneNumber) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT COUNT(*) as count FROM phonebook WHERE phoneNumber = ?';
      dbConnection.query(query, [phoneNumber], (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results[0].count > 0);
        }
      });
    });
  }

  // app.listen(port, function () {
  //   console.log(`The server has started. Listening on port ${port}`);
  // })

  // io.on('connection', function (socket) {
  //   console.log(`Client connected ${socket.id}`);

  //   socket.on('disconnect', function () {
  //     console.log("Client has been disconnected");
  //   });

  // });

  // Monitor Changes in server files using Chokidar npm

  const watchedPaths = ['./src', './routes'];

  const watcher = chokidar.watch(watchedPaths, {
    ignored: /(^|[\/\\])\../,  // ignore dotfiles
    persistent: true,
  });

  watcher
    .on('add', (path) => console.log(`File ${path} has been added`))
    .on('change', (path) => console.log(`File ${path} has been changed`))
    .on('unlink', (path) => console.log(`File ${path} has been removed`));

  // Handle errors
  watcher.on('error', (error) => console.error(`Watcher error: ${error}`));

  // Log when watching starts
  watcher.on('ready', () => console.log('Initial scan complete. Ready for changes.'));

  // Log when watching stops
  process.on('SIGINT', () => {
    watcher.close();
    console.log('Watcher stopped.');
    process.exit();
  });

  const socketIdMapping = new Map();
  const userSocketMap = {}; // Map user phone numbers to socket IDs

  // Storing User's Messages based on JWT Authentication for individual messages

  // function loadMessages(userPhoneNumber) {
  //   const filePath = `${messagePath}/messages_${userPhoneNumber}.json`;

  //   try {
  //     const data = fs.readFileSync(filePath, 'utf-8');
  //     return JSON.parse(data) || [];
  //   } catch (error) {
  //     return [];
  //   }
  // }

  function loadMessages() {
    const filePath = `${messagePath}/messages_groupChat.json`;
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) || [];
  }

  // Storing of indiviual messages

  // function saveMessages(userPhoneNumber, messages) {
  //   const filePath = `${messagePath}/messages_${userPhoneNumber}.json`;
  //   fs.writeFileSync(filePath, JSON.stringify(messages), 'utf-8');

  //   // Emit an event to update messages for all connected users
  //   io.emit('updateMessages', { userPhoneNumber, messages });
  // }

  // Storing of group messages

  function saveMessages(messages) {
    const filePath = `${messagePath}/messages_Groupchat.json`;
    fs.writeFileSync(filePath, JSON.stringify(messages), 'utf-8');

    // Emit an event to update messages for all connected users
    io.emit('updateMessages', { messages });
  }

  // async function saveMessages(messages) {
  //   const filePath = `${messagePath}/messages_Groupchat.json`;

  //   try {
  //     await fs.promises.writeFile(filePath, JSON.stringify(messages), 'utf-8');
  //     // Emit an event to update messages for all connected users
  //     io.emit('updateMessages', { messages });
  //   } catch (error) {
  //     console.error('Error saving messages:', error);
  //   }
  // }

  // io.use((socket, next) => {
  //   const token = socket.handshake.auth.token;
  //   const userPhoneNumber = socket.handshake.auth.userPhoneNumber; // Access phone number from auth object

  //   console.log(`Token for socket user`, token);
  //   console.log(`Phone number for socket user`, userPhoneNumber);

  //   // Verify and decode the JWT token
  //   jwt.verify(token, process.env.JWT_SECRETKEY, (err, decoded) => {

  //     console.log('Token after verification:', token);

  //     if (err) {
  //       console.log(err)
  //       return next(new Error('Authentication error'));
  //     }



  //     console.log(`Token inside JWT ${token}`)

  //     // Store the user's socket with their phone number
  //     socket.userPhoneNumber = decoded.phoneNumber;
  //     console.log(`socket.userPhoneNumber is coming as undefined`);
  //     users.set(decoded.phoneNumber, socket);

  //     // Send stored messages to the user when they connect
  //     const storedMessages = loadMessages(decoded.phoneNumber);
  //     socket.emit('initialMessages', storedMessages);

  //     next();
  //   });
  // });

  io.on('connection', function (socket) {

    socket.on('initialMessages', () => {

      const userPhoneNumber = socket.handshake.auth.userPhoneNumber;
      console.log(`User phone number NEW ${userPhoneNumber}`)
      const storedMessages = loadMessages(socket.handshake.auth.userPhoneNumber);
      socket.emit('initialMessages', storedMessages);
    });

    // socket.on('authenticate', (phoneNumber) => {
    //   userSocketMap[phoneNumber] = socket.id;
    //   console.log(userSocketMap);
    // });

    // Listen for 'clientAddNotification' event
    socket.on('clientAddNotification', (data) => {
      console.log(`Client ${data} has joined the chat`);
      const greetMessage = `Client ${data} has joined the chat`
      io.emit('clientAddNotification', greetMessage);
    });


    // Emit 'authenticate' event to the server with the phone number
    // socket.emit('authenticate', phoneNumber);

    console.log(`Client connected ${socket.id}`);

    socketsConnected.add(socket.id);
    io.emit("clients-total", socketsConnected.size);
    console.log("Total Devices connected to the server", socketsConnected.size);

    // socket.on('setUsername', function(username){

    //   socketIdMapping.set(socket.id,username);
    //   console.log(socketIdMapping)

    //   io.emit('userList', Array.from(socketIdMapping.values()));

    // })

    socket.on('disconnect', async function () {
      console.log(socketIdMapping)
      const username = socketIdMapping.get(socket.id);
      socketsConnected.delete(socket.id)
      console.log("Client has been disconnected");
      console.log(`User ${username} with socket.id ${socket.id} disconnected`);
      io.emit('userList', Array.from(socketIdMapping.values()));
      io.emit("clients-total", socketsConnected.size);
    });
    socket.on('messageData', function (messageData, reciever) {
      console.log(messageData);
      const userPhoneNumber = socket.handshake.auth.userPhoneNumber;

      //stored messages for individual chats
      // const storedMessages = loadMessages(userPhoneNumber);

      const storedMessages = loadMessages(userPhoneNumber);
      storedMessages.push(messageData); // Assuming messageData is an object representing a chat message

      // Save the updated messages for indivual messages
      // saveMessages(userPhoneNumber, storedMessages);

      saveMessages(storedMessages);
      // const conversationId = getConversationId(socket.id, reciever);
      // console.log("Messages path ",__dirname)
      //     const messagesData = fs.readFileSync(messagePath, 'utf-8');
      //     const messages = JSON.parse(messagesData);
      socket.broadcast.emit('messageData', messageData);
    });

    socket.on('locationData', function (coords) {
      function generateLocationMessage(latitude, longitude) {
        console.log(`https://www.google.com/maps?q=${latitude},${longitude}`);
        return data = {
          url: `https://www.google.com/maps?q=${latitude},${longitude}`,
          urlG: `https://graphhopper.com/api/1/isochrone?point=${latitude},${longitude}&key=[YOUR_KEY]`,
          long: longitude,
          createdAt: new Date().getTime()
        }
      }
      io.emit('locationData', generateLocationMessage(coords.latitude, coords.longitude))
    })

    socket.on('feedback', function (data) {
      console.log(data);
      socket.broadcast.emit('feedback', data)
    })

    // Add error handling for other events if needed

  });

  http.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });