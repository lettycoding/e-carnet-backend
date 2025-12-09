import { body, param, query, validationResult } from 'express-validator';
import pool from '../config/database.js';

const validationMiddleware = {
    // Validation pour l'inscription du docteur
    validateDoctorRegistration: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address')
            .custom(async (email) => {
                const [rows] = await pool.execute('SELECT id FROM doctors WHERE email = ?', [email]);
                if (rows.length > 0) {
                    throw new Error('Email already registered');
                }
                return true;
            }),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
        body('full_name')
            .notEmpty()
            .withMessage('Full name is required')
            .isLength({ min: 3, max: 255 })
            .withMessage('Full name must be between 3 and 255 characters'),
        body('license_number')
            .notEmpty()
            .withMessage('Medical license number is required')
            .custom(async (licenseNumber) => {
                const [rows] = await pool.execute('SELECT id FROM doctors WHERE license_number = ?', [licenseNumber]);
                if (rows.length > 0) {
                    throw new Error('License number already registered');
                }
                return true;
            }),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        }
    ],
    
    // Validation pour la connexion du docteur
    validateDoctorLogin: [
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email address'),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        }
    ],
    
    // Validation pour la création de patient
    validatePatientCreation: [
        body('full_name')
            .notEmpty()
            .withMessage('Full name is required')
            .isLength({ min: 3, max: 255 })
            .withMessage('Full name must be between 3 and 255 characters'),
        body('date_of_birth')
            .notEmpty()
            .withMessage('Date of birth is required')
            .isISO8601()
            .withMessage('Date of birth must be in YYYY-MM-DD format')
            .custom((value) => {
                const birthDate = new Date(value);
                const today = new Date();
                if (birthDate > today) {
                    throw new Error('Date of birth cannot be in the future');
                }
                return true;
            }),
        body('gender')
            .isIn(['male', 'female', 'other'])
            .withMessage('Gender must be male, female, or other'),
        body('email')
            .optional()
            .isEmail()
            .withMessage('Please provide a valid email address'),
        body('phone_number')
            .optional()
            .matches(/^\+?[1-9]\d{1,14}$/)
            .withMessage('Please provide a valid phone number'),
        body('medical_info.blood_type')
            .optional()
            .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
            .withMessage('Invalid blood type'),
        body('medical_info.height')
            .optional()
            .isFloat({ min: 30, max: 250 })
            .withMessage('Height must be between 30 and 250 cm'),
        body('medical_info.weight')
            .optional()
            .isFloat({ min: 1, max: 300 })
            .withMessage('Weight must be between 1 and 300 kg'),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        }
    ],
    
    // Validation pour l'ajout de consultation
    validateConsultation: [
        body('consultation_date')
            .notEmpty()
            .withMessage('Consultation date is required')
            .isISO8601()
            .withMessage('Consultation date must be in ISO 8601 format'),
        body('symptoms')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Symptoms cannot exceed 1000 characters'),
        body('diagnosis')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Diagnosis cannot exceed 1000 characters'),
        body('prescription')
            .optional()
            .isLength({ max: 1000 })
            .withMessage('Prescription cannot exceed 1000 characters'),
        body('notes')
            .optional()
            .isLength({ max: 2000 })
            .withMessage('Notes cannot exceed 2000 characters'),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        }
    ],
    
    // Validation pour la recherche
    validateSearch: [
        query('search_term')
            .notEmpty()
            .withMessage('Search term is required')
            .isLength({ min: 2 })
            .withMessage('Search term must be at least 2 characters'),
        query('search_type')
            .isIn(['patient_name', 'record_code', 'patient_code'])
            .withMessage('Search type must be one of: patient_name, record_code, patient_code'),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        }
    ],
    
    // Validation pour les paramètres d'ID
    validateIdParam: [
        param('id')
            .isInt({ min: 1 })
            .withMessage('ID must be a positive integer'),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        }
    ],
    
    // Validation pour l'accès au carnet médical
    validateMedicalRecordAccess: [
        body('record_code')
            .notEmpty()
            .withMessage('Record code is required')
            .matches(/^MR-[A-Z0-9]{8}$/)
            .withMessage('Record code must be in format MR-XXXXXXX (8 alphanumeric characters)'),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        }
    ],
    
    // Validation pour les empreintes digitales
    validateFingerprintSearch: [
        body('fingerprint_data')
            .notEmpty()
            .withMessage('Fingerprint data is required')
            .isLength({ min: 64, max: 256 })
            .withMessage('Fingerprint data must be between 64 and 256 characters'),
        (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        }
    ],
    
    // Middleware de gestion d'erreurs de validation
    handleValidationErrors: (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array().map(err => ({
                    field: err.param,
                    message: err.msg
                }))
            });
        }
        next();
    }
};

export default validationMiddleware;