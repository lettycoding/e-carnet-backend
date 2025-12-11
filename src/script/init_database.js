// scripts/init-database.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initializeDatabase() {
    let client;
    try {
        console.log('🔍 Checking database connection...');
        
        // Get a client from the pool
        client = await pool.connect();
        
        // 1. Check if database exists, create if not
        console.log('📦 Setting up database...');
        
        // 2. Read and execute SQL file
        const sqlPath = path.join(__dirname, '..', 'init-db.sql');
        
        if (!fs.existsSync(sqlPath)) {
            throw new Error(`SQL file not found: ${sqlPath}`);
        }
        
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Split SQL into individual statements
        const statements = sql
            .split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0);
        
        console.log(`📊 Executing ${statements.length} SQL statements...`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            try {
                await client.query(statement);
                console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
            } catch (error) {
                // Ignore "already exists" errors for CREATE TABLE
                if (!error.message.includes('already exists') && 
                    !error.message.includes('duplicate key')) {
                    console.warn(`⚠️ Warning on statement ${i + 1}:`, error.message);
                }
            }
        }
        
        console.log('✅ Database initialized successfully!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        
        // Check if it's a "database does not exist" error
        if (error.message.includes('database "medical_system" does not exist')) {
            console.log('🔄 Database does not exist. Please create it manually first:');
            console.log('   sudo -u postgres psql -c "CREATE DATABASE medical_system;"');
            console.log('   Then restart the server.');
        }
        
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
}

export default initializeDatabase;