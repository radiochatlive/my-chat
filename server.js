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

// Endpoint για λήψη μηνυμάτων (Φιλτράρει αυτόματα τα πριβέ ανάλογα με το ποιος τα ζητάει)
app.get('/api/messages', (req, res) => {
    const requestingUser = req.query.user;
    if (!requestingUser) return res.json(messages.filter(m => !m.to)); // Αν δεν λέει χρήστη, δείξε μόνο τα δημόσια

    // Δείξε τα μηνύματα που είναι: δημόσια Ή στάλθηκαν από αυτόν Ή στάλθηκαν σε αυτόν
    const filteredMessages = messages.filter(m => {
        return !m.to || m.user === requestingUser || m.to === requestingUser;
    });

    res.json(filteredMessages);
});

// Endpoint για αποστολή μηνύματος (Υποστηρίζει πλέον και το πεδίο "to" για πριβέ)
app.post('/api/messages', (req, res) => {
    const { user, text, image, to } = req.body;
    if (!user) return res.status(400).json({ error: 'Missing user' });

    const newMessage = {
        id: Date.now() + Math.random().toString(36).substr(2, 5),
        user,
        text: text || "",
        image: image || null,
        to: to || null, // Αν έχει όνομα, είναι πριβέ. Αν είναι null, πάει στο γενικό.
        timestamp: Date.now()
    };

    messages.push(newMessage);
    
    // Έξυπνος κόφτης: Κρατάει τα τελευταία 100 μηνύματα γενικά για να μην φουσκώνει η RAM
    if (messages.length > 100) messages.shift(); 

    res.status(201).json(newMessage);
});

// Endpoint για ενημέρωση ότι ο χρήστης είναι online
app.post('/api/presence', (req, res) => {
    const { user } = req.body;
    if (user) {
        onlineUsers[user] = Date.now();
    }
    res.sendStatus(200);
});

// Endpoint για λήψη ενεργών χρηστών
app.get('/api/presence', (req, res) => {
    const cutoff = Date.now() - 20000; // Όποιος δεν έδωσε σήμα για 20 δεύτερα θεωρείται offline
    const active = [];
    for (const [username, lastSeen] of Object.entries(onlineUsers)) {
        if (lastSeen > cutoff && !username.startsWith("Guest_")) {
            active.push(username);
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