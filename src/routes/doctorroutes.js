



import express from 'express';
const router = express.Router();
import DoctorController from '../controllers/doctorcontroller.js';
import authMiddleware from '../middleware/authmiddleware.js';
import validationMiddleware from '../middleware/validationmiddleware.js';
import PatientController from '../controllers/patientcontroller.js';

// ==================== ROUTES PROTÉGÉES POUR LES DOCTEURS ====================

// Récupérer le profil du docteur
router.get('/profile', 
    authMiddleware.authenticateDoctor,
    DoctorController.getProfile
);

// Mettre à jour le profil du docteur
router.put('/profile', 
    authMiddleware.authenticateDoctor,
    DoctorController.updateProfile
);

// Changer le mot de passe
router.put('/change-password',
    authMiddleware.authenticateDoctor,
    DoctorController.changePassword
);

// Obtenir les statistiques du docteur
router.get('/statistics',
    authMiddleware.authenticateDoctor,
    DoctorController.getStatistics
);

// Rechercher un carnet médical
router.get('/search',
    authMiddleware.authenticateDoctor,
    validationMiddleware.validateSearch,
    DoctorController.searchMedicalRecord
);

// Obtenir tous les carnets médicaux gérés
router.get('/medical-records',
    authMiddleware.authenticateDoctor,
    DoctorController.getAllMedicalRecords
);

// ==================== ROUTES POUR LA GESTION DES PATIENTS ====================

// Créer un nouveau patient (déjà dans patientRoutes.js mais accessible ici aussi via docteur)
// Note: Cette route est dupliquée pour la commodité du docteur
router.post('/patients',
    authMiddleware.authenticateDoctor,
    validationMiddleware.validatePatientCreation,
    validationMiddleware.handleValidationErrors,
    PatientController.createPatient // Note: Vous devrez adapter ou créer cette méthode
);

// ==================== ROUTES POUR LES RAPPORTS ====================

// Générer un rapport des consultations du mois
router.get('/reports/monthly-consultations',
    authMiddleware.authenticateDoctor,
    async (req, res) => {
        try {
            const doctorId = req.user.id;
            const { month, year } = req.query;
            
            const queryDate = `${year || new Date().getFullYear()}-${month || new Date().getMonth() + 1}-01`;
            
            const [consultations] = await pool.execute(
                `SELECT 
                    c.id,
                    c.consultation_date,
                    p.full_name as patient_name,
                    c.symptoms,
                    c.diagnosis,
                    c.prescription
                 FROM consultations c
                 JOIN medical_records mr ON c.medical_record_id = mr.id
                 JOIN patients p ON mr.patient_id = p.id
                 WHERE c.doctor_id = ? 
                 AND MONTH(c.consultation_date) = MONTH(?)
                 AND YEAR(c.consultation_date) = YEAR(?)
                 ORDER BY c.consultation_date DESC`,
                [doctorId, queryDate, queryDate]
            );
            
            res.json({
                report: {
                    month: month || new Date().getMonth() + 1,
                    year: year || new Date().getFullYear(),
                    total_consultations: consultations.length,
                    consultations
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to generate report' });
        }
    }
);

// Obtenir le nombre de patients par mois (pour graphiques)
router.get('/reports/patient-growth',
    authMiddleware.authenticateDoctor,
    async (req, res) => {
        try {
            const doctorId = req.user.id;
            
            const [growthData] = await pool.execute(
                `SELECT 
                    DATE_FORMAT(created_at, '%Y-%m') as month,
                    COUNT(*) as patient_count
                 FROM patients
                 WHERE created_by = ?
                 GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                 ORDER BY month DESC
                 LIMIT 12`,
                [doctorId]
            );
            
            res.json({
                growth_data: growthData
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch growth data' });
        }
    }
);

// ==================== ROUTES POUR LES NOTIFICATIONS ====================

// Obtenir les notifications du docteur
router.get('/notifications',
    authMiddleware.authenticateDoctor,
    async (req, res) => {
        try {
            const doctorId = req.user.id;
            
            // Exemple: Patients sans consultation depuis plus d'un an
            const [inactivePatients] = await pool.execute(
                `SELECT p.id, p.full_name, p.unique_code, 
                 MAX(c.consultation_date) as last_consultation
                 FROM patients p
                 LEFT JOIN medical_records mr ON p.id = mr.patient_id
                 LEFT JOIN consultations c ON mr.id = c.medical_record_id
                 WHERE p.created_by = ?
                 GROUP BY p.id
                 HAVING last_consultation IS NULL OR 
                        last_consultation < DATE_SUB(CURRENT_DATE(), INTERVAL 1 YEAR)
                 LIMIT 10`,
                [doctorId]
            );
            
            res.json({
                notifications: {
                    inactive_patients: inactivePatients,
                    count: inactivePatients.length
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch notifications' });
        }
    }
);

// ==================== ROUTES POUR L'EXPORT DE DONNÉES ====================

// Exporter les données d'un patient (PDF/CSV)
router.get('/export/patient/:patient_id',
    authMiddleware.authenticateDoctor,
    validationMiddleware.validateIdParam,
    async (req, res) => {
        try {
            const doctorId = req.user.id;
            const patientId = req.params.patient_id;
            
            // Vérifier que le docteur a accès à ce patient
            const [patient] = await pool.execute(
                'SELECT * FROM patients WHERE id = ? AND created_by = ?',
                [patientId, doctorId]
            );
            
            if (patient.length === 0) {
                return res.status(403).json({ error: 'Access denied to this patient' });
            }
            
            // Récupérer toutes les données du patient
            const [patientData] = await pool.execute(
                `SELECT p.*, mr.*, 
                 d.full_name as doctor_name,
                 d.license_number as doctor_license
                 FROM patients p
                 LEFT JOIN medical_records mr ON p.id = mr.patient_id
                 LEFT JOIN doctors d ON mr.doctor_id = d.id
                 WHERE p.id = ?`,
                [patientId]
            );
            
            const [consultations] = await pool.execute(
                `SELECT * FROM consultations 
                 WHERE medical_record_id = (SELECT id FROM medical_records WHERE patient_id = ?)
                 ORDER BY consultation_date DESC`,
                [patientId]
            );
            
            const [exams] = await pool.execute(
                `SELECT * FROM exam_results 
                 WHERE medical_record_id = (SELECT id FROM medical_records WHERE patient_id = ?)
                 ORDER BY exam_date DESC`,
                [patientId]
            );
            
            // Format de réponse selon le type demandé
            const format = req.query.format || 'json';
            
            if (format === 'json') {
                res.json({
                    patient: patientData[0],
                    consultations,
                    exams,
                    exported_at: new Date().toISOString(),
                    exported_by: doctorId
                });
            } else if (format === 'csv') {
                // Convertir en CSV (simplifié)
                let csv = 'Patient Data\n';
                csv += Object.keys(patientData[0]).join(',') + '\n';
                csv += Object.values(patientData[0]).join(',') + '\n\n';
                
                csv += 'Consultations\n';
                if (consultations.length > 0) {
                    csv += Object.keys(consultations[0]).join(',') + '\n';
                    consultations.forEach(consultation => {
                        csv += Object.values(consultation).join(',') + '\n';
                    });
                }
                
                res.header('Content-Type', 'text/csv');
                res.header('Content-Disposition', `attachment; filename=patient_${patientId}_${Date.now()}.csv`);
                res.send(csv);
            } else {
                res.status(400).json({ error: 'Unsupported export format' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to export patient data' });
        }
    }
);

export default router;