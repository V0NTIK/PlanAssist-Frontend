import React from 'react';

export default function Shutdown() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#faf9ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    }}>
      <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>

        {/* Logo */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          boxShadow: '0 4px 20px rgba(109,40,217,0.25)',
        }}>
          {/* BookOpen icon (inline SVG) */}
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        </div>

        {/* Wordmark */}
        <p style={{
          fontSize: '0.75rem',
          fontWeight: '700',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#7c3aed',
          marginBottom: '2.5rem',
        }}>PlanAssist</p>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid #e5e3f0', marginBottom: '2.5rem' }} />

        {/* Message */}
        <div style={{
          color: '#374151',
          fontSize: '0.975rem',
          lineHeight: '1.85',
          textAlign: 'left',
        }}>
          <p style={{ marginBottom: '1.25rem' }}>PlanAssist Users,</p>

          <p style={{ marginBottom: '1.25rem' }}>
            Thank you very much for your commitment and dedication to using PlanAssist over the
            past year, and enhancing your planning and execution skills through its abilities.
          </p>

          <p style={{ marginBottom: '1.25rem', fontStyle: 'italic', color: '#4b5563' }}>
            I regret to inform you that OneSchool has called for the immediate shutdown of
            PlanAssist, and a discontinuation of all operations.
          </p>

          <p style={{ marginBottom: '1.25rem' }}>
            OneSchool has cited safety concerns and a lack of full approval for school use
            as reasons for verdict.
          </p>

          <p style={{ marginBottom: '1.25rem' }}>
            Again, I'd like to thank all student and staff users for their support throughout
            the tenure of PlanAssist. We achieved nearly{' '}
            <strong style={{ color: '#6d28d9' }}>400 signups globally</strong> with nearly{' '}
            <strong style={{ color: '#6d28d9' }}>4,000 tasks completed</strong> with{' '}
            <strong style={{ color: '#6d28d9' }}>1,802 hours and 43 minutes</strong> spent in
            sessions/agendas. It couldn't have been done without your loyalty.
          </p>

          <p style={{ marginBottom: '2rem' }}>
            I look forward to a continued global emphasis on planning and execution, undertaken
            by OneSchool Global.
          </p>

          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            ~ Orlando Wyman, PlanAssist Creator
          </p>
        </div>

        {/* Footer */}
        <hr style={{ border: 'none', borderTop: '1px solid #e5e3f0', margin: '2.5rem 0 1.25rem' }} />
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', letterSpacing: '0.05em' }}>
          PlanAssist &copy; 2024–2026
        </p>

      </div>
    </div>
  );
}
