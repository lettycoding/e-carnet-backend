

import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

class Doctor {
    static async create(email, password, fullName, licenseNumber, specialization) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO doctors (email, password, full_name, license_number, specialization) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, fullName, licenseNumber, specialization]
        );
        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await pool.execute('SELECT * FROM doctors WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await pool.execute('SELECT * FROM doctors WHERE id = ?', [id]);
        return rows[0];
    }

    static async comparePassword(candidatePassword, hashedPassword) {
        return await bcrypt.compare(candidatePassword, hashedPassword);
    }
}

export default Doctor;