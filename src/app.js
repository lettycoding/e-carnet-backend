import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import initializeDatabase from './script/init_database.js';
dotenv.config();

import authRoutes from './routes/authroutes.js';
import doctorRoutes from './routes/doctorroutes.js';
import patientRoutes from './routes/patientroutes.js';
import pool from './config/database.js';


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
app.post('/api/medical-records/access', async (req, res) => {
  try {
    const { record_code } = req.body;
    
    if (!record_code) {
      return res.status(400).json({ error: 'Record code is required' });
    }
    
    // Chercher le carnet médical
    const medicalRecordResult = await pool.query(
      `SELECT 
          mr.*,
          p.full_name as patient_name,
          p.date_of_birth,
          p.gender,
          p.phone_number,
          p.email,
          p.address,
          p.emergency_contact
       FROM medical_records mr
       JOIN patients p ON mr.patient_id = p.id
       WHERE mr.record_code = $1`,
      [record_code]
    );
    
    if (medicalRecordResult.rows.length === 0) {
      return res.status(404).json({ error: 'Medical record not found' });
    }
    
    const medicalRecord = medicalRecordResult.rows[0];
    
    // Récupérer les consultations
    const consultationsResult = await pool.query(
      `SELECT 
          c.id,
          c.consultation_date,
          c.symptoms,
          c.diagnosis,
          c.prescription,
          c.notes,
          c.created_at,
          d.full_name as doctor_name
       FROM consultations c
       LEFT JOIN doctors d ON c.doctor_id = d.id
       WHERE c.medical_record_id = $1
       ORDER BY c.consultation_date DESC`,
      [medicalRecord.id]
    );
    
    res.json({
      success: true,
      medical_record: medicalRecord,
      consultations: consultationsResult.rows
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to access medical record' 
    });
  }
});

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