import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { T } from '../lib/constants'

export default function AuthScreen({ onAuth }) {
  const [step, setStep] = useState('login') // login | check_email | setup_name
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isSignUp) {
      // Sign up with email + password
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name || email.split('@')[0] } }
      })
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      if (data.user) {
        // Auto-confirmed or email confirmation not required
        if (data.session) {
          onAuth(data.user)
        } else {
          setStep('check_email')
        }
      }
    } else {
      // Sign in with email + password
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }
      if (data.user) {
        onAuth(data.user)
      }
    }
    setLoading(false)
  }

  const font = "'Inter', 'JetBrains Mono', sans-serif"

  if (step === 'check_email') {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontFamily: font }}>
        <div style={{ width: 400, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <h2 style={{ color: T.text, fontSize: 18, marginBottom: 8 }}>Verifique seu email</h2>
          <p style={{ color: T.textMuted, fontSize: 12, lineHeight: 1.6 }}>
            Enviamos um link de confirmação para <span style={{ color: T.accent }}>{email}</span>.
            Clique no link para ativar sua conta.
          </p>
          <button onClick={() => { setStep('login'); setIsSignUp(false) }} style={{ marginTop: 24, padding: '10px 24px', borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', color: T.textMuted, fontSize: 11, cursor: 'pointer', fontFamily: font }}>
            Voltar ao login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${T.bg} 0%, #0d0d1a 50%, #12101f 100%)`, fontFamily: font }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes glow { 0%, 100% { box-shadow: 0 0 30px rgba(53,31,255,0.3); } 50% { box-shadow: 0 0 50px rgba(53,31,255,0.5); } }
      `}</style>
      <div style={{ width: 440, background: `linear-gradient(145deg, ${T.surface}, ${T.surfaceAlt})`, borderRadius: 28, border: `1px solid ${T.border}`, overflow: 'hidden', boxShadow: `0 40px 100px rgba(0,0,0,0.5), 0 0 40px ${T.accentGlow}` }}>
        {/* Header */}
        <div style={{ padding: '36px 32px 28px', textAlign: 'center', background: `linear-gradient(180deg, rgba(53,31,255,0.08) 0%, transparent 100%)` }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, animation: 'float 3s ease-in-out infinite, glow 2s ease-in-out infinite', boxShadow: `0 8px 32px ${T.accentGlow}` }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text, marginBottom: 8, letterSpacing: '-0.02em' }}>voxuy<span style={{ color: T.accent }}>.office</span></h1>
          <p style={{ fontSize: 12, color: T.textMuted }}>Escritório virtual da equipe</p>
        </div>

        {/* Form */}
        <form onSubmit={handleEmailAuth} style={{ padding: '0 32px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isSignUp && (
            <div>
              <label style={{ fontSize: 10, color: T.textDim, fontWeight: 600, display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>SEU NOME</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Como o time te conhece"
                required={isSignUp}
                style={{ width: '100%', padding: '12px 16px', border: `1px solid ${T.border}`, borderRadius: 12, background: T.bg, color: T.text, fontSize: 13, fontFamily: font, outline: 'none' }}
                onFocus={e => e.target.style.borderColor = T.accent}
                onBlur={e => e.target.style.borderColor = T.border}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 10, color: T.textDim, fontWeight: 600, display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>EMAIL</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="voce@voxuy.com.br"
              required
              style={{ width: '100%', padding: '12px 16px', border: `1px solid ${T.border}`, borderRadius: 12, background: T.bg, color: T.text, fontSize: 13, fontFamily: font, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = T.accent}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>

          <div>
            <label style={{ fontSize: 10, color: T.textDim, fontWeight: 600, display: 'block', marginBottom: 4, letterSpacing: '0.06em' }}>SENHA</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={isSignUp ? "Crie uma senha (min. 6 chars)" : "Sua senha"}
              required
              minLength={6}
              style={{ width: '100%', padding: '12px 16px', border: `1px solid ${T.border}`, borderRadius: 12, background: T.bg, color: T.text, fontSize: 13, fontFamily: font, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = T.accent}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>

          {error && (
            <div style={{ padding: '8px 12px', borderRadius: 8, background: `${T.danger}15`, border: `1px solid ${T.danger}33`, color: T.danger, fontSize: 11 }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', background: loading ? T.borderLight : `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: font, marginTop: 8, boxShadow: loading ? 'none' : `0 8px 24px ${T.accentGlow}`, transition: 'all 0.2s ease', transform: loading ? 'none' : 'scale(1)' }}
            onMouseOver={e => { if (!loading) { e.target.style.transform = 'scale(1.02)'; e.target.style.boxShadow = `0 12px 32px ${T.accentGlow}`; } }}
            onMouseOut={e => { e.target.style.transform = 'scale(1)'; e.target.style.boxShadow = `0 8px 24px ${T.accentGlow}`; }}
          >
            {loading ? '...' : isSignUp ? '🚀 Criar conta e entrar' : '🔓 Entrar'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError('') }}
              style={{ background: 'none', border: 'none', color: T.accent, fontSize: 11, cursor: 'pointer', fontFamily: font }}
            >
              {isSignUp ? 'Já tem conta? Fazer login' : 'Primeira vez? Criar conta'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div style={{ padding: '12px 32px 20px', textAlign: 'center', borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 9, color: T.textDim }}>
            <span style={{ color: T.accent }}>WASD</span> mover · <span style={{ color: T.accent }}>E</span> interagir · <span style={{ color: T.accent }}>R</span> reagir
          </div>
        </div>
      </div>
    </div>
  )
}
