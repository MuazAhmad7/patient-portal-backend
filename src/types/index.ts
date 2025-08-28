// Common types for the patient portal backend

export interface Patient {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  datetime: string;
  type: 'consultation' | 'follow-up' | 'procedure' | 'check-up';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  providerId: string;
  type: 'diagnosis' | 'prescription' | 'lab-result' | 'imaging' | 'note';
  title: string;
  content: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  license: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  providerId: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  status: 'active' | 'completed' | 'discontinued';
  createdAt: string;
  updatedAt: string;
}

export interface JobData {
  id: string;
  type: string;
  payload: any;
  priority?: number;
  delay?: number;
}

export interface AIAgentRequest {
  type: 'analysis' | 'recommendation' | 'classification';
  data: any;
  patientId?: string;
  context?: Record<string, any>;
}

export interface AIAgentResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId: string;
}