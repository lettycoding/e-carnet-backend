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
    const { 
        plaintes,          // Renommer en symptoms dans la base
        examen,            // Renommer en diagnosis dans la base
        prescription, 
        prochain_rdv,      // Garder pour la colonne prochain_rdv
        notes,
        consultation_date  // Peut être undefined
    } = consultationData;
    
    // Utiliser la date envoyée ou la date actuelle
    const consultationDate = consultation_date || new Date();
    
    const result = await pool.query(
        `INSERT INTO consultations 
        (medical_record_id, doctor_id, consultation_date, symptoms, diagnosis, prescription, notes) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [

            medicalRecordId, 
            doctorId, 
            consultationDate,          // $3: consultation_date
            plaintes || null,          // $4: symptoms (plaintes)
            examen || null,            // $5: diagnosis (examen)
            prescription || null,      // $6: prescription     
            notes || null              // $8: notes
        ]
    );
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
        return result.rows;
    }
}

export default MedicalRecord;