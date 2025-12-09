import crypto from 'crypto';


class FingerprintUtils {
    // Convertir l'image d'empreinte digitale en hash
    static async imageToHash(imageBuffer) {
        return crypto.createHash('sha256').update(imageBuffer).digest('hex');
    }
    
    // Comparer deux empreintes digitales
    static compareFingerprints(hash1, hash2) {
        return hash1 === hash2;
    }
    
    // Extraire les caractéristiques de l'empreinte (simplifié)
    static extractFeatures(imageBuffer) {
        // Note: Dans une application réelle, vous utiliseriez une bibliothèque 
        // spécialisée comme OpenCV ou un service cloud pour l'extraction d'empreintes
        // Ceci est une implémentation simplifiée
        const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
        return {
            hash,
            features: [] // À implémenter avec une vraie bibliothèque
        };
    }
}

module.exports = FingerprintUtils;