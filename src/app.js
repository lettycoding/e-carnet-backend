import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;