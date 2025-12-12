import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import initializeDatabase from './script/init_database.js';
dotenv.config();

import authRoutes from './routes/authroutes.js';
import doctorRoutes from './routes/doctorroutes.js';
import patientRoutes from './routes/patientroutes.js';


import consultationRoutes from './routes/consultationroutes.js';

const app = express();

// Configuration CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/medical-records',consultationRoutes); // ← Ajout des routes de consultation

// Route de santé
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Serveur médical en cours d\'exécution',
        timestamp: new Date().toISOString()
    });
});

// Route racine
app.get('/', (req, res) => {
    res.json({
        message: 'API du Système Médical',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            doctors: '/api/doctors',
            patients: '/api/patients',
            medicalRecords: '/api/medical-records',
            consultations: '/api/consultations'
        }
    });
});

// Gestion des erreurs 404
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'Route non trouvée',
        path: req.originalUrl
    });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err.stack);
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Une erreur interne est survenue',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5000;

initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Serveur démarré sur le port ${PORT}`);
        console.log(`📝 Environnement: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌐 URL: http://localhost:${PORT}`);
        console.log('✅ Base de données initialisée avec succès');
    });
}).catch((error) => {
    console.error('❌ Échec de l\'initialisation de la base de données:', error);
    process.exit(1);
});

export default app;