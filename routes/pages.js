    const { error } = require('console');
    const fs = require('fs'); // File System Module
    const pdf = require('html-pdf'); //For Database download
    const excel = require('exceljs'); //For Excel Download
    const nodemailer = require('nodemailer'); // For Verification OTP
    const jwt = require('jsonwebtoken'); // User Authentication for Chat Application 
    const cookieParser = require('cookie-parser');
    const express = require('express'); // Express Framework
    const app = express(); // Instance of Express
    const path = require('path'); // Defines Static Path and Temp
    const router = express.Router();

    const mg = require('nodemailer-mailgun-transport'); // Mailgun transporter



    // Storage Processing Middleware
    const multer = require('multer');
    const storage = multer.memoryStorage();

    const crypto = require('crypto');
    const socketsConnected = new Set()

    app.use(cookieParser());
    // Generate a random nonce value for each request
    // Middleware to generate a random nonce for each request
    app.use((req, res, next) => {
        const nonce = crypto.randomBytes(16).toString('base64');
        res.locals.nonce = nonce;
        next();
    });

    const imagesPath = path.join(__dirname, "../dev-data/uploads");


    const http = require('http').Server(app); // http request maker
    const io = require('socket.io')(http)
    // const httpServer = require('http').createServer(express);

    app.use((req, res, next) => {
        if (req.is('text/html')) {
            res.setHeader('Content-Security-Policy', "script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'");
        }
        next();
    });

    //     console.log(`Client connected ${socket.id}`);
    // io.on('connection', function (socket) {

    //     socketsConnected.add(socket.id);
    //     io.emit("clients-total", socketsConnected.size);
    //     console.log("Total Devices connected to the server", socketsConnected.size);

    //     socket.on('disconnect', function () {
    //       console.log("Client has been disconnected");
    //       io.emit("clients-total", socketsConnected.size);
    //     });

    //     // Add error handling for other events if needed

    //   });

    // io.on('connection', function (socket) {
    //     console.log(`Client connected ${socket.id}`);
    //     socket.on('disconnect', function () {
    //       console.log("Client has been disconnected");
    //     });

    //     // Add error handling for other events if needed

    //   });


    // function onConnected(socket){
    //     console.log(socket.id);
    //     socketsConnected.add(socket.id);
    //     io.emit("clients-total", socketsConnected.size);

    //      socket.on('disconnect', function(){
    //         console.log("Socket Disconnected", socket);
    //      io.emit("clients-total", socketsConnected.size);
    //     })
    //   }

    // io.on('connection', onConnected());
    // Middleware for user authentication
    // io.use((socket, next) => {
    //     const phoneNumber = socket.handshake.auth.phoneNumber;
    //     if (!phoneNumber || !checkUserExistsInDatabase(phoneNumber)) {
    //       return next(new Error('Invalid phone number'));
    //     }

    //     if (users.has(phoneNumber)) {
    //       socket.phoneNumber = phoneNumber;
    //       return next();
    //     } else {
    //       return next(new Error('User not found in the database'));
    //     }

    //   });

    // Listen for connections
    //   io.on('connection', (socket) => {
    //     console.log(`User ${socket.phoneNumber} connected`);

    //     // Listen for chat messages
    //     socket.on('chat message', (msg) => {
    //       // Broadcast the message to all connected clients
    //       io.emit('chat message', { phoneNumber: socket.phoneNumber, message: msg });
    //     });

    //     // Listen for disconnections
    //     socket.on('disconnect', () => {
    //       console.log(`User ${socket.phoneNumber} disconnected`);
    //     });
    //   });


    // Paths


    // Images Path
    const imagesFolder = path.join(__dirname, "../dev-data/uploads");

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
    const excelUpload = multer({ storage: storage })
    const bodyParser = require('body-parser');
    app.use(bodyParser.json({ limit: '50mb' }));


    const mysql = require('mysql');
    const { memoryStorage } = require('multer');

    // online_vfesonline database connection
    const db = mysql.createConnection({
        host: process.env.DB1_HOST,
        user: process.env.DB1_USER,
        password: process.env.DB1_PASSWORD,
        database: process.env.DB1
    });

    // Login Data

    // performance_schema database connection
    const db2 = mysql.createConnection({
        hosts: process.env.DB2_HOST,
        user: process.env.DB2_USER,
        password: process.env.DB2_PASSWORD,
        database: process.env.DB2
    })

    io.use((socket, next) => {
        const phoneNumber = socket.handshake.auth.phoneNumber;
    
        // Check if the phoneNumber is valid in your MySQL database
        const query = 'SELECT * FROM phonebook WHERE phoneNumber = ?';
        db.query(query, [phoneNumber], (error, results) => {
            if (error || results.length === 0) {
                return next(new Error('Invalid phone number'));
            }
            // Attach user information to the socket for later use
            socket.user = results[0];
            next();
        });
    });
    


    // Establishing Database Connections

    db2.connect(function (error) {
        if (error) { console.log(`Error ${error}`) };
    })
    db.connect(function (error) {
        if (error) { console.log(`Error ${error}`) };
    })

    // Routes

    router.get("/", async function (req, res) {
        res.render("index");
    })

    router.get("/login", async function (req, res) {
        res.render("login");
    });

    router.get('/register', async function (req, res) {
        res.render("register");
    });

    // JWT Authentication for Login System

    // Secret key for JWT (should be kept secret)
    const secretKey = process.env.JWT_SECRETKEY;

    // Dummy accounts storage
    const users = [
        { phoneNumber: '9909471247' },
        { phoneNumber: '1111111111' },
    ];

    const chatUsers = 

    // JWT Authentication Middleware

    // Helper function to verify JWT token and retrieve user information
    function verifyAuthToken(socket) {
        const token = socket.handshake.auth.token;

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
            return decoded;
        } catch (error) {
            console.error('Error verifying token:', error.message);
            return null;
        }
    }

    // Middleware to verify JWT token
    function authenticateToken(req, res, next) {
        const token = req.cookies.token;
        const invalidCredentialsError = `You Must Log In First`;
        if (!token) {

            return res.render("chatApplication/chatLogin", { invalidCredentialsError });
        }

        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                return res.send('Token not valid');
            }

            req.user = user;
            next();
        });
    }


    // Uploads

    router.get("/upload", upload.single('profileImage'), async function (req, res) {
        console.log(req);
        res.render("upload");

    });

    // Route to serve images
    router.get('/images/:imageName', (req, res) => {
        const imageName = req.params.imageName;
        const imagePath = path.join(imagesFolder, imageName);

        // Send the image file
        res.sendFile(imagePath);
    });

    // router.post("/upload", async function(req,res){
    // console.log(req);
    // res.render("upload");
    // })

    router.post('/phonebook/generate-pdf', async (req, res) => {
        // Fetch phonebook data from your database or other source
        const data = await getPhonebookData();

        // ... build HTML content and generate PDF ...

        res.status(200).send({ message: 'PDF generated successfully' });
    });

    async function getPhonebookData() {
        // Implement your data fetching logic
        // Example: using a database query
        const query = 'SELECT * FROM phonebook ORDER BY id DESC';
        const data = await db.query(query);
        return data;
    }

    router.get("/phonebook/search-form", function (req, res) {

        // Pagination
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 100;

        const skip = (page - 1) * limit;

        const fetchQuery = `SELECT * FROM phonebook ORDER by id DESC  LIMIT ${limit} OFFSET ${skip}`;

        try {
            const firstName = req.query.firstName || ''; // Default to an empty string if firstName is not provided

            console.log(firstName);

            // Use a parameterized query to prevent SQL injection
            // const query = "SELECT * FROM phonebook WHERE firstName LIKE ?";
            // const query = "SELECT * FROM phonebook where firstName LIKE '%"+firstName+"'";
            const query = "SELECT * FROM phonebook WHERE firstName LIKE '%" + firstName + "' OR lastName LIKE '%" + firstName + "' OR designation LIKE '%" + firstName + "' "

            // For Search Purpose
            const likeQuery = `SELECT * FROM phonebook 
            WHERE 
                firstName COLLATE utf8mb4_general_ci LIKE '%${firstName}%' 
                OR lastName COLLATE utf8mb4_general_ci LIKE '%${firstName}%'  
                OR designation COLLATE utf8mb4_general_ci LIKE '%${firstName}%'
                OR phoneNumber COLLATE utf8mb4_general_ci LIKE '%${Number(firstName)}%'
                OR groupName COLLATE utf8mb4_general_ci LIKE '%${firstName}'`

            db.query(likeQuery, async function (error, data) {
                if (error) {
                    console.log(error)
                }

                if (isNaN(data)) {
                }

                // Calculate total pages

                const totalPages = Math.ceil(global.pageNumberCount / limit);
                // Generate an array of page numbers
                const pagesArray = Array.from({ length: totalPages }, (_, i) => i + 1);

                // Prepare pagination metadata
                const paginationData = {
                    currentPage: page,
                    totalPages,
                    pagesArray,
                    previousPage: page > 1 ? `/phonebook?page=${page - 1}&limit=${limit}` : null,
                    nextPage: page < totalPages ? `/phonebook?page=${page + 1}&limit=${limit}` : null,
                };

                res.status(200).render("phonebook", {
                    action: 'list',
                    phonebookData: data,
                    pagination: paginationData,
                    searchTerm: req.query.firstName


                })
                // res.render('phonebook', { phonebookData: data });
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).send('Internal Server Error');
        }
    });


    // API Data for Phonebook Contact Forms 

    router.get("/api/statesdata", async function (req, res) {

        const jsonFile = await fs.promises.readFile('./dev-data/IndianStates.json', 'utf8');
        parsedData = await JSON.parse(jsonFile);
        res.json(parsedData);

    })

    router.get("/api/groupsdata", (req, res) => {

        const globalGroupFetchQuery = " SELECT groupName FROM `groups`";
        let globalGroupsdata;
        const globalGroupDataDb = db.query(globalGroupFetchQuery, async function (error, data) {
            if (error) {
                console.log(error)
            }
            else {
                globalGroupsdata = data;

            }
            // Send the data as JSON
            res.json(globalGroupsdata);
        });
    });


    let editGdata;

    router.get("/phonebook", async function (req, res) {

        const jsonFile = await fs.promises.readFile('./dev-data/IndianStates.json', 'utf8');
        parsedData = await JSON.parse(jsonFile);

        let newEditData;
        // await  console.log(parsedData);

        // Pagination
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 100;

        const skip = (page - 1) * limit;

        // const fetchQuery = `SELECT * FROM phonebook ORDER by id DESC  LIMIT ${limit} OFFSET ${skip}`;
        const fetchQuery = `SELECT id, firstName, lastName, phoneNumber, designation, department, jobName, companyName, groupName, emailAddress, city, state, country, profileImage FROM phonebook ORDER by id DESC  LIMIT ${limit} OFFSET ${skip}`;
        const imagesPath = path.join(__dirname, "../dev-data/uploads");

        // For Number Calling & Fetching Data

        // Groups Fetch Query

        const groupFetchQuery = " SELECT groupName FROM `groups`"
        let gdata;
        const groupData = db.query(groupFetchQuery, async function (error, data) {
            if (error) {
                console.log(error)
            }
            else {
                gdata = await data;

            }
        });


        let editGdata;


        const groupEditData = await db.query(groupFetchQuery, async function (error, data) {
            if (error) {
                console.log(error);
            } else {
                editGdata = await data;
                // console.log('Inside Function edit', editGdata);
            }

        });

        // console.log('new ++' + newEditData);

        // Avoid using global.editGdata here, as the query may not have completed yet

        db.query(fetchQuery, async function (error, data) {

            if (error) {
                throw (error)
            }
            else {

                // Processing FirstName Data in proper format
                for (let i = 0; i < data.length - 1; i++) {
                    if (data[i].firstName != null) {

                        data[i].firstName = await data[i].firstName.slice(0, 1).toUpperCase() + data[i].firstName.slice(1, data[i].firstName.length).toLowerCase();
                    }
                }

                // Processing LastName Data in proper format
                for (let i = 0; i < data.length; i++) {
                    if (data[i].lastName != null) {
                        data[i].lastName = await data[i].lastName.slice(0, 1).toUpperCase() + data[i].lastName.slice(1, data[i].lastName.length).toLowerCase();
                    }
                }

                // Gettng the data sample for reference purpose
                const jsonString = JSON.stringify(data, null, 2);
                fs.writeFileSync('phonebook.txt', jsonString);

                // Get total data count for pagination
                const pageFetchQuery = 'SELECT COUNT(*) AS count FROM phonebook';
                const totalDataCount = await db.query(pageFetchQuery, async function (error, data) {

                    if (error) {
                        console.log(error);
                    }
                    else {
                        // console.log(data)
                        // data = JSON.parse(pageQuery);
                        // fs.writeFileSync('data.txt', data);
                        global.pageNumberCount = await data[0].count;
                    }
                });

                const profileImageQueryPb = 'SELECT profileImage FROM phonebook WHERE id = ?';

                // Calculate total pages
                // console.log(totalDataCount[0].count)

                const totalPages = Math.ceil(global.pageNumberCount / limit);

                // Generate an array of page numbers
                const pagesArray = Array.from({ length: totalPages }, (_, i) => i + 1);


                // Prepare pagination metadata
                const paginationData = {
                    currentPage: page,
                    totalPages,
                    pagesArray,
                    previousPage: page > 1 ? `/phonebook?page=${page - 1}&limit=${limit}` : null,
                    nextPage: page < totalPages ? `/phonebook?page=${page + 1}&limit=${limit}` : null,
                };

                // console.log('new ++', editGdata);
                // console.log("Edit G Data", editGdata)
                // console.log("Group Data ", gdata);

                res.status(200).render("phonebook", {
                    action: 'list',
                    phonebookData: data,
                    pagination: paginationData,
                    searchTerm: req.query.firstName,
                    groupData: gdata,
                    editGdata2: editGdata,
                    gdata,
                    editGdata,
                    countriesCitiesData: parsedData,
                    imagesPath: imagesPath,
                })
            }
        })
    })

    // Calling route for phonebook page. (Clicking on the phone number will call that specific number.)

    router.get("/call", async function (req, res) {

        // Getting Query Parameters for Name and Number 

        const fullName = req.query.fullName;
        const number = Number(req.params.callNumber);
        console.log(number);

        const APPLICATION_KEY = process.env.APPLICATION_KEY;
        const APPLICATION_SECRET = process.env.APPLICATION_SECRET_KEY;
        const SINCH_NUMBER = process.env.SINCH_NUMBER;
        const LOCALE = process.env.LOCALE_GUJ;
        const TO_NUMBER = 91 + req.query.number;
        console.log(req.params.number)

        const basicAuthentication = APPLICATION_KEY + ":" + APPLICATION_SECRET;

        const fetch = require('cross-fetch');
        const ttsBody = {
            method: 'ttsCallout',
            ttsCallout: {
                cli: SINCH_NUMBER,
                destination: {
                    type: 'number',
                    endpoint: TO_NUMBER
                },
                locale: LOCALE,
                text: `This is a call from Vadodara Municipal Corporation, ${fullName}, You have been ordered immediately to reach the Fire Station`,
            }
        };

        fetch("https://calling.api.sinch.com/calling/v1/callouts", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Basic ' + Buffer.from(basicAuthentication).toString('base64')
            },
            body: JSON.stringify(ttsBody)
        }).then(res => res.json()).then(json => console.log(json));
    })

    // Alternative calling API for testing purpose

    router.get("/call-twilo", async function (req, res) {

        const fullName = req.query.fullName;
        const number = req.params.number;
        // const TO_NUMBER = 91 + req.query.number;

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = require('twilio')(accountSid, authToken);
        console.log(req.params.callNumber);
        client.calls
            .create({
                url: 'http://demo.twilio.com/docs/voice.xml',
                to: `+91` + req.query.number,
                twiml: `${fullName}, You have been called immediately to report to Vadodara Fire and Emergency Services.`,
                from: '+12058758238'
            })
            .then(call => console.log(call.sid));
    })

    // Response if the call is accepted

    router.post("/call-twilo", async function (req, res) {

    })
    // For Phonebook's Edit Contact Validation

    router.post("/validateForm", async function (req, res) {
        console.log("inside validate form route")
        const { phoneNumber, editContactId } = await req.body;

        console.log(phoneNumber);
        const query = 'SELECT COUNT(*) AS count FROM phonebook WHERE phoneNumber = ? AND id !=?';
        db.query(query, [phoneNumber, Number(editContactId)], function (error, result) {
            if (error) {
                res.json(error)
            }
            else {
                console.log(result)
                res.json(result);

            }
        });
    })
    // });

    // router.get('/phonebook/generate-pdf', async (req, res) => {

    //     const query = 'SELECT * FROM phonebook ORDER BY id DESC';

    //     try {
    //         // Use await to ensure data retrieval before building the HTML content
    //         const data = await db.query(query);

    //         // Declare HTML content variable within the callback function
    //         let htmlContent = '<table>';

    //         // Build the HTML table headers
    //         const columns = Object.getOwnPropertyNames(data[0] ?? {});
    //         htmlContent += '<tr>';
    //         for (const column of columns) {
    //             htmlContent += `<th>${column}</th>`;
    //         }
    //         htmlContent += '</tr>';

    //         // Build the HTML table rows
    //         for (const row of data) {
    //             htmlContent += '<tr>';
    //             for (const column of columns) {
    //                 htmlContent += `<td>${row[column]}</td>`;
    //             }
    //             htmlContent += '</tr>';
    //         }
    //         htmlContent += '</table>';

    //         // Define PDF options
    //         const pdfOptions = {
    //             format: 'A4',
    //             orientation: 'portrait',
    //             margin: 10,
    //             filename: 'phonebook_data.pdf',
    //         };

    //         // Create the PDF stream
    //         const pdfStream = pdf.create(htmlContent, pdfOptions);

    //         // Handle PDF creation errors
    //         pdfStream.on('error', (err) => {
    //             console.error(err);
    //             res.status(500).send(`Error generating PDF: ${err}`);
    //         });

    //         // Download the PDF
    //         pdfStream.pipe(res.download('phonebook_data.pdf'));
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).send('Internal server error');
    //     }
    // });


    // router.get("/phonebook/pdf", async (req, res) => {
    //     const query = "SELECT * FROM phonebook ORDER BY id DESC";
    //     let htmlContent = "<table>";
    //     htmlContent += "<tr>";

    //     // Wait for the data to be retrieved
    //     // const data = await db.query(query);
    //     console.log(data);
    //     // const jsonString = JSON.stringify(data, (key, value) => {
    //     //     if (typeof value === 'object' && value !== null) {
    //     //       // Handle circular references
    //     //       return {}; // Replace object with empty object
    //     //     }
    //     //     return value;
    //     //   }, 2);

    //     // fs.writeFileSync('phonebook.txt', jsonString);

    //     const columns = Object.getOwnPropertyNames(data[0] ?? {});
    //     for (const column of columns) {
    //         htmlContent += `<th>${column}</th>`;
    //     }
    //     htmlContent += "</tr>";

    //     for (const row of data) {
    //         htmlContent += "<tr>";
    //         for (const column of columns) {
    //             htmlContent += `<td>${row[column]}</td>`;
    //         }
    //         htmlContent += "</tr>";
    //     }
    //     htmlContent += "</table>";

    //     try {
    //         const pdfData = pdf.create(htmlContent, {
    //             format: "A4",
    //             orientation: "portrait",
    //             margin: 10,
    //             filename: "phonebook_data.pdf",
    //         });
    //         res.contentType("application/pdf");
    //         res.send(pdfData);
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).send("Error generating PDF");
    //     }
    // });

    //   Generating Phonebook PDF

    router.get("testpdf", async function (req, res) {
        const query = "SELECT * from users ORDER BY id DESC";
        db.query(query, async function (error, data) {
            if (error) {
                console.log(error);

            }
            else {
                console.log(data);
                // Configure PDF options
                const pdfOptions = {
                    format: 'A4',
                    orientation: 'portrait',
                    margin: 10,
                    filename: 'phonebook_data.pdf',
                };

                // HTML Content

                let htmlContent = '<table>';

                // Build the HTML table headers
                const columns = Object.getOwnPropertyNames(data[0] ?? {});
                htmlContent += '<tr>';
                for (const column of columns) {
                    htmlContent += `<th>${column}</th>`;
                }
                htmlContent += '</tr>';

                // Build the HTML table rows
                for (const row of data) {
                    htmlContent += '<tr>';
                    for (const column of columns) {
                        htmlContent += `<td>${row[column]}</td>`;
                    }
                    htmlContent += '</tr>';
                }
                htmlContent += '</table>';
                const pdfDoc = new PDFDocument(pdfOptions);

                // Pipe the PDF document to a file
                const pdfStream = fs.createWriteStream('phonebook_data.pdf');
                pdfDoc.pipe(pdfStream);

                // Write the HTML content to the PDF document
                pdfDoc.text(htmlContent, { html: true });

                // Finalize the PDF
                pdfDoc.end();

                // Wait for the 'finish' event to ensure the PDF is fully generated
                pdfStream.on('finish', () => {
                    // Send the response
                    res.setHeader('Content-Type', 'application/pdf');
                    res.setHeader('Content-Disposition', 'attachment; filename=phonebook_data.pdf');
                    const pdfBuffer = fs.readFileSync('phonebook_data.pdf');
                    res.send(pdfBuffer);
                });

                // Handle errors
                pdfStream.on('error', (error) => {
                    console.error('Error generating PDF:', error);
                    res.status(500).send('Internal Server Error');

                });
                // const buffer = await pdf.create(htmlContent).toBuffer(pdfOptions);
                // res.setHeader('Content-Type', 'application/pdf');
                // res.setHeader('Content-Disposition', 'attachment; filename=phonebook_data.pdf');
                // res.send(buffer);

            }
        })
    })

    // Download Phonebook Data Pdf

    router.get('/phonebook/generate-pdf', async function (req, res) {
        const query = 'SELECT * from phonebook ORDER BY id DESC';
        db.query(query, async function (error, data) {
            if (error) {
                console.error(error);
                res.status(500).send('Internal Server Error');
                return;
            }

            // HTML Content
            let htmlContent = '<table>';
            const columns = Object.getOwnPropertyNames(data[0] ?? {});
            htmlContent += '<tr>';
            for (const column of columns) {
                htmlContent += `<th>${column}</th>`;
            }
            htmlContent += '</tr>';

            for (const row of data) {
                htmlContent += '<tr>';
                for (const column of columns) {
                    htmlContent += `<td>${row[column]}</td>`;
                }
                htmlContent += '</tr>';
            }
            htmlContent += '</table>';

            // Configure PDF options
            const pdfOptions = {
                format: 'A4',
                orientation: 'portrait',
                margin: 10,
                filename: 'phonebook_data.pdf',
            };

            // Convert HTML to PDF
            pdf.create(htmlContent, pdfOptions).toFile((err, filePath) => {
                if (err) {
                    console.error(err);
                    res.status(500).send('Error generating PDF');
                    return;
                }
                // Send the PDF as a downloadable file
                res.download(filePath.filename, 'phonebook_data.pdf', (err) => {
                    // Clean up the temporary PDF file
                    fs.unlinkSync(filePath.filename);
                });
            });
        });
    });

    // Download Phonebook Data Excel

    router.get('/phonebook/generate-excel', async function (req, res) {
        const query = 'SELECT * FROM phonebook ORDER BY id DESC';

        try {
            db.query(query, async function (error, data) {

                console.log(data);
                // Create a new Excel workbook
                const workbook = new excel.Workbook();
                const worksheet = workbook.addWorksheet('Phonebook Data');

                // Add headers to the worksheet
                const columns = Object.getOwnPropertyNames(data[0] ?? {});
                worksheet.addRow(columns);

                // Add data rows to the worksheet
                for (const row of data) {
                    worksheet.addRow(Object.values(row));
                }
                // Set response headers for Excel download
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', 'attachment; filename=phonebook_data.xlsx');

                // Write the workbook to the response
                await workbook.xlsx.write(res);
                res.end();
            });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    });

    // Import Phonebook Data PDF

    // Import Excel
    // router.post('/phonebook/importexcel', excelUpload.single('excelFileInput'), async (req, res) => {
    //     // Console logging for test
    //     console.log(req.file);

    //     // Check if req.file is defined
    //     if (!req.file) {
    //         console.log("File does not exist")
    //         return res.status(400).send('No file uploaded.');
    //     }

    //     try {
    //         // Importing Excel data to MySql Table
    //         const workbook = new excel.Workbook(); // Creating a new workbook
    //         workbook.xlsx.load(req.file.buffer);
    //         console.log("Command executed"); // Test

    //         // Fetching worksheet
    //         const worksheet = workbook.getWorksheet(1);

    //         // Iterate over each row in the Excel sheet
    //         worksheet.eachRow(async (row, rowNumber) => {
    //             // Assuming columns are in the order: firstName
    //             const firstName = row.getCell(1).value;
    //             const companyAddress = row.getCell(2).value;
    //             const companyName = row.getCell(3).value;
    //             const phoneNumber = row.getCell(4).value;
    //             const designation = row.getCell(5).value;

    //             // Log the extracted values
    //             console.log(`Row ${rowNumber} Value:`, firstName,firstName, companyAddress, companyName, phoneNumber, designation);

    //             await db.query(
    //                 'INSERT INTO testphonebook (firstName,companyAddress,companyName,phoneNumber,designation) VALUES (?,?,?,?,?)',
    //                 [firstName,companyAddress,companyName,phoneNumber,designation]
    //             );

    //             console.log(`Data from row ${rowNumber} imported successfully`);
    //         });

    //         console.log("All data imported successfully");
    //         const successMessage = 'Data Imported Successfully';
    //         res.status(200).redirect("phonebook", { successMessage });
    //     } catch (error) {
    //         console.log(error);
    //         res.status(500).send("Internal Server Error");
    //     }
    // });

    // router.post('/phonebook/importexcel', upload.single('excelFileInput'), async (req, res) => {
    //     // Console logging for test
    //     console.log(req.file);

    //     try {
    //         // Importing Excel data to MySql Table
    //         const workbook = new excel.Workbook(); // Creating a new workbook
    //         await workbook.xlsx.load(req.file.buffer);
    //         console.log("Command executed"); // Test

    //         // Fetching worksheet
    //         const worksheet = workbook.getWorksheet(1);

    //         // Iterate over each row in the Excel sheet
    //         worksheet.eachRow(async (row, rowNumber) => {
    //             // Assuming columns are in the order: firstName
    //             const values = row.values;

    //             const [firstName, contact_number, designation] = values;

    //             await db.query(
    //                 'INSERT INTO testphonebook (firstName, phoneNumber, designation) VALUES (?,?,?)',
    //                 [firstName,contact_number,designation]
    //             );

    //             console.log(`Data from row ${rowNumber} imported successfully`);
    //         });

    //         console.log("All data imported successfully");
    //         res.status(200).send("Data imported successfully");
    //     } catch (error) {
    //         console.log(error);
    //         res.status(500).send("Internal Server Error");
    //     }
    // });

    // router.post('/phonebook/importexcel', upload.single('excelFileInput'), async (req, res) => {
    //     // Console logging for test
    //     console.log(req.file);

    //     try {
    //         // Importing Excel data to MySql Table
    //         const workbook = new excel.Workbook(); // Creating a new workbook
    //         await workbook.xlsx.load(req.file.buffer);
    //         console.log("Command executed"); // Test

    //         // Fetching worksheet
    //         const worksheet = workbook.getWorksheet(1);

    //         // Explicitly define MySQL table columns
    //         const mysqlTableColumns = ['firstName', 'phoneNumber', 'designation'];

    //         // Generate the SQL query dynamically based on MySQL table columns
    // const query = `INSERT INTO testphonebook (${mysqlTableColumns.join(', ')}) VALUES (${mysqlTableColumns.map(() => '?').join(', ')})`;


    //         // Get column names from the first row
    //         const columnNames = worksheet.getRow(1).values.filter(name => name); // Filter out empty column names

    //         // Iterate over each row in the Excel sheet starting from the second row
    //         for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    //             const row = worksheet.getRow(rowNumber);

    //             // Create an object with column names as keys and corresponding values
    //             const rowObject = {};
    //             columnNames.forEach((columnName, index) => {
    //                 rowObject[columnName] = row.getCell(index + 1).value;
    //             });

    //             console.log(rowObject);

    //             // Log the extracted values
    //             console.log(`Row ${rowNumber} Values:`, rowObject);

    //             // Generate the SQL query dynamically based on column names
    //             const query = `INSERT INTO testphonebook (${columnNames.join(', ')}) VALUES (${columnNames.map(() => '?').join(', ')})`;

    //             // Extract values from the rowObject
    //             const queryValues = columnNames.map(columnName => rowObject[columnName]);

    //             // Execute the query
    //             await db.query(query, queryValues);

    //             console.log(`Data from row ${rowNumber} imported successfully`);
    //         }

    //         console.log("All data imported successfully");
    //         res.status(200).send("Data imported successfully");
    //     } catch (error) {
    //         console.log(error);
    //         res.status(500).send("Internal Server Error");
    //     }
    // });

    // router.post('/phonebook/importexcel', upload.single('excelFileInput'), async (req, res) => {
    //     // Console logging for test
    //     console.log(req.file);

    //     try {
    //         // Importing Excel data to MySql Table
    //         const workbook = new excel.Workbook(); // Creating a new workbook
    //         await workbook.xlsx.load(req.file.buffer);
    //         console.log("Command executed"); // Test

    //         // Fetching worksheet
    //         const worksheet = workbook.getWorksheet(1);

    //         // Explicitly define MySQL table columns
    //         const mysqlTableColumns = ['firstName', 'phoneNumber', 'designation', 'companyAddress'];

    //         // Generate the SQL query dynamically based on MySQL table columns
    //         const query = `INSERT INTO testphonebook (${mysqlTableColumns.join(', ')}) VALUES (${mysqlTableColumns.map(() => '?').join(', ')})`;

    //         const columnMapping = {
    //             'NAME': 'firstName',
    //             'CONTACT ': 'phoneNumber',
    //             'ExcelDesignationColumn': 'designation',
    //             // Add more mappings as needed
    //         };


    //         // Get column names from the first row
    //     }
    //     catch (error) {

    //     }
    // });

    // router.post('/phonebook/importexcel', excelUpload.single('excelFileInput'), async (req, res) => {
    //     try {
    //       // Import Excel data to MySQL Table
    //       const workbook = new excel.Workbook();
    //       await workbook.xlsx.load(req.file.buffer);




    //       // Fetching the first worksheet
    //       const worksheet = workbook.getWorksheet(1);

    //       if (!worksheet) {
    //         return res.status(400).send('Worksheet not found in the Excel file');
    //       }

    //       // Define column mappings based on your Excel file structure
    //       const columnMappings = {
    //         'companyName': 'companyName',
    //         'companyAddress': 'companyAddress',
    //         'firstName': 'firstName',
    //         'phoneNumber': 'phoneNumber',
    //         'designation' : 'designation'
    //       };

    //       // Prepare the SQL query for inserting data
    //       const insertQuery = `INSERT INTO testphonebook (${Object.values(columnMappings).join(', ')}) VALUES ?,?,?,?,?`;

    //       // Extract data from the Excel sheet
    //       const data = worksheet.getSheetValues().map(row => {

    //         return Object.keys(columnMappings).map(header => row[worksheet.getColumn(header).number]);

    //       });

    //       // Execute the insertion query
    //       await db.execute(insertQuery, [data]);

    //       res.status(200).send('Data imported successfully');
    //     } catch (error) {
    //       console.error(error);
    //       res.status(500).send('Internal Server Error');
    //     }
    //   });

    const xlsx = require('xlsx');

    router.post('/phonebook/importexcel', excelUpload.single('excelFileInput'), async (req, res) => {
        // Console logging for test
        console.log(req.file);

        // Check if req.file is defined
        if (!req.file) {
            console.log("File does not exist");
            return res.status(400).send('No file uploaded.');
        }

        try {
            // Importing Excel data to MySql Table
            const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
            console.log("loaded file buffer"); // Test

            // Fetching worksheet
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];

            // Convert the worksheet to an array of objects
            const excelData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

            // Assuming columns are in the order: firstName, companyAddress, companyName, phoneNumber, designation
            for (let i = 1; i < excelData.length; i++) {
                const [department, firstName, phoneNumber] = excelData[i];

                // Log the extracted values
                console.log(`Row ${i} Values:`, firstName, phoneNumber);

                // Insert data into MySQL table

                //This Query will require changes as per the columns in Excel sheet.
                await db.query(
                    'INSERT INTO phonebook (department, firstName, phoneNumber) VALUES (?, ?, ?)',
                    [department, firstName, phoneNumber]
                );

                console.log(`Data from row ${i} imported successfully`);
            }

            console.log("All data imported successfully");
            const successMessage = 'Data Imported Successfully';
            res.status(200).render("phonebook", { successMessage });
        } catch (error) {
            console.log(error);
            res.status(500).send("Internal Server Error");
        }
    });

    // Group Management Phonebook

    router.get("/phonebook/groupmg", async function (req, res) {
        const query = "SELECT * from `groups` ORDER BY groupId ASC";

        db.query(query, function (error, data) {
            if (error) {
                throw error;
            }
            else {
                // console.log(data);
                // for(let i=0; i<=data.length;i++){
                //     data.groupName = data.groupName.slice(0,1).toUpperCase() + data.groupName.slice(1,data.group.length.toLowerCase())
                // }
                res.status(200).render("phonebook/groupmg", { action: 'list', groupData: data });
            }
        })
        // res.render("phonebook/groupmg")
    });

    // Add Groups - Group Management in Phonebook

    router.post("/pbAddGroup", async function (req, res) {

        let groupName = await req.body.groupName;
        console.log(`VERIFIED ${groupName}`)
        const groupStatus = 1;
        const inactiveGroupStatus = 0;
        const query = "INSERT into `groups` (groupName, groupStatus) VALUES (?,?)";
        db.query(query, [groupName, groupStatus], async function (err, data) {
            if (err) {
                res.json(err)
            }
            else {
                res.json(data)
            }
        })
    })

    // Edit Groups - Group Management

    router.post("/pbEditGroup", async function (req, res) {

        let updatedGroupName = await req.body.updatedGroupName;
        console.log(updatedGroupName)
        let updatedGroupId = await req.body.updatedGroupId;
        console.log(updatedGroupId);

        const query = "UPDATE `groups` SET groupName = ? WHERE groupId = ?";
        // const query = "SELECT COUNT(*) AS count FROM `groups` WHERE phoneNumber = ? AND groupId !=?"

        db.query(query, [updatedGroupName, updatedGroupId], async function (error, results) {
            if (error) {
                console.error(error);
                res.json(error)
            }
            else {

                // results?console.log(success):console.log("Moye Moye");
                // console.log(results)
                res.json(results)
            }
        });
    })

    router.post("/pbEditGroupValidation", async function (req, res) {

        const updatedGroupName = await req.body.updatedGroupName;
        console.log(updatedGroupName)
        let updatedGroupId = await req.body.updatedGroupId;
        console.log(updatedGroupId);

        const query = "UPDATE `groups` SET groupName = ? WHERE groupId = ?";
        // const query = "SELECT COUNT(*) AS count FROM `groups` WHERE phoneNumber = ? AND groupId !=?"

        db.query(query, [updatedGroupName, updatedGroupId], async function (error, results) {
            if (error) {
                console.error(error);
                res.json(error)
            }
            else {

                // results?console.log(success):console.log("Moye Moye");
                console.log(results)
                res.json(results)
            }
        });
    })

    // Employees Page

    router.get("/employees", async function (req, res, next) {

        const query = "SELECT * from users ORDER BY id DESC";
        db.query(query, function (error, data) {
            if (error) {
                throw error;
            }
            else {
                res.status(200).render("employees", { action: 'list', empData: data });
            }
        })
    })

    router.get("/employees2", async function (req, res) {
        console.log(req);
        res.status(200).render("employee2")
    })
    // Send Message Routes (Discontinued) Chat Application routes are now on /chatLogin & /chat3


    router.get("/sendmessage", async function (req, res) {
        res.status(200).render("phonebook/sendMessage", { nonce: res.locals.nonce, /* other template variables */ });
    })

    router.post("/sendmessage", async function (req, res) {
        const message = req.body.message; // Assuming you are using body-parser middleware

        // Do something with the message, such as broadcasting it to connected clients
        io.emit('chat message', message);
        console.log(`Message is  : `, message)
        res.send(message);
    })

    // User Profiles Route

    router.get("/userprofiles", async function (req, res) {

        const fetchQuery = `SELECT id, firstName, lastName, phoneNumber, designation, department, jobName, companyName, groupName, emailAddress, city, state, country, profileImage FROM phonebook ORDER by id DESC LIMIT 70  
        `;
        const imagesPath = path.join(__dirname, "../dev-data/uploads");

        db.query(fetchQuery, async function (error, data) {

            if (error) {
                throw (error)
            }
            else {

                // Processing FirstName Data in proper format
                for (let i = 0; i < data.length - 1; i++) {
                    if (data[i].firstName != null) {

                        data[i].firstName = await data[i].firstName.slice(0, 1).toUpperCase() + data[i].firstName.slice(1, data[i].firstName.length).toLowerCase();
                    }
                }

                // Processing LastName Data in proper format
                for (let i = 0; i < data.length; i++) {
                    if (data[i].lastName != null) {

                        data[i].lastName = await data[i].lastName.slice(0, 1).toUpperCase() + data[i].lastName.slice(1, data[i].lastName.length).toLowerCase();
                    }
                }
                res.status(200).render("userprofiles", {
                    action: 'list',
                    profilesData: data
                })
            }
        })
    })

    router.get("/userprofiles/search-form", function (req, res) {

        const fetchQuery = `SELECT * FROM phonebook ORDER by id DESC`;

        try {
            const firstName = req.query.firstName || ''; // Default to an empty string if firstName is not provided

            console.log(firstName);

            // Use a parameterized query to prevent SQL injection
            // const query = "SELECT * FROM phonebook WHERE firstName LIKE ?";
            // const query = "SELECT * FROM phonebook where firstName LIKE '%"+firstName+"'";
            const query = "SELECT * FROM phonebook WHERE firstName LIKE '%" + firstName + "' OR lastName LIKE '%" + firstName + "' OR designation LIKE '%" + firstName + "' "

            // For Search Purpose
            const likeQuery = `SELECT * FROM phonebook 
            WHERE 
                firstName COLLATE utf8mb4_general_ci LIKE '%${firstName}%' 
                OR lastName COLLATE utf8mb4_general_ci LIKE '%${firstName}%'  
                OR designation COLLATE utf8mb4_general_ci LIKE '%${firstName}%'
                OR phoneNumber COLLATE utf8mb4_general_ci LIKE '%${Number(firstName)}%'
                OR groupName COLLATE utf8mb4_general_ci LIKE '%${firstName}'`



            db.query(likeQuery, async function (error, data) {
                if (error) {
                    console.log(error)
                }

                if (isNaN(data)) {
                    // Processing LastName Data in proper format
                    for (let i = 0; i < data.length - 1; i++) {
                        data[i].firstName = await data[i].firstName.slice(0, 1).toUpperCase() + data[i].firstName.slice(1, data[i].firstName.length).toLowerCase();
                    }

                    // Processing LastName Data in proper format
                    for (let i = 0; i < data.length; i++) {
                        data[i].lastName = await data[i].lastName.slice(0, 1).toUpperCase() + data[i].lastName.slice(1, data[i].lastName.length).toLowerCase();
                    }
                }

                res.status(200).render("userprofiles", {
                    action: 'list',
                    profilesData: data,
                    searchTerm: req.query.firstName


                })
                // res.render('phonebook', { phonebookData: data });
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    const fetchUsersQuery = `SELECT firstName,lastName,phoneNumber FROM phonebook`;

    // Dummy Login for Chat Testing

    router.get("/loginTest", async function (req, res) {
        res.render("chatApplication/login")
    })

    router.post("/loginTest", async function (req, res) {

    })

    // Chat New UI

    router.get("/chat2", async function (req, res) {
        console.log(req);
        res.render("chat2");
    });

    router.get("/registerChat", async function (req, res) {
        res.render("chatApplication/register");
    })

    // Chat Application Module

    // Alternative Chat Page corresponding to /sendMessage route (Currently Not Used)
    router.get("/chat", async function (req, res) {
        res.render('chatIndex');
    })

    router.post("/chat", async function (req, res) {
        const nickname = req.body.nickname;
        const phoneNumber = req.body.phoneNumber;
        console.log(`Testing chat route, nickname and phone number are ${nickname} , ${phoneNumber} `)
        res.render("phonebook/sendMessage", { nickname, phoneNumber })
    });

    // Auth route (requires authentication)
    app.get('/auth', authenticateToken, (req, res) => {
        res.send('You are authenticated! Welcome to the authenticated page.');
    });

    // New Chat Application Routes
    // Chat Login is similar to chatIndex.hbs but with improved UI (Shortlisted for web hosting)

    router.get("/chatLogin", async function (req, res) {
        res.render('chatApplication/chatLogin');
    })

    router.post("/chatLogin", async function (req, res) {

        // Fetching User's Information for OTP Login
        const nickname = req.body.nickname;
        const phoneNumber = req.body.phoneNumber;
        const email = req.body.email;
        const mailgunAuth = {
            auth: {
                api_key: process.env.MAILGUN_APIKEY,
                domain: process.env.MAILGUN_DOMAIN,
            },
        };

        const transporter = nodemailer.createTransport(mg(mailgunAuth));

        const mailOptions = {
            from: process.env.MAILGUN_OTP_EMAIL,
            to: email,
            subject: 'Test Email',
            text: 'This is a test email sent using Nodemailer and Mailgun!',
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info);
            }
        });

        // Check if the user exists

        if (!phoneNumber) {
            return res.status(400).send('Invalid input');
        }
        
        const query = 'SELECT * FROM phonebook WHERE phoneNumber = ?';
        db.query(query, [phoneNumber], (err, results) => {
            if (err) {
            console.error('Error querying database:', err);
            return res.status(500).send('Internal Server Error');
            }

            console.log(results);
        
            if (results.length === 0) {
            return res.status(401).send('Invalid phone number');
            }
        
            // You can generate a JWT token or set a session cookie here
            const token = jwt.sign({ phoneNumber: results.phoneNumber }, process.env.JWT_SECRETKEY, { expiresIn: '1h' });

            // Adding Token to brower's cookie
            res.cookie('token', token, { httpOnly: true });
        
            // console.log(` Chat Login Test Info ${nickname} ${phoneNumber} , ${email}`)
        
            res.render("chatApplication/chat3", { nickname, phoneNumber, email, results });
        });

        // const user = users.find(u => u.phoneNumber === phoneNumber);
        // if (!user) {
        //     return res.send("User Not Found");
        // }


        // // Creating a JWT token if user exists
        // const token = jwt.sign({ phoneNumber: user.phoneNumber }, process.env.JWT_SECRETKEY, { expiresIn: '1h' });

        // // Adding Token to brower's cookie
        // res.cookie('token', token, { httpOnly: true });

        // // console.log(` Chat Login Test Info ${nickname} ${phoneNumber} , ${email}`)

        // res.render("chatApplication/chat3", { nickname, phoneNumber, email });

    });

    // Chat Application Dashboard

    router.post("/chat3", authenticateToken, async function (req, res) {
        const message = req.body.message; // Assuming you are using body-parser middleware
        // Do something with the message, such as broadcasting it to connected clients
        io.emit('chat message', message);
        console.log(`Message is  : `, message)
        res.send(message);
    })

    // Clearing Chats Route for Chat Application

    router.get("/chatApplication/clearChats", authenticateToken, async function (req, res) {


        // Chat Application Paths
        const messagePath = path.join(__dirname, "../dev-data/messages/");
        const groupChatJSONPath = `${messagePath}messages_groupChat.json`;

        console.log("Clear Chats Button clicked. Message from the server");

        console.log(`JSON Data Path ${groupChatJSONPath}`)

        fs.readFile(groupChatJSONPath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading file:', err);
                return;
            }

            // Parse the JSON data
            let jsonMessageData = JSON.parse(data);

            // Clear the contents (set to an empty object, array, etc.)
            jsonMessageData = '';

            // Convert back to JSON string
            const newData = JSON.stringify(jsonMessageData, null, 2); // null and 2 for pretty formatting

            // Write the modified data back to the file
            fs.writeFile(groupChatJSONPath, newData, 'utf8', (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                    return;
                }
                console.log('File contents cleared successfully.');
                res.redirect('/chatApplication/chat3')
                // res.send('<script>window.location.reload(true);</script>');
            });


        })
    })

    // To get users profile image if the phone number matches (Under Development)

    router.get("/api/chatuserinfo", async function (req, res) {
        const phoneNumber = await req.body.messageSenderPhone;
        console.log(phoneNumber)
        const query = `SELECT profileImage FROM phonebook WHERE phoneNumber = '${phoneNumber}'`;
        db.query(query, async function (error, data) {
            error ? console.log(error) : res.json(data);
        })

    })

    // New UI

    router.get("/index2", async function (req, res) {
        console.log(req);
        res.status(200).render("index2")
    })

    router.get("/login2", async function (req, res) {
        console.log(req);
        res.status(200).render("login2");
    })

    // Error Page

    router.get("/error", async function (req, res) {
        res.status(200).render("error", { error });
    })

    // Test Dynamic Route

    router.get("/users/:username", async function (req, res) {
        res.write(`Welcome ${req.params.username}`);
        res.end(`Test query param ${req.query.sort}`);
    })

    // Yash Chat UI (Currently the main one)

    router.get("/chat3", authenticateToken, async function (req, res) {
        
        res.render("chatApplication/chat3")

    })

    router.get("/logout", async function(req,res){
        res.clearCookie('token', { path: '/chat3' });
    res.redirect('/chatLogin'); // Redirect to the login page or any desired location
    })

    // Mail OTP Testing

    router.get("/sendMail", async function (req, res) {
        req ? console.log("SendMail page requested") : console.log("error");

        // Nodemailer Configuration for sending OTP Emails for socket.io based chat application

        // Transporter for sending emails (replace with your email service details)
        // const transporter = nodemailer.createTransport({
        //     service: 'gmail',
        //     auth: {
        //         user: process.env.NODEMAILER_CHAT_EMAIL,
        //         pass: process.env.NODEMAILER_CHAT_PW,
        //     },
        // });

        // const otp = 'test';

        // const mailOptions = {
        //     from: process.env.NODEMAILER_CHAT_EMAIL,
        //     to: 'r77fox3@gmail.com',
        //     subject: 'Your OTP for Authentication',
        //     text: `Your OTP is ${otp}`,
        // };

        // transporter.sendMail(mailOptions, (error) => {
        //     if (error) {
        //         console.error(error);
        //         res.json({ success: false, message: 'Failed to send OTP' });
        //     } else {
        //         res.json({ success: true, message: 'OTP sent successfully' });
        //     }
        // });


    })

    //   socket.on("clients-total",function(data){
    //     console.log(data);
    //   }) 

    //   // Handle events or emit messages as needed
    //   socket.on('message', (data) => {
    //     console.log('Message from server:', data);
    //   });

    //   // Example: Emit a message to the server
    //   socket.emit('clientMessage', 'Hello from the client!');

    // Default Error 404 Page

    router.get("*", async function (req, res) {
        res.send("Error 404");
    })

    module.exports = router;
