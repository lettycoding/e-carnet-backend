import MedicalRecord from '../models/medicalrecord.js';
import Patient from '../models/patient.js';
import pool from '../config/database.js';

class MedicalRecordController {
    // Accéder au carnet médical avec le code unique
    static async accessMedicalRecord(req, res) {
        try {
            const { record_code } = req.body;
            
            if (!record_code) {
                return res.status(400).json({ error: 'Record code is required' });
            }
            
            const medicalRecord = await MedicalRecord.findByRecordCode(record_code);
            
            if (!medicalRecord) {
                return res.status(404).json({ error: 'Medical record not found' });
            }
            
            // Récupérer les consultations
            const consultations = await MedicalRecord.getConsultations(medicalRecord.id);
            
            res.json({
                medical_record: medicalRecord,
                consultations
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to access medical record' });
        }
    }
    
    // Ajouter une consultation
    static async addConsultation(req, res) {
        try {
            const doctorId = req.user.id;
            const { medical_record_id } = req.params;
            const { consultation_date, symptoms, diagnosis, prescription, notes } = req.body;
            
            const consultationId = await MedicalRecord.addConsultation(
                medical_record_id, 
                doctorId, 
                { consultation_date, symptoms, diagnosis, prescription, notes }
            );
            
            res.status(201).json({
                message: 'Consultation added successfully',
                consultation_id: consultationId
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to add consultation' });
        }
    }
    
    // Obtenir le carnet médical d'un patient inconscient (par empreinte)
    static async getRecordByFingerprint(req, res) {
        try {
            const { fingerprint_data } = req.body;
            
            // Trouver le patient par empreinte
            const patient = await Patient.findByFingerprint(fingerprint_data);
            
            if (!patient) {
                return res.status(404).json({ error: 'Patient not found' });
            }
            
            // Trouver le carnet médical
            const medicalRecord = await MedicalRecord.findByPatientId(patient.id);
            
            if (!medicalRecord) {
                return res.status(404).json({ error: 'Medical record not found' });
            }
            
            // Récupérer les consultations
            const consultations = await MedicalRecord.getConsultations(medicalRecord.id);
            
            res.json({
                patient: {
                    id: patient.id,
                    full_name: patient.full_name,
                    date_of_birth: patient.date_of_birth,
                    gender: patient.gender
                },
                medical_record: medicalRecord,
                consultations
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to retrieve medical record' });
        }
    }
    
    // Mettre à jour les informations médicales
    static async updateMedicalInfo(req, res) {
        try {
            const { medical_record_id } = req.params;
            const updateData = req.body;
            
            // Construire la requête dynamiquement
            const fields = [];
            const values = [];
            let paramCount = 1;
            
            Object.keys(updateData).forEach(key => {
                fields.push(`${key} = $${paramCount}`);
                values.push(updateData[key]);
                paramCount++;
            });
            
            if (fields.length === 0) {
                return res.status(400).json({ error: 'No data to update' });
            }
            
            values.push(medical_record_id);
            
            await pool.query(
                `UPDATE medical_records SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`,
                values
            );
            
            res.json({
                message: 'Medical information updated successfully'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update medical information' });
        }
    }
}

export default MedicalRecordController;