import express from 'express';
import { body, param } from 'express-validator'; // Ajout de cet import
import ConsultationController from '../controllers/consultationcontroller.js';
import authMiddleware from '../middleware/authmiddleware.js';
import validationMiddleware from '../middleware/validationmiddleware.js';

const router = express.Router();

// Validation pour la création de consultation
const validateConsultationCreation = [
    body('plaintes')
        .notEmpty()
        .withMessage('Les plaintes du patient sont requises')
        .isLength({ min: 3, max: 1000 })
        .withMessage('Les plaintes doivent contenir entre 3 et 1000 caractères'),
    body('examen')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('L\'examen ne peut pas dépasser 1000 caractères'),
    body('prescription')
        .optional()
        .isLength({ max: 500 })
        .withMessage('La prescription ne peut pas dépasser 500 caractères'),
    body('prochain_rdv')
        .optional()
        .isISO8601()
        .withMessage('La date du prochain rendez-vous doit être au format YYYY-MM-DD'),
    body('notes')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Les notes ne peuvent pas dépasser 2000 caractères'),
    validationMiddleware.handleValidationErrors
];

// Validation pour la mise à jour de consultation
const validateConsultationUpdate = [
    body('plaintes')
        .optional()
        .isLength({ min: 3, max: 1000 })
        .withMessage('Les plaintes doivent contenir entre 3 et 1000 caractères'),
    body('examen')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('L\'examen ne peut pas dépasser 1000 caractères'),
    body('prescription')
        .optional()
        .isLength({ max: 500 })
        .withMessage('La prescription ne peut pas dépasser 500 caractères'),
    body('prochain_rdv')
        .optional()
        .isISO8601()
        .withMessage('La date du prochain rendez-vous doit être au format YYYY-MM-DD'),
    body('notes')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('Les notes ne peuvent pas dépasser 2000 caractères'),
    validationMiddleware.handleValidationErrors
];

// Validation des paramètres ID
const validateMedicalRecordId = [
    param('medicalRecordId')
        .isInt({ min: 1 })
        .withMessage('L\'ID du carnet médical doit être un nombre entier positif'),
    validationMiddleware.handleValidationErrors
];

const validateConsultationId = [
    param('consultationId')
        .isInt({ min: 1 })
        .withMessage('L\'ID de consultation doit être un nombre entier positif'),
    validationMiddleware.handleValidationErrors
];

const validatePatientId = [
    param('patientId')
        .isInt({ min: 1 })
        .withMessage('L\'ID du patient doit être un nombre entier positif'),
    validationMiddleware.handleValidationErrors
];

// Routes protégées pour les médecins
router.post('/medical-records/:medicalRecordId/consultations', 
    authMiddleware.authenticateDoctor,
    validateMedicalRecordId,
    validateConsultationCreation,
    ConsultationController.createConsultation
);

router.get('/medical-records/:medicalRecordId/consultations', 
    authMiddleware.authenticateDoctor,
    validateMedicalRecordId,
    ConsultationController.getConsultations
);

router.get('/consultations/:consultationId', 
    authMiddleware.authenticateDoctor,
    validateConsultationId,
    ConsultationController.getConsultationDetail
);

router.put('/consultations/:consultationId', 
    authMiddleware.authenticateDoctor,
    validateConsultationId,
    validateConsultationUpdate,
    ConsultationController.updateConsultation
);

router.delete('/consultations/:consultationId', 
    authMiddleware.authenticateDoctor,
    validateConsultationId,
    ConsultationController.deleteConsultation
);

// Route pour obtenir toutes les consultations d'un patient
router.get('/patients/:patientId/consultations', 
    authMiddleware.authenticateDoctor,
    validatePatientId,
    ConsultationController.getPatientConsultations
);

export default router;