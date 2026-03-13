import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { generatePatientCardPDF } from '@/lib/patientCardPdf';

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
            borderTop: '4px solid #0ea5e9',
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
            background: '#0ea5e9',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
            transition: 'transform 0.2s'
          }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Safety fallback
  if (!patient || !clinic) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <p style={{ color: '#94a3b8', fontSize: '16px' }}>Patient data unavailable.</p>
      </div>
    );
  }

  // Use clinic's saved colors, fallback to defaults
  const bgColor = clinic.card_background_color || '#1e293b';
  const accentColor = clinic.theme_color || '#0ea5e9';
  const clinicInitials = clinic.short_name || clinic.clinic_name?.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase();

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        {/* CARD UI */}
        <div style={{
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
          {/* Top section — dark background */}
          <div style={{ background: bgColor, padding: '24px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {clinic.logo_url ? (
                  <img src={clinic.logo_url} alt="logo" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} loading="lazy" />
                ) : (
                  <div style={{ width: '48px', height: '48px', background: accentColor, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                    {clinicInitials}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{clinicInitials}</div>
                  <div style={{ fontSize: '12px', opacity: 0.7 }}>Health Identity Card</div>
                </div>
              </div>

              {clinic.qr_base_url && (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(clinic.qr_base_url)}`}
                  alt="QR Code"
                  style={{ width: '64px', height: '64px', borderRadius: '4px', background: 'white', padding: '2px' }}
                  loading="lazy"
                />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Patient Name</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', marginTop: '4px' }}>{patient.full_name}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Patient ID</div>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: accentColor, marginTop: '4px' }}>{patient.patient_id || patient.formatted_patient_id || patient.id}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Age</div>
                <div style={{ fontWeight: 'bold', marginTop: '4px' }}>{patient.age}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Gender</div>
                <div style={{ fontWeight: 'bold', marginTop: '4px' }}>{patient.gender}</div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>Registered</div>
                <div style={{ fontWeight: 'bold', marginTop: '4px' }}>{new Date(patient.created_at).toLocaleDateString('en-GB')}</div>
              </div>
            </div>
          </div>

          {/* Bottom section — white */}
          <div style={{ background: 'white', padding: '20px' }}>
            {clinic.terms_conditions && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>Terms & Conditions</div>
                <p style={{ fontSize: '12px', color: '#555', lineHeight: 1.5, margin: 0 }}>{clinic.terms_conditions}</p>
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#555', borderTop: '1px solid #eee', paddingTop: '12px' }}>
              {clinic.address && <div>📍 {clinic.address}</div>}
              {clinic.contact_phone && <div style={{ marginTop: '4px' }}>📞 {clinic.contact_phone}</div>}
              {clinic.contact_email && <div style={{ marginTop: '4px' }}>✉️ {clinic.contact_email}</div>}
              {clinic.working_hours && <div style={{ marginTop: '4px' }}>🕐 {clinic.working_hours}</div>}
            </div>
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '10px', color: '#aaa', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Validated Digital Health Record
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button
            onClick={() => generatePatientCardPDF(patient, clinic)}
            style={{
              background: '#0d9488',
              color: 'white',
              border: 'none',
              padding: '16px 40px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 15px -3px rgba(13, 148, 136, 0.4)',
              transition: 'all 0.2s',
              width: '100%',
              justifyContent: 'center'
            }}
          >
            <span style={{ fontSize: '20px' }}>⬇️</span> Download Patient Card PDF
          </button>

          <Link to="/" style={{
            display: 'block',
            marginTop: '20px',
            color: '#64748b',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
