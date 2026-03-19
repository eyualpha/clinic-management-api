import Doctor from "../models/doctor.js";
import MedicalRecord from "../models/medicalRecord.js";
import Patient from "../models/patient.js";

async function resolveDoctorAccess(req, patient) {
  if (req.user.role === "admin") {
    return { allowed: true, doctorProfile: null };
  }

  const doctorProfile = await Doctor.findOne({ user: req.user.id });
  if (!doctorProfile) {
    return { allowed: false, reason: "Doctor profile not found" };
  }

  const assignedDoctorId = patient.assignedDoctor?._id
    ? patient.assignedDoctor._id.toString()
    : patient.assignedDoctor?.toString();

  if (!assignedDoctorId || assignedDoctorId !== doctorProfile._id.toString()) {
    return {
      allowed: false,
      reason: "You can only access records for patients assigned to you",
    };
  }

  return { allowed: true, doctorProfile };
}

export async function listDoctors(req, res) {
  try {
    const doctors = await Doctor.find().populate(
      "user",
      "firstName lastName email role",
    );

    return res.status(200).json({ doctors });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to load doctors",
      error: err.message,
    });
  }
}

export async function addMedicalRecord(req, res) {
  try {
    const { patientId } = req.params;
    const { diagnosis, treatment, prescription, serviceFee, notes } = req.body;

    if (!diagnosis || serviceFee == null) {
      return res
        .status(400)
        .json({ message: "diagnosis and serviceFee are required" });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const access = await resolveDoctorAccess(req, patient);
    if (!access.allowed) {
      return res
        .status(access.reason === "Doctor profile not found" ? 404 : 403)
        .json({
          message: access.reason,
        });
    }

    const doctorId = access.doctorProfile?._id || patient.assignedDoctor;

    const record = await MedicalRecord.create({
      patient: patient._id,
      doctor: doctorId,
      diagnosis,
      treatment,
      prescription,
      serviceFee,
      notes,
    });

    return res.status(201).json({
      message: "Medical record added successfully",
      medicalRecord: record,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to add medical record",
      error: err.message,
    });
  }
}

export async function getPatientMedicalHistory(req, res) {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId).populate({
      path: "assignedDoctor",
      populate: { path: "user", select: "firstName lastName email" },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const access = await resolveDoctorAccess(req, patient);
    if (!access.allowed) {
      return res
        .status(access.reason === "Doctor profile not found" ? 404 : 403)
        .json({
          message: access.reason,
        });
    }

    const history = await MedicalRecord.find({ patient: patientId })
      .sort({ createdAt: -1 })
      .populate({
        path: "doctor",
        populate: { path: "user", select: "firstName lastName email" },
      });

    return res.status(200).json({
      patient,
      recordsCount: history.length,
      medicalHistory: history,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch patient medical history",
      error: err.message,
    });
  }
}

export default { listDoctors, addMedicalRecord, getPatientMedicalHistory };
