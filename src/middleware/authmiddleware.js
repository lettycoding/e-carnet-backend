
import jwt from 'jsonwebtoken';

const authMiddleware = {
    // Authentification pour les docteurs
    authenticateDoctor: (req, res, next) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({ error: 'Access denied. No token provided.' });
            }
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            
            // Vérifier que l'utilisateur est un docteur
            if (decoded.role !== 'doctor') {
                return res.status(403).json({ error: 'Access denied. Doctor role required.' });
            }
            
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ error: 'Invalid token' });
        }
    },
    
    // Authentification pour les patients (via code unique)
    authenticatePatient: (req, res, next) => {
        try {
            const { record_code } = req.body;
            
            if (!record_code) {
                return res.status(401).json({ error: 'Medical record code required' });
            }
            
            // Ici, on pourrait vérifier si le code existe dans la base de données
            req.recordCode = record_code;
            next();
        } catch (error) {
            res.status(401).json({ error: 'Authentication failed' });
        }
    }
};

export default authMiddleware;