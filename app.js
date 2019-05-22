const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb+srv://jdaake:KIsMYluCDtG8RnPi@cluster0-ndib1.mongodb.net/messages';
const multer = require('multer');
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');
const app = express();
const port = 8080;
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

app.use(bodyParser.json()); // used for application/json file type
app.use(multer({
        storage: fileStorage,
        fileFilter: fileFilter
    })
    .single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({
        message: message,
        data: data
    });
});

mongoose.connect(MONGODB_URI)
    .then(result => {
        const server = app.listen(port);
        const io = require('./socket').init(server);
        console.log(`App is listing on port ${port}!`);
        io.on('connection', socket => {
            console.log('client connected');
        });
    })
    .catch(err => console.log(err));