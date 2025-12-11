import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import initializeDatabase from './script/init_database.js';
dotenv.config();

import authRoutes from './routes/authroutes.js';
import doctorRoutes from './routes/doctorroutes.js';
import patientRoutes from './routes/patientroutes.js';
import medicalRecordRoutes from './routes/medicalrecordroutes.js';





const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// In app.js, update CORS config


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medical-records', medicalRecordRoutes);

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;

initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

export default app;