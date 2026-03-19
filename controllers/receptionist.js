import Doctor from "../models/doctor.js";
import Patient from "../models/patient.js";

async function findDoctor(doctorId) {
  if (doctorId) {
    return Doctor.findById(doctorId).populate(
      "user",
      "firstName lastName role",
    );
  }

  return Doctor.findOne()
    .sort({ assignedPatientsCount: 1, createdAt: 1 })
    .populate("user", "firstName lastName role");
}

async function assignDoctorToPatient(patient, doctor) {
  const previousDoctorId = patient.assignedDoctor?.toString();
  const targetDoctorId = doctor._id.toString();

  if (previousDoctorId === targetDoctorId) {
    return;
  }

  patient.assignedDoctor = doctor._id;
  await patient.save();

  await Doctor.findByIdAndUpdate(doctor._id, {
    $inc: { assignedPatientsCount: 1 },
  });

  if (previousDoctorId) {
    await Doctor.findByIdAndUpdate(previousDoctorId, {
      $inc: { assignedPatientsCount: -1 },
    });
  }
}

export async function registerPatient(req, res) {
  try {
    const {
      firstName,
      lastName,
      phone,
      age,
      gender,
      additionalInfo,
      doctorId,
    } = req.body;

    if (!firstName || !lastName || !phone) {
      return res
        .status(400)
        .json({ message: "firstName, lastName and phone are required" });
    }

    const existingPatient = await Patient.findOne({ phone });
    if (existingPatient) {
      const availableDoctor = await findDoctor(doctorId);
      if (!availableDoctor) {
        return res.status(404).json({
          message: "No available doctors found for assignment",
        });
      }

      await assignDoctorToPatient(existingPatient, availableDoctor);

      const updatedPatient = await Patient.findById(
        existingPatient._id,
      ).populate({
        path: "assignedDoctor",
        populate: { path: "user", select: "firstName lastName email" },
      });

      return res.status(200).json({
        message: "Patient already exists. Assigned an available doctor",
        patient: updatedPatient,
      });
    }

    const patient = await Patient.create({
      firstName,
      lastName,
      phone,
      age,
      gender,
      additionalInfo,
    });

    return res.status(201).json({
      message: "Patient registered successfully",
      patient,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Patient registration failed",
      error: err.message,
    });
  }
}

export async function appointDoctor(req, res) {
  try {
    const { patientId } = req.params;
    const { doctorId } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const doctor = await findDoctor(doctorId);
    if (!doctor) {
      return res.status(404).json({
        message: doctorId ? "Doctor not found" : "No available doctors found",
      });
    }

    await assignDoctorToPatient(patient, doctor);

    const assignedPatient = await Patient.findById(patient._id).populate({
      path: "assignedDoctor",
      populate: { path: "user", select: "firstName lastName email" },
    });

    return res.status(200).json({
      message: "Doctor appointed successfully",
      patient: assignedPatient,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Doctor appointment failed",
      error: err.message,
    });
  }
}

export default { registerPatient, appointDoctor };
