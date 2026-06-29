const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e7 // Επιτρέπει ανέβασμα εικόνων έως 10MB
});

const PORT = process.env.PORT || 3000;

// Σερβίρισμα των στατικών αρχείων (HTML, εικόνες κλπ)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Αποθήκευση των ενεργών χρηστών στη μνήμη του server
let activeUsers = new Set();
// Κρατάμε τα τελευταία 50 μηνύματα στη μνήμη για να τα βλέπει όποιος μπαίνει
let messageHistory = [];

io.on('connection', (socket) => {
    let myUsername = null;

    // Στέλνουμε το ιστορικό των μηνυμάτων στον νέο χρήστη
    socket.emit('chat-history', messageHistory);

    // Όταν ένας χρήστης κάνει είσοδο
    socket.on('register-user', (username) => {
        myUsername = username;
        activeUsers.add(username);
        // Ενημέρωση όλων για τη νέα λίστα χρηστών
        io.emit('update-users', Array.from(activeUsers));
    });

    // Όταν έρχεται ένα νέο μήνυμα (κείμενο ή εικόνα)
    socket.on('send-message', (data) => {
        if (!myUsername) return;

        const msgObject = {
            user: myUsername,
            text: data.text || "",
            image: data.image || null,
            timestamp: Date.now()
        };

        // Προσθήκη στο ιστορικό
        messageHistory.push(msgObject);
        if (messageHistory.length > 50) messageHistory.shift();

        // Εκπομπή του μηνύματος σε όλους
        io.emit('new-message', msgObject);
    });

    // Όταν αποσυνδέεται ένας χρήστης
    socket.on('disconnect', () => {
        if (myUsername) {
            activeUsers.delete(myUsername);
            io.emit('update-users', Array.from(activeUsers));
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});