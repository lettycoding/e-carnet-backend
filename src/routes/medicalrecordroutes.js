import express from 'express';
const router = express.Router();
import MedicalRecordController from '../controllers/medicalrecordcontroller.js';
import authMiddleware from '../middleware/authmiddleware.js';

// Accès public au carnet médical (avec code)
router.post('/access', MedicalRecordController.accessMedicalRecord);

// Routes protégées pour les docteurs
router.post('/:medical_record_id/consultations', 
    authMiddleware.authenticateDoctor, 
    MedicalRecordController.addConsultation
);

router.put('/:medical_record_id', 
    authMiddleware.authenticateDoctor, 
    MedicalRecordController.updateMedicalInfo
);

router.post('/fingerprint/search', 
    authMiddleware.authenticateDoctor, 
    MedicalRecordController.getRecordByFingerprint
);

export default router;