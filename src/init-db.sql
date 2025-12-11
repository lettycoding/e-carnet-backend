-- init-db.sql
-- PostgreSQL Schema for Medical System

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE,
    specialization VARCHAR(255),
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    unique_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    emergency_contact VARCHAR(255),
    address TEXT,
    created_by INTEGER REFERENCES doctors(id),
    fingerprint_data TEXT,
    fingerprint_image_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create medical_records table
CREATE TABLE IF NOT EXISTS medical_records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id),
    record_code VARCHAR(50) UNIQUE NOT NULL,
    blood_type VARCHAR(5),
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    allergies TEXT,
    chronic_diseases TEXT,
    current_medications TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create consultations table
CREATE TABLE IF NOT EXISTS consultations (
    id SERIAL PRIMARY KEY,
    medical_record_id INTEGER REFERENCES medical_records(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id),
    consultation_date TIMESTAMP NOT NULL,
    symptoms TEXT,
    diagnosis TEXT,
    prescription TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_doctor ON patients(created_by);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_medical_record ON consultations(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);

-- Insert a test doctor (optional)
-- INSERT INTO doctors (email, password, full_name, license_number, specialization) 
-- VALUES ('doctor@example.com', '$2a$10$YourHashedPasswordHere', 'Dr. John Doe', 'LIC12345', 'General Physician');