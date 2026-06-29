const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Ρύθμιση Socket.IO για να επιτρέπει συνδέσεις από παντού (CORS)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Σερβίρισμα του αρχείου index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Διαχείριση συνδέσεων
io.on('connection', (socket) => {
    console.log('Χρήστης συνδέθηκε');

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg); // Αναμετάδοση σε όλους
    });

    socket.on('disconnect', () => {
        console.log('Χρήστης αποσυνδέθηκε');
    });
});

// ΠΟΛΥ ΣΗΜΑΝΤΙΚΟ: Παίρνει τη θύρα του Server ή χρησιμοποιεί την 3000 τοπικά
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Το chat τρέχει στη θύρα ${PORT}`);
});