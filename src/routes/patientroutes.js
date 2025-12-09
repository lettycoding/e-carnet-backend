import express from 'express';
const router = express.Router();
import PatientController from '../controllers/patientcontroller.js';
import authMiddleware from '../middleware/authmiddleware.js';
import multer from 'multer';

// Configuration de Multer pour les uploads d'images
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/fingerprints/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Routes protégées pour les docteurs
router.post('/create', authMiddleware.authenticateDoctor, PatientController.createPatient);
router.get('/search', authMiddleware.authenticateDoctor, PatientController.searchPatientByName);
router.post('/search/fingerprint', authMiddleware.authenticateDoctor, PatientController.searchByFingerprint);
router.get('/doctor/patients', authMiddleware.authenticateDoctor, PatientController.getDoctorPatients);

// Ajouter une empreinte digitale
router.post('/:patient_id/fingerprint', 
    authMiddleware.authenticateDoctor, 
    upload.single('fingerprint_image'),
    PatientController.addFingerprint
);

export default router;