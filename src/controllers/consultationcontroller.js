import MedicalRecord from '../models/medicalrecord.js';

class ConsultationController {
    static async createConsultation(req, res) {
        try {
            const { medicalRecordId } = req.params;
            const doctorId = req.user.id; // ID du médecin connecté
            const consultationData = req.body;
            consultationData.consultation_date = new Date(); 

            const consultationId = await MedicalRecord.addConsultation(
                medicalRecordId, 
                doctorId, 
                consultationData
            );

            res.status(201).json({
                success: true,
                message: 'Consultation créée avec succès',
                consultationId
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de la consultation',
                error: error.message
            });
        }
    }

    static async getConsultations(req, res) {
        try {
            const { medicalRecordId } = req.params;
            const consultations = await MedicalRecord.getConsultations(medicalRecordId);

            res.status(200).json({
                success: true,
                consultations
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des consultations',
                error: error.message
            });
        }
    }

    static async getConsultationDetail(req, res) {
        try {
            const { consultationId } = req.params;
            const consultation = await MedicalRecord.getConsultationById(consultationId);

            if (!consultation) {
                return res.status(404).json({
                    success: false,
                    message: 'Consultation non trouvée'
                });
            }

            res.status(200).json({
                success: true,
                consultation
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de la consultation',
                error: error.message
            });
        }
    }

    static async updateConsultation(req, res) {
        try {
            const { consultationId } = req.params;
            const doctorId = req.user.id;
            const consultationData = req.body;

            const updatedId = await MedicalRecord.updateConsultation(
                consultationId,
                consultationData,
                doctorId
            );

            res.status(200).json({
                success: true,
                message: 'Consultation mise à jour avec succès',
                consultationId: updatedId
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour de la consultation',
                error: error.message
            });
        }
    }

    static async deleteConsultation(req, res) {
        try {
            const { consultationId } = req.params;
            const deleted = await MedicalRecord.deleteConsultation(consultationId);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'Consultation non trouvée'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Consultation supprimée avec succès'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de la consultation',
                error: error.message
            });
        }
    }

    static async getPatientConsultations(req, res) {
        try {
            const { patientId } = req.params;
            const consultations = await MedicalRecord.getPatientConsultations(patientId);

            res.status(200).json({
                success: true,
                consultations
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des consultations du patient',
                error: error.message
            });
        }
    }
}

export default ConsultationController;