import jwt from 'jsonwebtoken';
import Doctor from '../models/doctor.js';

class AuthController {
    static async registerDoctor(req, res) {
        try {
            const { email, password, full_name, license_number, specialization } = req.body;
            
            // Vérifier si le médecin existe déjà
            const existingDoctor = await Doctor.findByEmail(email);
            if (existingDoctor) {
                return res.status(400).json({ error: 'Doctor already exists' });
            }
            
            // Créer le médecin
            const doctorId = await Doctor.create(email, password, full_name, license_number, specialization);
            
            // Générer un token JWT
            const token = jwt.sign(
                { id: doctorId, email, role: 'doctor' },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );
            
            res.status(201).json({
                message: 'Doctor registered successfully',
                token,
                doctor: {
                    id: doctorId,
                    email,
                    full_name,
                    license_number,
                    specialization
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
    
    static async loginDoctor(req, res) {
        try {
            const { email, password } = req.body;
            
            // Trouver le médecin
            const doctor = await Doctor.findByEmail(email);
            if (!doctor) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Vérifier le mot de passe
            const isValidPassword = await Doctor.comparePassword(password, doctor.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Générer un token JWT
            const token = jwt.sign(
                { id: doctor.id, email: doctor.email, role: 'doctor' },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '24h' }
            );
            
            res.json({
                message: 'Login successful',
                token,
                doctor: {
                    id: doctor.id,
                    email: doctor.email,
                    full_name: doctor.full_name,
                    license_number: doctor.license_number,
                    specialization: doctor.specialization
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Login failed' });
        }
    }
}

export default AuthController;