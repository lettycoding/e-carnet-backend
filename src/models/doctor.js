import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

class Doctor {
    static async create(email, password, fullName, licenseNumber, specialization) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO doctors (email, password, full_name, license_number, specialization) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [email, hashedPassword, fullName, licenseNumber, specialization]
        );
        return result.rows[0].id;
    }

    static async findByEmail(email) {
        const result = await pool.query('SELECT * FROM doctors WHERE email = $1', [email]);
        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query('SELECT * FROM doctors WHERE id = $1', [id]);
        return result.rows[0];
    }

    static async comparePassword(candidatePassword, hashedPassword) {
        return await bcrypt.compare(candidatePassword, hashedPassword);
    }
}

export default Doctor;