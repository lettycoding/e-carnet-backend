import pool from '../config/database.js';

class Patient {
    static async create(patientData) {
        const { unique_code, full_name, date_of_birth, gender, phone_number, email, emergency_contact, address, created_by, fingerprint_data, fingerprint_image_path } = patientData;
        
        const result = await pool.query(
            `INSERT INTO patients 
            (unique_code, full_name, date_of_birth, gender, phone_number, email, emergency_contact, address, created_by, fingerprint_data, fingerprint_image_path) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
            [unique_code, full_name, date_of_birth, gender, phone_number, email, emergency_contact, address, created_by, fingerprint_data, fingerprint_image_path]
        );
        return result.rows[0].id;
    }

    static async findByUniqueCode(uniqueCode) {
        const result = await pool.query('SELECT * FROM patients WHERE unique_code = $1', [uniqueCode]);
        return result.rows[0];
    }

    static async findByName(fullName) {
        const result = await pool.query('SELECT * FROM patients WHERE full_name ILIKE $1', [`%${fullName}%`]);
        return result.rows;
    }

    static async findById(id) {
        const result = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async findByFingerprint(fingerprintData) {
        const result = await pool.query('SELECT * FROM patients WHERE fingerprint_data = $1', [fingerprintData]);
        return result.rows[0];
    }

    static async getPatientsByDoctor(doctorId) {
        const result = await pool.query('SELECT * FROM patients WHERE created_by = $1', [doctorId]);
        return result.rows;
    }
}

export default Patient;