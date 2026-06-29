const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000; // Ρυθμισμένο για Render

// Επιτρέπουμε μεγάλα αρχεία για να μην κολλάνε οι φωτογραφίες και τα GIF
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));

// Αποθήκευση στη μνήμη του server (Όχι Google, Όχι Firebase)
let messages = [];
let onlineUsers = {}; 

// Αρχική σελίδα
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint για λήψη μηνυμάτων
app.get('/api/messages', (req, res) => {
    const requestingUser = req.query.user;
    if (!requestingUser) return res.json(messages.filter(m => !m.to)); 

    const filteredMessages = messages.filter(m => {
        return !m.to || m.user === requestingUser || m.to === requestingUser;
    });

    res.json(filteredMessages);
});

// Endpoint για αποστολή μηνύματος
app.post('/api/messages', (req, res) => {
    const { user, text, image, to, avatar } = req.body;
    if (!user) return res.status(400).json({ error: 'Missing user' });

    const newMessage = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        user,
        avatar: avatar || null, // Αποθήκευση του avatar στο μήνυμα
        text: text || "",
        image: image || null,
        to: to || null, 
        timestamp: Date.now()
    };

    messages.push(newMessage);
    
    // Αν ο χρήστης έστειλε μήνυμα με avatar, ενημερώνουμε και τη λίστα presence
    if (avatar && onlineUsers[user]) {
        onlineUsers[user].avatar = avatar;
    }
    
    if (messages.length > 100) messages.shift(); 

    res.status(201).json(newMessage);
});

// Endpoint για ενημέρωση παρουσίας (Τώρα αποθηκεύει και το avatar!)
app.post('/api/presence', (req, res) => {
    const { user, avatar } = req.body;
    if (user) {
        // Αποθηκεύουμε πλέον αντικείμενο με το πότε εθεάθη ΚΑΙ το avatar του
        onlineUsers[user] = {
            lastSeen: Date.now(),
            avatar: avatar || (onlineUsers[user] ? onlineUsers[user].avatar : "")
        };
    }
    res.sendStatus(200);
});

// Endpoint για λήψη ενεργών χρηστών (Στέλνει πίσω όνομα ΚΑΙ avatar)
app.get('/api/presence', (req, res) => {
    const cutoff = Date.now() - 20000; 
    const active = [];
    
    for (const [username, userData] of Object.entries(onlineUsers)) {
        if (userData.lastSeen > cutoff && !username.startsWith("Guest_")) {
            active.push({
                user: username,
                avatar: userData.avatar || ""
            });
        }
    }
    res.json(active);
});

// Endpoint για έξοδο χρήστη
app.post('/api/logout', (req, res) => {
    const { user } = req.body;
    if (user && onlineUsers[user]) {
        delete onlineUsers[user];
    }
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`To chat τρέχει στη θύρα ${PORT}`);
});