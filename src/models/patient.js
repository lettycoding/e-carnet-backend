
import pool from '../config/database.js';

class Patient {
    static async create(patientData) {
        const { unique_code, full_name, date_of_birth, gender, phone_number, email, emergency_contact, address, created_by, fingerprint_data, fingerprint_image_path } = patientData;
        
        const [result] = await pool.execute(
            `INSERT INTO patients 
            (unique_code, full_name, date_of_birth, gender, phone_number, email, emergency_contact, address, created_by, fingerprint_data, fingerprint_image_path) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [unique_code, full_name, date_of_birth, gender, phone_number, email, emergency_contact, address, created_by, fingerprint_data, fingerprint_image_path]
        );
        return result.insertId;
    }

    static async findByUniqueCode(uniqueCode) {
        const [rows] = await pool.execute('SELECT * FROM patients WHERE unique_code = ?', [uniqueCode]);
        return rows[0];
    }

    static async findByName(fullName) {
        const [rows] = await pool.execute('SELECT * FROM patients WHERE full_name LIKE ?', [`%${fullName}%`]);
        return rows;
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM patients WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByFingerprint(fingerprintData) {
        const [rows] = await pool.execute('SELECT * FROM patients WHERE fingerprint_data = ?', [fingerprintData]);
        return rows[0];
    }

    static async getPatientsByDoctor(doctorId) {
        const [rows] = await pool.execute('SELECT * FROM patients WHERE created_by = ?', [doctorId]);
        return rows;
    }
}

export default Patient;