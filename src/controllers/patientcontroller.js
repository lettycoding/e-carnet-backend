
import Patient from '../models/patient.js';
import MedicalRecord from '../models/medicalrecord.js';
import { v4 as uuidv4 } from 'uuid';
class PatientController {
    // Créer un patient (par le docteur)
    static async createPatient(req, res) {
        try {
            const doctorId = req.user.id;
            const { 
                full_name, 
                date_of_birth, 
                gender, 
                phone_number, 
                email, 
                emergency_contact, 
                address,
                medical_info 
            } = req.body;
            
            // Générer un code unique pour le patient
            const uniqueCode = 'PAT-' + uuidv4().substring(0, 8).toUpperCase();
            
            // Créer le patient
            const patientData = {
                unique_code: uniqueCode,
                full_name,
                date_of_birth,
                gender,
                phone_number,
                email,
                emergency_contact,
                address,
                created_by: doctorId,
                fingerprint_data: null,
                fingerprint_image_path: null
            };
            
            const patientId = await Patient.create(patientData);
            
            // Créer automatiquement le carnet médical
            const medicalRecord = await MedicalRecord.create(patientId, doctorId, medical_info);
            
            res.status(201).json({
                message: 'Patient and medical record created successfully',
                patient: {
                    id: patientId,
                    unique_code: uniqueCode,
                    full_name,
                    date_of_birth
                },
                medical_record: {
                    record_code: medicalRecord.recordCode
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create patient' });
        }
    }
    
    // Rechercher un patient par nom
    static async searchPatientByName(req, res) {
        try {
            const { full_name } = req.query;
            
            if (!full_name) {
                return res.status(400).json({ error: 'Name is required' });
            }
            
            const patients = await Patient.findByName(full_name);
            
            res.json({
                patients
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Search failed' });
        }
    }
    
    // Ajouter une empreinte digitale
    static async addFingerprint(req, res) {
        try {
            const { patient_id } = req.params;
            const { fingerprint_data } = req.body;
            const fingerprint_image_path = req.file ? req.file.path : null;
            
            // Vérifier si le patient existe
            const patient = await Patient.findById(patient_id);
            if (!patient) {
                return res.status(404).json({ error: 'Patient not found' });
            }
            
            // Mettre à jour l'empreinte digitale
            await pool.execute(
                'UPDATE patients SET fingerprint_data = ?, fingerprint_image_path = ? WHERE id = ?',
                [fingerprint_data, fingerprint_image_path, patient_id]
            );
            
            res.json({
                message: 'Fingerprint added successfully'
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to add fingerprint' });
        }
    }
    
    // Rechercher par empreinte digitale
    static async searchByFingerprint(req, res) {
        try {
            const { fingerprint_data } = req.body;
            
            if (!fingerprint_data) {
                return res.status(400).json({ error: 'Fingerprint data is required' });
            }
            
            const patient = await Patient.findByFingerprint(fingerprint_data);
            
            if (!patient) {
                return res.status(404).json({ error: 'No patient found with this fingerprint' });
            }
            
            res.json({
                patient
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Search failed' });
        }
    }
    
    // Obtenir tous les patients d'un médecin
    static async getDoctorPatients(req, res) {
        try {
            const doctorId = req.user.id;
            const patients = await Patient.getPatientsByDoctor(doctorId);
            
            res.json({
                patients
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch patients' });
        }
    }
}

export default PatientController;