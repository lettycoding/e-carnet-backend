import express from 'express';
const router = express.Router();
import AuthController from '../controllers/authcontroller.js';

// Inscription d'un docteur
router.post('/register/doctor', AuthController.registerDoctor);

// Connexion d'un docteur
router.post('/login/doctor', AuthController.loginDoctor);

export default router;