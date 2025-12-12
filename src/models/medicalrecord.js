import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class MedicalRecord {
    static async generateRecordCode() {
        return 'MR-' + uuidv4().substring(0, 8).toUpperCase();
    }

    static async create(patientId, doctorId, recordData) {
        const recordCode = await this.generateRecordCode();
        
        const { blood_type, height, weight, allergies, chronic_diseases, current_medications } = recordData;
         
        const result = await pool.query(
            `INSERT INTO medical_records 
            (patient_id, doctor_id, record_code, blood_type, height, weight, allergies, chronic_diseases, current_medications) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [patientId, doctorId, recordCode, blood_type, height, weight, allergies, chronic_diseases, current_medications]
        );
        return { id: result.rows[0].id, recordCode };
    }

    static async findByRecordCode(recordCode) {
        const result = await pool.query(
            `SELECT mr.*, p.full_name as patient_name, p.date_of_birth, p.gender,
            d.full_name as doctor_name
            FROM medical_records mr
            JOIN patients p ON mr.patient_id = p.id
            JOIN doctors d ON mr.doctor_id = d.id
            WHERE mr.record_code = $1`,
            [recordCode]
        );
        return result.rows[0];
    }

    static async findByPatientId(patientId) {
        const result = await pool.query(
            `SELECT mr.*, d.full_name as doctor_name 
            FROM medical_records mr
            JOIN doctors d ON mr.doctor_id = d.id
            WHERE mr.patient_id = $1`,
            [patientId]
        );
        return result.rows[0];
    }

    static async addConsultation(medicalRecordId, doctorId, consultationData) {
    console.log('=== Données reçues addConsultation ===');
    console.log('consultationData:', consultationData);
    
    // MAPPING: plaintes (API) → symptoms (BD), examen (API) → diagnosis (BD)
    const symptoms = consultationData.plaintes || consultationData.symptoms || consultationData.symtoms;
    const diagnosis = consultationData.examen || consultationData.diagnosis;
    const prescription = consultationData.prescription;
    const notes = consultationData.notes;
    
    // Date obligatoire
    const consultationDate = consultationData.consultation_date || new Date();
    
    console.log('=== Mapping des données ===');
    console.log('symptoms (plaintes):', symptoms);
    console.log('diagnosis (examen):', diagnosis);
    console.log('prescription:', prescription);
    console.log('notes:', notes);
    console.log('consultationDate:', consultationDate);
    
    const result = await pool.query(
        `INSERT INTO consultations 
        (medical_record_id, doctor_id, consultation_date, symptoms, diagnosis, prescription, notes) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
            medicalRecordId,          // $1: medical_record_id
            doctorId,                 // $2: doctor_id
            consultationDate,         // $3: consultation_date
            symptoms || null,         // $4: symptoms (vient de plaintes)
            diagnosis || null,        // $5: diagnosis (vient de examen)
            prescription || null,     // $6: prescription     
            notes || null             // $7: notes
        ]
    );
    
    console.log('=== Consultation créée avec ID ===');
    console.log('ID:', result.rows[0].id);
    
    return result.rows[0].id;
}

   static async getConsultations(medicalRecordId) {
    const result = await pool.query(
        `SELECT c.*, d.full_name as doctor_name 
        FROM consultations c
        JOIN doctors d ON c.doctor_id = d.id
        WHERE c.medical_record_id = $1
        ORDER BY c.consultation_date DESC`,
        [medicalRecordId]
    );
    
    // Mapping inverse pour l'API: symptoms → plaintes, diagnosis → examen
    const formattedConsultations = result.rows.map(row => ({
        id: row.id,
        medical_record_id: row.medical_record_id,
        doctor_id: row.doctor_id,
        doctor_name: row.doctor_name,
        consultation_date: row.consultation_date,
        plaintes: row.symptoms,      // Mapping symptoms → plaintes pour l'API
        examen: row.diagnosis,       // Mapping diagnosis → examen pour l'API
        prescription: row.prescription,
        notes: row.notes,
        created_at: row.created_at
    }));
    
    return formattedConsultations;
}

    
}



export default MedicalRecord;