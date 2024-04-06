const cheerio = require('cheerio');

// File system import

const fs = require('fs');
const path = require('path');
// Database connection

const mysql = require('mysql');
const db = mysql.createConnection({
    host: process.env.DB1_HOST,
    user: process.env.DB1_USER,
    password: process.env.DB1_PASSWORD,
    database: process.env.DB1
})

// Login Data

const db2 = mysql.createConnection({
    hosts: process.env.DB2_HOST,
    user: process.env.DB2_USER,
    password: process.env.DB2_PASSWORD,
    database: process.env.DB2
})

// Establishing Database Connections

db2.connect(function (error) {
    if(error){console.log(`Error ${error}`)};
})
db.connect(function (error) {
    if(error){console.log(`Error ${error}`)};
});

// Storage Processing Middleware


// Storage configuration for drive storage

// Multer configuration

// Storage Processing Middleware
const multer = require('multer');
// const { path } = require('pdfkit');
const storage = multer.memoryStorage();

const imagesPath = path.join(__dirname, "../dev-data/uploads");
console.log(imagesPath)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesPath);
  },
  filename: (req, file, cb) => {
    console.log(file);
    const fileName = Date.now() + path.extname(file.originalname)
    cb(null, Date.now() + fileName);
  }
})
const upload = multer({ storage: diskStorage });

// Storage configuration for drive storage

// Multer configuration

// Login POST Request 
exports.login = async function (req, res) {
    const { email, password } = req.body; // Getting Email and Password from the login form
    console.log(email, password);
    res.send("Under construction")
}

//Registration Post Request
exports.register = async function (req, res) {
    console.log(req.body);

    // Verifying User Credentials

    db.query('SELECT email FROM users WHERE email = ?', [email], function (error, result) {
        if (error) {
            console.log(error);
        }
        if (result.length > 0) {
            return res.render('register', {
                message: 'That email is already in use'
            })
        }

        else if (password != confirmPassword) {
            return res.render('register', {
                message: 'Passwords do not match'
            });
        }
    })
}

exports.phonebook = async function (req, res) {
    console.log(req);
}

// Add Contact 

exports.addContactPhonebook = async function (req, res) {
    try {
        // if (req.is('application/json')) {
            // Handle JSON Data
            const { firstName, lastName, companyName, department, job, phoneNumber, designation, addGroupPhonebook, emailAddressPhonebook, cityPb, statePb, countryPb } = req.body.formData;
          
            const profileImage = req.file; // Assuming one file is uploaded
        
            if(req.file){
                
            // Storing Contact Details in the database
            const query = 'INSERT INTO phonebook (firstName, lastName, phoneNumber, designation, department, jobName, companyName, groupName, emailAddress, city, state, country, profileImage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            const profileImageName = await profileImage.filename;
            db.query(query, [firstName, lastName, phoneNumber, designation, department, job, companyName, addGroupPhonebook, emailAddressPhonebook, cityPb, statePb, countryPb, profileImageName], function (error, result) {
                if (error) {
                    console.log(error);
                    res.status(500).json(error);
                } else {
                    res.json(result);
                }
            });
        }
        else{
            // Storing Contact Details in the database
            const query = 'INSERT INTO phonebook (firstName, lastName, phoneNumber, designation, department, jobName, companyName, groupName, emailAddress, city, state, country) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
            db.query(query, [firstName, lastName, phoneNumber, designation, department, job, companyName, addGroupPhonebook, emailAddressPhonebook, cityPb, statePb, countryPb], function (error, result) {
                if (error) {
                    console.log(error);
                    res.status(500).json(error);
                } else {
                    res.json(result);
                }
            });
        }
            const profileImagePhoto = req.file;
            console.log(profileImagePhoto);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.editContactPhonebook = async function (req, res) {

    let { editFirstName, editLastName, editCompanyName, editPhoneNumber, editDepartment, editJob, editDesignation, editContactId, editCityPb, editStatePb, editGroupPb, editEmailAddress} = await req.body;
    editContactId = Number(editContactId)

     console.log(`Global current image ${global.currentImageFile}`)
     
    const editProfileImage = await req.file; // Assuming one file is uploaded
    let editProfileImageName;
    let editProfileImage2;

    editProfileImageName = await editProfileImage ? await editProfileImage.filename : console.log("Image does not exist");
    

    // Validation for duplicate query
    const duplicateCheckQuery = 'SELECT COUNT(*) AS count FROM phonebook WHERE phoneNumber = ? AND id !=?';
    const duplicateCheckResult =  await db.query(duplicateCheckQuery, [editPhoneNumber, editContactId]);
    console.log(duplicateCheckResult);

    if (duplicateCheckResult.length > 0) {
        // Duplicate phone number found, handle the error
        const duplicateError = 'Duplicate phone number found. Please use a different phone number.';
        res.json(error);
    }
    else {

        if(req.file){

            const currentImageQuery = 'SELECT profileImage from phonebook WHERE id = ?';
     
            await db.query(currentImageQuery,[editContactId],async function(error,data){
                if(error){
                    console.log(error)
                }
                else if(data){
                   console.log('Current image name fetched from database',data);
                   currentImage =   await data;
                   currentImageName = await data[0].profileImage;
                   global.currentImageFile = await data;
                   console.log('currentImage', currentImage);
                   console.log('currentImageName', currentImageName)
                   currentImageName;
                   fs.unlink(imagesPath + '/' + currentImageName, (err) => {
                       if (err) {
                         console.error('Error deleting file:', err);
                       } else {
                         console.log('File deleted successfully');
                       }
                     });
                }
            })

            const query = `
          UPDATE phonebook 
          SET 
            firstName = ?,
            lastName = ?,
            phoneNumber = ?,
            designation = ?,
            department = ?,
            companyName = ?,
            jobName = ?,
            emailAddress = ?,
            city = ?,
            state = ?,
            profileImage = ?,
            groupName = ?
          WHERE id = ?
        `;
    
            await db.query(query, [editFirstName, editLastName, editPhoneNumber, editDesignation, editDepartment, editCompanyName, editJob, editEmailAddress, editCityPb, editStatePb, editProfileImageName, editGroupPb, editContactId,], async function (error, results) {
                if (error) {
                    console.error(error);
                    const updateError = `Error Updating Data ${error}`;
    
                    await res.json(error)
               
                }
                else {
                    const success = `Contact updated successfully`;
                    console.log(results)
                    await res.json(results)
                  
                }
            });
        }

        else{
            const query = `
            UPDATE phonebook 
            SET 
              firstName = ?,
              lastName = ?,
              phoneNumber = ?,
              designation = ?,
              department = ?,
              companyName = ?,
              jobName = ?,
              emailAddress = ?,
              city = ?,
              state = ?,
              groupName = ?
            WHERE id = ?
          `;
        
              await db.query(query, [editFirstName, editLastName, editPhoneNumber, editDesignation, editDepartment, editCompanyName, editJob, editEmailAddress, editCityPb, editStatePb, editGroupPb, editContactId,], async function (error, results) {
                  if (error) {
                      console.error(error);
                      const updateError = `Error Updating Data ${error}`;
      
                      await res.json(error)
                 
                  }
                  else {
                      const success = `Contact updated successfully`;
                      console.log(results)
                      await res.json(results)
                  }
              });
        }

    }
}
