import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

export default function PatientCard() {
  const [patient, setPatient] = useState<any>(null);
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Step 1: get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          setError('You are not logged in. Please login to view your patient card.');
          setLoading(false);
          return;
        }

        const userId = session.user.id;

        // Step 2: fetch patient record
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (patientError) {
          setError('Error loading patient data: ' + patientError.message);
          setLoading(false);
          return;
        }

        if (!patientData) {
          setError('No patient record found for your account. Please register as a patient first.');
          setLoading(false);
          return;
        }

        // Step 3: fetch clinic using patient's own clinic_id
        const { data: clinicData, error: clinicError } = await supabase
          .from('clinics')
          .select('*')
          .eq('id', patientData.clinic_id)
          .maybeSingle();

        if (clinicError) {
          setError('Error loading clinic data: ' + clinicError.message);
          setLoading(false);
          return;
        }

        if (!clinicData) {
          setError('Clinic not found.');
          setLoading(false);
          return;
        }

        // Step 4: set both — this triggers the card render
        setPatient(patientData);
        setClinic(clinicData);
      } catch (err: any) {
        setError('Unexpected error: ' + (err?.message || 'Unknown'));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #0d9488',
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ fontSize: '18px', color: '#64748b', fontWeight: '500' }}>Loading your patient card...</p>
          <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff1f2' }}>
        <div style={{ textAlign: 'center', padding: '40px', maxWidth: '400px', background: 'white', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <p style={{ color: '#be123c', fontSize: '18px', marginBottom: '24px', fontWeight: '600', lineHeight: '1.4' }}>{error}</p>
          <Link to="/login" style={{
            display: 'inline-block',
            padding: '14px 32px',
            background: '#0d9488',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
            transition: 'transform 0.2s'
          }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Safety fallback — should never reach here but prevents blank page
  if (!patient || !clinic) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>Patient data unavailable.</p>
      </div>
    );
  }

  // MAIN CARD — render everything inline here, do NOT delegate to a child component
  return (
    <div style={{ minHeight: '100vh', background: '#f0fdfa', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
        border: '1px solid rgba(13, 148, 136, 0.1)'
      }}>
        {/* Card Header */}
        <div style={{ background: '#0d9488', padding: '32px', color: 'white', textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
            {clinic.clinic_name}
          </h1>
          <div style={{
            display: 'inline-block',
            marginTop: '12px',
            padding: '4px 16px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Official Patient Identity Card
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <span style={{ color: '#64748b', fontWeight: '500' }}>Patient ID</span>
              <span style={{ color: '#0f172a', fontWeight: '700', fontFamily: 'monospace', fontSize: '16px' }}>{patient.formatted_patient_id || patient.patient_id || patient.id}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <span style={{ color: '#64748b', fontWeight: '500' }}>Full Name</span>
              <span style={{ color: '#0f172a', fontWeight: '600' }}>{patient.full_name}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#64748b', fontWeight: '500', fontSize: '13px' }}>Gender</span>
                <span style={{ color: '#0f172a', fontWeight: '600', textTransform: 'capitalize' }}>{patient.gender}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#64748b', fontWeight: '500', fontSize: '13px' }}>Age</span>
                <span style={{ color: '#0f172a', fontWeight: '600' }}>{patient.age} Years</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ color: '#64748b', fontWeight: '500', fontSize: '13px' }}>Contact Email</span>
              <span style={{ color: '#0f172a', fontWeight: '600' }}>{patient.email}</span>
            </div>

            {patient.phone && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#64748b', fontWeight: '500', fontSize: '13px' }}>Phone Number</span>
                <span style={{ color: '#0f172a', fontWeight: '600' }}>{patient.phone}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '15px', borderTop: '2px dashed #e2e8f0' }}>
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>Issued On</span>
              <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '600' }}>{new Date(patient.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div style={{ background: '#f8fafc', padding: '24px 32px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
            <div style={{ fontWeight: '700', color: '#0d9488', marginBottom: '4px' }}>{clinic.clinic_name}</div>
            {clinic.address && <div style={{ display: 'flex', gap: '8px' }}>📍 <span>{clinic.address}</span></div>}
            {clinic.phone && <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>📞 <span>{clinic.phone}</span></div>}
          </div>
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Validated Digital Health Record
            </p>
          </div>
        </div>
      </div>

      <p style={{ marginTop: '32px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
        Powered by <strong style={{ color: '#64748b' }}>ClinicToken CMS Pro</strong>
      </p>
    </div>
  );
}
