import pool from '../config/database.js';
import Doctor from '../models/doctor.js';
import bcrypt from 'bcryptjs';

class DoctorController {
    // Obtenir le profil du docteur
    static async getProfile(req, res) {
        try {
            const doctorId = req.user.id;
            const doctor = await Doctor.findById(doctorId);
            
            if (!doctor) {
                return res.status(404).json({ error: 'Doctor not found' });
            }
            
            // Ne pas envoyer le mot de passe
            delete doctor.password;
            
            res.json({
                doctor
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch profile' });
        }
    }
    
    // Mettre à jour le profil du docteur
    static async updateProfile(req, res) {
        try {
            const doctorId = req.user.id;
            const { full_name, specialization, phone_number } = req.body;
            
            // Construire la requête dynamiquement
            const fields = [];
            const values = [];
            let paramCount = 1;
            
            if (full_name) {
                fields.push(`full_name = $${paramCount}`);
                values.push(full_name);
                paramCount++;
            }
            
            if (specialization) {
                fields.push(`specialization = $${paramCount}`);
                values.push(specialization);
                paramCount++;
            }
            
            if (phone_number) {
                fields.push(`phone_number = $${paramCount}`);
                values.push(phone_number);
                paramCount++;
            }
            
            if (fields.length === 0) {
                return res.status(400).json({ error: 'No data to update' });
            }
            
            values.push(doctorId);
            
            await pool.query(
                `UPDATE doctors SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`,
                values
            );
            
            // Récupérer les données mises à jour
            const updatedDoctor = await Doctor.findById(doctorId);
            delete updatedDoctor.password;
            
            res.json({
                message: 'Profile updated successfully',
                doctor: updatedDoctor
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }
    
    // Obtenir les statistiques du docteur
    static async getStatistics(req, res) {
        try {
            const doctorId = req.user.id;
            
            // Compter les patients créés
            const patientCountResult = await pool.query(
                'SELECT COUNT(*) as count FROM patients WHERE created_by = $1',
                [doctorId]
            );
            
            // Compter les consultations du mois
            const consultationCountResult = await pool.query(
                `SELECT COUNT(*) as count FROM consultations c
                 JOIN medical_records mr ON c.medical_record_id = mr.id
                 WHERE mr.doctor_id = $1 AND EXTRACT(MONTH FROM c.consultation_date) = EXTRACT(MONTH FROM CURRENT_DATE)`,
                [doctorId]
            );
            
            // Derniers patients ajoutés
            const recentPatientsResult = await pool.query(
                `SELECT p.id, p.full_name, p.unique_code, p.created_at, mr.record_code
                 FROM patients p
                 LEFT JOIN medical_records mr ON p.id = mr.patient_id
                 WHERE p.created_by = $1
                 ORDER BY p.created_at DESC
                 LIMIT 5`,
                [doctorId]
            );
            
            // Dernières consultations
            const recentConsultationsResult = await pool.query(
                `SELECT c.id, p.full_name as patient_name, c.consultation_date, c.diagnosis
                 FROM consultations c
                 JOIN medical_records mr ON c.medical_record_id = mr.id
                 JOIN patients p ON mr.patient_id = p.id
                 WHERE c.doctor_id = $1
                 ORDER BY c.consultation_date DESC
                 LIMIT 5`,
                [doctorId]
            );
            
            res.json({
                statistics: {
                    total_patients: parseInt(patientCountResult.rows[0].count),
                    monthly_consultations: parseInt(consultationCountResult.rows[0].count),
                    recent_patients: recentPatientsResult.rows,
                    recent_consultations: recentConsultationsResult.rows
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    }
    
    // Rechercher un carnet médical (pour le docteur)
    static async searchMedicalRecord(req, res) {
        try {
            const doctorId = req.user.id;
            const { search_term, search_type } = req.query;
            
            if (!search_term) {
                return res.status(400).json({ error: 'Search term is required' });
            }
            
            let results = [];
            
            if (search_type === 'patient_name') {
                // Recherche par nom de patient
                const result = await pool.query(
                    `SELECT p.*, mr.record_code 
                     FROM patients p
                     LEFT JOIN medical_records mr ON p.id = mr.patient_id
                     WHERE p.full_name ILIKE $1 AND p.created_by = $2`,
                    [`%${search_term}%`, doctorId]
                );
                results = result.rows;
            } else if (search_type === 'record_code') {
                // Recherche par code de dossier
                const result = await pool.query(
                    `SELECT p.*, mr.record_code 
                     FROM patients p
                     JOIN medical_records mr ON p.id = mr.patient_id
                     WHERE mr.record_code = $1 AND mr.doctor_id = $2`,
                    [search_term, doctorId]
                );
                results = result.rows;
            } else if (search_type === 'patient_code') {
                // Recherche par code patient
                const result = await pool.query(
                    `SELECT p.*, mr.record_code 
                     FROM patients p
                     LEFT JOIN medical_records mr ON p.id = mr.patient_id
                     WHERE p.unique_code = $1 AND p.created_by = $2`,
                    [search_term, doctorId]
                );
                results = result.rows;
            }
            
            res.json({
                results
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Search failed' });
        }
    }
    
    // Obtenir tous les carnets médicaux gérés par le docteur
    static async getAllMedicalRecords(req, res) {
        try {
            const doctorId = req.user.id;
            
            const result = await pool.query(
                `SELECT mr.*, p.full_name as patient_name, p.date_of_birth, p.gender,
                 COUNT(c.id) as consultation_count
                 FROM medical_records mr
                 JOIN patients p ON mr.patient_id = p.id
                 LEFT JOIN consultations c ON mr.id = c.medical_record_id
                 WHERE mr.doctor_id = $1
                 GROUP BY mr.id, p.id, p.full_name, p.date_of_birth, p.gender
                 ORDER BY p.full_name`,
                [doctorId]
            );
            
            res.json({
                medical_records: result.rows
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch medical records' });
        }
    }
    
    // Changer le mot de passe
    static async changePassword(req, res) {
        try {
            const doctorId = req.user.id;
            const { current_password, new_password } = req.body;
            
            if (!current_password || !new_password) {
                return res.status(400).json({ error: 'Both passwords are required' });
            }
            
            // Récupérer le docteur
            const doctor = await Doctor.findById(doctorId);
            if (!doctor) {
                return res.status(404).json({ error: 'Doctor not found' });
            }
            
            // Vérifier l'ancien mot de passe
            const isValidPassword = await Doctor.comparePassword(current_password, doctor.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }
            
            // Mettre à jour avec le nouveau mot de passe
            const hashedPassword = await bcrypt.hash(new_password, 10);
            await pool.query(
                'UPDATE doctors SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [hashedPassword, doctorId]
            );
            
            res.json({
                message: 'Password changed successfully'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to change password' });
        }
    }
}

export default DoctorController;