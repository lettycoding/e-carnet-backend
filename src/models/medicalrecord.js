import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class MedicalRecord {
    static async generateRecordCode() {
        return 'MR-' + uuidv4().substring(0, 8).toUpperCase();
    }

    static async create(patientId, doctorId, recordData) {
        const recordCode = await this.generateRecordCode();
        
        const { blood_type, height, weight, allergies, chronic_diseases, current_medications } = recordData;
        
        const [result] = await pool.execute(
            `INSERT INTO medical_records 
            (patient_id, doctor_id, record_code, blood_type, height, weight, allergies, chronic_diseases, current_medications) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [patientId, doctorId, recordCode, blood_type, height, weight, allergies, chronic_diseases, current_medications]
        );
        return { id: result.insertId, recordCode };
    }

    static async findByRecordCode(recordCode) {
        const [rows] = await pool.execute(
            `SELECT mr.*, p.full_name as patient_name, p.date_of_birth, p.gender,
            d.full_name as doctor_name
            FROM medical_records mr
            JOIN patients p ON mr.patient_id = p.id
            JOIN doctors d ON mr.doctor_id = d.id
            WHERE mr.record_code = ?`,
            [recordCode]
        );
        return rows[0];
    }

    static async findByPatientId(patientId) {
        const [rows] = await pool.execute(
            `SELECT mr.*, d.full_name as doctor_name 
            FROM medical_records mr
            JOIN doctors d ON mr.doctor_id = d.id
            WHERE mr.patient_id = ?`,
            [patientId]
        );
        return rows[0];
    }

    static async addConsultation(medicalRecordId, doctorId, consultationData) {
        const { consultation_date, symptoms, diagnosis, prescription, notes } = consultationData;
        
        const [result] = await pool.execute(
            `INSERT INTO consultations 
            (medical_record_id, doctor_id, consultation_date, symptoms, diagnosis, prescription, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [medicalRecordId, doctorId, consultation_date, symptoms, diagnosis, prescription, notes]
        );
        return result.insertId;
    }

    static async getConsultations(medicalRecordId) {
        const [rows] = await pool.execute(
            `SELECT c.*, d.full_name as doctor_name 
            FROM consultations c
            JOIN doctors d ON c.doctor_id = d.id
            WHERE c.medical_record_id = ?
            ORDER BY c.consultation_date DESC`,
            [medicalRecordId]
        );
        return rows;
    }
}

export default MedicalRecord;