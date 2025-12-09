import pool from '../config/database.js';
import Doctor from '../models/doctor.js';
import Patient from '../models/patient.js';
import MedicalRecord from '../models/medicalrecord.js';

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
            
            if (full_name) {
                fields.push('full_name = ?');
                values.push(full_name);
            }
            
            if (specialization) {
                fields.push('specialization = ?');
                values.push(specialization);
            }
            
            if (phone_number) {
                fields.push('phone_number = ?');
                values.push(phone_number);
            }
            
            if (fields.length === 0) {
                return res.status(400).json({ error: 'No data to update' });
            }
            
            values.push(doctorId);
            
            await pool.execute(
                `UPDATE doctors SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
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
            const [patientCount] = await pool.execute(
                'SELECT COUNT(*) as count FROM patients WHERE created_by = ?',
                [doctorId]
            );
            
            // Compter les consultations du mois
            const [consultationCount] = await pool.execute(
                `SELECT COUNT(*) as count FROM consultations c
                 JOIN medical_records mr ON c.medical_record_id = mr.id
                 WHERE mr.doctor_id = ? AND MONTH(c.consultation_date) = MONTH(CURRENT_DATE())`,
                [doctorId]
            );
            
            // Derniers patients ajoutés
            const [recentPatients] = await pool.execute(
                `SELECT p.id, p.full_name, p.unique_code, p.created_at, mr.record_code
                 FROM patients p
                 LEFT JOIN medical_records mr ON p.id = mr.patient_id
                 WHERE p.created_by = ?
                 ORDER BY p.created_at DESC
                 LIMIT 5`,
                [doctorId]
            );
            
            // Dernières consultations
            const [recentConsultations] = await pool.execute(
                `SELECT c.id, p.full_name as patient_name, c.consultation_date, c.diagnosis
                 FROM consultations c
                 JOIN medical_records mr ON c.medical_record_id = mr.id
                 JOIN patients p ON mr.patient_id = p.id
                 WHERE c.doctor_id = ?
                 ORDER BY c.consultation_date DESC
                 LIMIT 5`,
                [doctorId]
            );
            
            res.json({
                statistics: {
                    total_patients: patientCount[0].count,
                    monthly_consultations: consultationCount[0].count,
                    recent_patients: recentPatients,
                    recent_consultations: recentConsultations
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
                const [rows] = await pool.execute(
                    `SELECT p.*, mr.record_code 
                     FROM patients p
                     LEFT JOIN medical_records mr ON p.id = mr.patient_id
                     WHERE p.full_name LIKE ? AND p.created_by = ?`,
                    [`%${search_term}%`, doctorId]
                );
                results = rows;
            } else if (search_type === 'record_code') {
                // Recherche par code de dossier
                const [rows] = await pool.execute(
                    `SELECT p.*, mr.record_code 
                     FROM patients p
                     JOIN medical_records mr ON p.id = mr.patient_id
                     WHERE mr.record_code = ? AND mr.doctor_id = ?`,
                    [search_term, doctorId]
                );
                results = rows;
            } else if (search_type === 'patient_code') {
                // Recherche par code patient
                const [rows] = await pool.execute(
                    `SELECT p.*, mr.record_code 
                     FROM patients p
                     LEFT JOIN medical_records mr ON p.id = mr.patient_id
                     WHERE p.unique_code = ? AND p.created_by = ?`,
                    [search_term, doctorId]
                );
                results = rows;
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
            
            const [rows] = await pool.execute(
                `SELECT mr.*, p.full_name as patient_name, p.date_of_birth, p.gender,
                 COUNT(c.id) as consultation_count
                 FROM medical_records mr
                 JOIN patients p ON mr.patient_id = p.id
                 LEFT JOIN consultations c ON mr.id = c.medical_record_id
                 WHERE mr.doctor_id = ?
                 GROUP BY mr.id
                 ORDER BY p.full_name`,
                [doctorId]
            );
            
            res.json({
                medical_records: rows
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
            await pool.execute(
                'UPDATE doctors SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
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